// @ts-check

import {
  COPING_STYLE_OPTIONS,
  ENDINGS,
  EXPERIENCE_OPTIONS,
  FEAR_FOCUS_OPTIONS,
  RELATIONSHIP_OPTIONS,
  TRIGGER_SCENE_OPTIONS,
  applyChoiceEffect,
  buildFallbackReaction,
  buildPersonalLetterPrompt,
  buildPersonalizedChapterAiPrompt,
  buildPersonalizedChapters,
  buildPreDiagnosisAiPrompt,
  buildSceneReactionPrompt,
  callGeminiWithFallback,
  createInitialMetrics,
  createStoryBlueprint,
  determineEnding,
  evaluateFreeTextAction,
  formatFileTimestamp,
  parsePersonalizedChapterRewrite,
} from './core.js';

/**
 * @typedef {import('./scenarios.js').PreDiagnosisAnswers} PreDiagnosisAnswers
 * @typedef {import('./scenarios.js').ExperienceType} ExperienceType
 * @typedef {import('./scenarios.js').TriggerSceneType} TriggerSceneType
 * @typedef {import('./scenarios.js').FearFocusType} FearFocusType
 * @typedef {import('./scenarios.js').RelationshipType} RelationshipType
 * @typedef {import('./scenarios.js').CopingStyleType} CopingStyleType
 * @typedef {import('./scenarios.js').StoryRouteId} StoryRouteId
 * @typedef {import('./scenarios.js').StoryBlueprint} StoryBlueprint
 * @typedef {import('./scenarios.js').ChapterData} ChapterData
 * @typedef {import('./scenarios.js').ChoiceEffect} ChoiceEffect
 * @typedef {import('./scenarios.js').StoryMetrics} StoryMetrics
 * @typedef {import('./scenarios.js').EndingId} EndingId
 * @typedef {import('./scenarios.js').EndingDefinition} EndingDefinition
 * @typedef {import('./core.js').ActionLogEntry} ActionLogEntry
 *
 * @typedef {'setup' | 'diagnosis' | 'blueprint' | 'story' | 'ending'} ScreenPhase
 *
 * @typedef {Object} AppState
 * @property {ScreenPhase} phase
 * @property {string} apiKey
 * @property {boolean} hasApiKey
 * @property {boolean} showApiKeyError
 * @property {boolean} aiRewriteEnabled
 * @property {PreDiagnosisAnswers} answers
 * @property {StoryBlueprint | null} blueprint
 * @property {readonly ChapterData[]} chapters
 * @property {number} currentChapterIndex
 * @property {StoryMetrics} metrics
 * @property {boolean} awaitingNextChapter
 * @property {string} lastPlayerInput
 * @property {string} lastReactionText
 * @property {readonly ActionLogEntry[]} actionLogs
 * @property {EndingDefinition | null} currentEnding
 * @property {string} personalLetter
 * @property {readonly EndingId[]} unlockedEndings
 * @property {boolean} isLoading
 * @property {string} loadingText
 * @property {string | null} aiNoticeMessage
 */

/**
 * 初期状態を生成する純粋関数
 * @returns {AppState}
 */
const createInitialState = () =>
  Object.freeze({
    phase: 'setup',
    apiKey: '',
    hasApiKey: false,
    showApiKeyError: false,
    aiRewriteEnabled: true,
    answers: Object.freeze({
      playerName: '結城 蓮',
      experience: 'empathic_observer',
      triggerScene: 'japanese_class',
      fearFocus: 'sound_shame',
      relationship: 'best_friend',
      copingStyle: 'endure_alone',
      freeComment: '',
    }),
    blueprint: null,
    chapters: Object.freeze([]),
    currentChapterIndex: 0,
    metrics: createInitialMetrics(),
    awaitingNextChapter: false,
    lastPlayerInput: '',
    lastReactionText: '',
    actionLogs: Object.freeze([]),
    currentEnding: null,
    personalLetter: '',
    unlockedEndings: Object.freeze([]),
    isLoading: false,
    loadingText: '',
    aiNoticeMessage: null,
  });

/**
 * 状態をイミュータブルに更新する純粋関数
 * @param {AppState} currentState
 * @param {Partial<AppState>} patch
 * @returns {AppState}
 */
const updateState = (currentState, patch) =>
  Object.freeze({
    ...currentState,
    ...patch,
  });

/**
 * 必須DOM要素を型安全に取得する
 * @template {HTMLElement} T
 * @param {string} id
 * @param {new () => T} ctor
 * @returns {T}
 */
const getRequiredElement = (id, ctor) => {
  const element = document.getElementById(id);
  if (!(element instanceof ctor)) {
    throw new Error(`必須DOM要素が見つからないか型が一致しません: #${id}`);
  }
  return element;
};

/**
 * 指定されたルートIDで強制的にStoryBlueprintを上書き生成する純粋関数
 * @param {PreDiagnosisAnswers} answers
 * @param {StoryRouteId} targetRouteId
 * @returns {StoryBlueprint}
 */
const overrideBlueprintRoute = (answers, targetRouteId) => {
  /** @type {RelationshipType} */
  const mappedRelationship =
    targetRouteId === 'route_a_healing'
      ? 'self_protagonist'
      : targetRouteId === 'route_v2_classmate'
        ? 'distant_classmate'
        : 'best_friend';

  /** @type {ExperienceType} */
  const mappedExperience =
    targetRouteId === 'route_a_healing'
      ? 'ibs_patient'
      : answers.experience === 'ibs_patient'
        ? 'empathic_observer'
        : answers.experience;

  return createStoryBlueprint(
    Object.freeze({
      ...answers,
      relationship: mappedRelationship,
      experience: mappedExperience,
    })
  );
};

/**
 * 手紙とプレイ記録をテキストファイルとしてダウンロードする
 * @param {AppState} state
 * @param {Date} now
 */
const downloadPlayRecord = (state, now) => {
  if (state.currentEnding === null || state.blueprint === null) {
    return;
  }
  const timestamp = formatFileTimestamp(now);
  const fileName = `story_letter_${timestamp}.txt`;
  const logsText = state.actionLogs
    .map(
      (log) =>
        `【第${log.chapterNumber}部: ${log.chapterTitle}】\n` +
        `あなたの言葉: ${log.playerInput}\n` +
        `反応: ${log.aiReaction}\n`
    )
    .join('\n');

  const content = [
    '====================================================',
    '🌿 静寂の教室と、ふたりの呼吸 — プレイ記録＆手紙',
    '====================================================',
    `プレイヤー名: ${state.answers.playerName}`,
    `プレイしたルート: ${state.blueprint.routeTitle}`,
    `到達エンディング: ${state.currentEnding.badge}『${state.currentEnding.title}』`,
    '',
    '----------------------------------------------------',
    '💌 朝霧 陽菜（A）からの手紙',
    '----------------------------------------------------',
    state.personalLetter,
    '',
    '----------------------------------------------------',
    '📖 あなたが歩んだ5つの選択と対話の軌跡',
    '----------------------------------------------------',
    logsText,
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/**
 * ラジオボタンカード群をコンテナに描画するヘルパー
 * @template {string} K
 * @param {Object} params
 * @param {HTMLElement} params.container
 * @param {string} params.groupName
 * @param {Readonly<Record<K, { readonly label: string; readonly description?: string; readonly ambiance?: string; readonly coreFear?: string; readonly routeHint?: string; readonly monologueTone?: string }>>} params.optionsMap
 * @param {K} params.selectedKey
 * @param {(selected: K) => void} params.onSelect
 */
const renderRadioCards = ({
  container,
  groupName,
  optionsMap,
  selectedKey,
  onSelect,
}) => {
  container.innerHTML = '';
  const keys = /** @type {K[]} */ (Object.keys(optionsMap));

  for (const key of keys) {
    const item = optionsMap[key];
    const labelEl = document.createElement('label');
    labelEl.className = 'radio-card';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = groupName;
    radio.value = key;
    radio.checked = key === selectedKey;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        onSelect(key);
      }
    });

    const body = document.createElement('div');
    body.className = 'radio-card-body';

    const title = document.createElement('span');
    title.className = 'radio-card-title';
    title.textContent = item.label;
    body.appendChild(title);

    const subText =
      item.description ??
      item.ambiance ??
      item.coreFear ??
      item.routeHint ??
      item.monologueTone ??
      '';
    if (subText.length > 0) {
      const desc = document.createElement('span');
      desc.className = 'radio-card-desc';
      desc.textContent = subText;
      body.appendChild(desc);
    }

    labelEl.appendChild(radio);
    labelEl.appendChild(body);
    container.appendChild(labelEl);
  }
};

/**
 * アプリケーションの初期化とイベント登録
 */
const initApp = () => {
  const aiStatusPill = getRequiredElement('ai-status-pill', HTMLElement);
  const aiNoticeBanner = getRequiredElement('ai-notice-banner', HTMLElement);

  // Sections
  const setupSection = getRequiredElement('setup-section', HTMLElement);
  const diagnosisSection = getRequiredElement('diagnosis-section', HTMLElement);
  const blueprintSection = getRequiredElement('blueprint-section', HTMLElement);
  const storySection = getRequiredElement('story-section', HTMLElement);
  const endingSection = getRequiredElement('ending-section', HTMLElement);

  // Setup elements
  const apiKeyForm = getRequiredElement('api-key-form', HTMLFormElement);
  const apiKeyInput = getRequiredElement('api-key-input', HTMLInputElement);
  const toggleApiKeyBtn = getRequiredElement('toggle-api-key-btn', HTMLButtonElement);
  const apiKeyError = getRequiredElement('api-key-error', HTMLElement);
  const startOfflineBtn = getRequiredElement('start-offline-btn', HTMLButtonElement);

  // Diagnosis elements
  const backToSetupBtn = getRequiredElement('back-to-setup-btn', HTMLButtonElement);
  const diagnosisForm = getRequiredElement('diagnosis-form', HTMLFormElement);
  const playerNameInput = getRequiredElement('player-name-input', HTMLInputElement);
  const qExperienceOptions = getRequiredElement('q-experience-options', HTMLElement);
  const qSceneOptions = getRequiredElement('q-scene-options', HTMLElement);
  const qFearOptions = getRequiredElement('q-fear-options', HTMLElement);
  const qRelationshipOptions = getRequiredElement('q-relationship-options', HTMLElement);
  const qCopingOptions = getRequiredElement('q-coping-options', HTMLElement);
  const freeCommentInput = getRequiredElement('free-comment-input', HTMLTextAreaElement);

  // Blueprint elements
  const redoDiagnosisBtn = getRequiredElement('redo-diagnosis-btn', HTMLButtonElement);
  const blueprintLoading = getRequiredElement('blueprint-loading', HTMLElement);
  const bpRouteBadge = getRequiredElement('bp-route-badge', HTMLElement);
  const bpRouteTitle = getRequiredElement('bp-route-title', HTMLElement);
  const bpRouteSubtitle = getRequiredElement('bp-route-subtitle', HTMLElement);
  const bpRoleValue = getRequiredElement('bp-role-value', HTMLElement);
  const bpSceneValue = getRequiredElement('bp-scene-value', HTMLElement);
  const bpFearValue = getRequiredElement('bp-fear-value', HTMLElement);
  const bpCopingValue = getRequiredElement('bp-coping-value', HTMLElement);
  const bpDiagnosisSummary = getRequiredElement('bp-diagnosis-summary', HTMLElement);
  const bpCustomPrologue = getRequiredElement('bp-custom-prologue', HTMLElement);
  const switchRouteV1Btn = getRequiredElement('switch-route-v1-btn', HTMLButtonElement);
  const switchRouteV2Btn = getRequiredElement('switch-route-v2-btn', HTMLButtonElement);
  const switchRouteABtn = getRequiredElement('switch-route-a-btn', HTMLButtonElement);
  const startStoryBtn = getRequiredElement('start-story-btn', HTMLButtonElement);

  // Story elements
  const chapterPartBadge = getRequiredElement('chapter-part-badge', HTMLElement);
  const chapterLocationBadge = getRequiredElement('chapter-location-badge', HTMLElement);
  const aiRewriteCheckbox = getRequiredElement('ai-rewrite-checkbox', HTMLInputElement);
  const abortToDiagnosisBtn = getRequiredElement('abort-to-diagnosis-btn', HTMLButtonElement);
  const chapterProgressFill = getRequiredElement('chapter-progress-fill', HTMLElement);
  const metricEmpathy = getRequiredElement('metric-empathy', HTMLElement);
  const metricTrust = getRequiredElement('metric-trust', HTMLElement);
  const metricCourage = getRequiredElement('metric-courage', HTMLElement);
  const metricAssumption = getRequiredElement('metric-assumption', HTMLElement);
  const metricAssumptionChip = getRequiredElement('metric-assumption-chip', HTMLElement);
  const chapterTitle = getRequiredElement('chapter-title', HTMLElement);
  const storyLoading = getRequiredElement('story-loading', HTMLElement);
  const storyLoadingText = getRequiredElement('story-loading-text', HTMLElement);
  const chapterParagraphs = getRequiredElement('chapter-paragraphs', HTMLElement);
  const chapterMonologue = getRequiredElement('chapter-monologue', HTMLElement);
  const interactionArea = getRequiredElement('interaction-area', HTMLElement);
  const chapterPromptQuestion = getRequiredElement('chapter-prompt-question', HTMLElement);
  const choicesContainer = getRequiredElement('choices-container', HTMLElement);
  const freeTalkForm = getRequiredElement('free-talk-form', HTMLFormElement);
  const freeTalkInput = getRequiredElement('free-talk-input', HTMLInputElement);
  const freeTalkSubmitBtn = getRequiredElement('free-talk-submit-btn', HTMLButtonElement);
  const reactionArea = getRequiredElement('reaction-area', HTMLElement);
  const reactionPlayerText = getRequiredElement('reaction-player-text', HTMLElement);
  const reactionAiText = getRequiredElement('reaction-ai-text', HTMLElement);
  const nextChapterBtn = getRequiredElement('next-chapter-btn', HTMLButtonElement);

  // Ending elements
  const endingBadge = getRequiredElement('ending-badge', HTMLElement);
  const endingCategory = getRequiredElement('ending-category', HTMLElement);
  const endingTitle = getRequiredElement('ending-title', HTMLElement);
  const endingSubtitle = getRequiredElement('ending-subtitle', HTMLElement);
  const endingParagraphs = getRequiredElement('ending-paragraphs', HTMLElement);
  const endingReflection = getRequiredElement('ending-reflection', HTMLElement);
  const letterLoading = getRequiredElement('letter-loading', HTMLElement);
  const letterContent = getRequiredElement('letter-content', HTMLElement);
  const downloadLetterBtn = getRequiredElement('download-letter-btn', HTMLButtonElement);
  const actionLogsList = getRequiredElement('action-logs-list', HTMLElement);
  const endingCollectionGrid = getRequiredElement('ending-collection-grid', HTMLElement);
  const replaySameDiagnosisBtn = getRequiredElement('replay-same-diagnosis-btn', HTMLButtonElement);
  const restartFromDiagnosisBtn = getRequiredElement('restart-from-diagnosis-btn', HTMLButtonElement);

  let state = createInitialState();

  /**
   * 事前診断フォームのラジオ選択肢群を再描画する
   */
  const renderDiagnosisOptions = () => {
    renderRadioCards({
      container: qExperienceOptions,
      groupName: 'experience',
      optionsMap: EXPERIENCE_OPTIONS,
      selectedKey: state.answers.experience,
      onSelect: (val) => {
        // IBS当事者を選んだ場合はデフォルトで当事者Aルートまたは親友ルートを提案しやすくする
        const nextRel =
          val === 'ibs_patient' ? 'self_protagonist' : state.answers.relationship;
        state = updateState(state, {
          answers: Object.freeze({
            ...state.answers,
            experience: val,
            relationship: nextRel,
          }),
        });
        renderDiagnosisOptions();
      },
    });

    renderRadioCards({
      container: qSceneOptions,
      groupName: 'triggerScene',
      optionsMap: TRIGGER_SCENE_OPTIONS,
      selectedKey: state.answers.triggerScene,
      onSelect: (val) => {
        state = updateState(state, {
          answers: Object.freeze({ ...state.answers, triggerScene: val }),
        });
      },
    });

    renderRadioCards({
      container: qFearOptions,
      groupName: 'fearFocus',
      optionsMap: FEAR_FOCUS_OPTIONS,
      selectedKey: state.answers.fearFocus,
      onSelect: (val) => {
        state = updateState(state, {
          answers: Object.freeze({ ...state.answers, fearFocus: val }),
        });
      },
    });

    renderRadioCards({
      container: qRelationshipOptions,
      groupName: 'relationship',
      optionsMap: RELATIONSHIP_OPTIONS,
      selectedKey: state.answers.relationship,
      onSelect: (val) => {
        state = updateState(state, {
          answers: Object.freeze({ ...state.answers, relationship: val }),
        });
      },
    });

    renderRadioCards({
      container: qCopingOptions,
      groupName: 'copingStyle',
      optionsMap: COPING_STYLE_OPTIONS,
      selectedKey: state.answers.copingStyle,
      onSelect: (val) => {
        state = updateState(state, {
          answers: Object.freeze({ ...state.answers, copingStyle: val }),
        });
      },
    });
  };

  /**
   * 指定した章にAI動的書き換えを適用する（APIキー設定＆トグルON時）
   * @param {number} chapterIndex
   */
  const maybeRewriteChapterWithAi = async (chapterIndex) => {
    if (
      !state.hasApiKey ||
      !state.aiRewriteEnabled ||
      state.blueprint === null ||
      chapterIndex < 0 ||
      chapterIndex >= state.chapters.length
    ) {
      return;
    }

    const targetChapter = state.chapters[chapterIndex];
    state = updateState(state, {
      isLoading: true,
      loadingText: `AIがあなたの診断プロファイルに合わせて${targetChapter.partLabel}の描写を最適化しています...`,
    });
    render();

    const prompt = buildPersonalizedChapterAiPrompt({
      answers: state.answers,
      blueprint: state.blueprint,
      chapterData: targetChapter,
      metrics: state.metrics,
      lastReactionText: state.lastReactionText,
    });

    const result = await callGeminiWithFallback({
      prompt,
      apiKey: state.apiKey,
      temperature: 0.78,
      maxOutputTokens: 750,
    });

    if (result.ok) {
      const rewritten = parsePersonalizedChapterRewrite(result.text, targetChapter);
      const updatedChapters = state.chapters.map((ch, idx) =>
        idx === chapterIndex
          ? Object.freeze({
              ...ch,
              paragraphs: rewritten.paragraphs,
              innerMonologue: rewritten.innerMonologue,
            })
          : ch
      );
      state = updateState(state, {
        chapters: Object.freeze(updatedChapters),
        isLoading: false,
        aiNoticeMessage: null,
      });
    } else {
      state = updateState(state, {
        isLoading: false,
        aiNoticeMessage: `${result.errorMessage}\n（※物語は内蔵パーソナライズ脚本でそのまま継続できます）`,
      });
    }
    render();
  };

  /**
   * プレイヤーの選択または自由入力を処理する
   * @param {string} playerInputText
   * @param {ChoiceEffect} effect
   * @param {boolean} isFreeTalk
   */
  const handlePlayerAction = async (playerInputText, effect, isFreeTalk) => {
    if (state.blueprint === null || state.isLoading) {
      return;
    }
    const currentChapter = state.chapters[state.currentChapterIndex];
    const updatedMetrics = applyChoiceEffect(state.metrics, effect, isFreeTalk);

    state = updateState(state, {
      metrics: updatedMetrics,
      lastPlayerInput: playerInputText,
      isLoading: true,
      loadingText: '陽菜の反応と物語の展開を生成しています...',
    });
    render();

    let reactionText = buildFallbackReaction(
      state.blueprint,
      currentChapter.chapterNumber,
      effect,
      playerInputText
    );
    /** @type {string | null} */
    let noticeMsg = null;

    if (state.hasApiKey) {
      const prompt = buildSceneReactionPrompt({
        answers: state.answers,
        blueprint: state.blueprint,
        chapterData: currentChapter,
        playerActionText: playerInputText,
        isFreeTalk,
        metrics: updatedMetrics,
      });
      const aiRes = await callGeminiWithFallback({
        prompt,
        apiKey: state.apiKey,
        temperature: 0.8,
        maxOutputTokens: 380,
      });
      if (aiRes.ok) {
        reactionText = aiRes.text;
      } else {
        noticeMsg = `${aiRes.errorMessage}\n（※内蔵パーソナライズ反応で進行しました）`;
      }
    }

    /** @type {ActionLogEntry} */
    const logEntry = Object.freeze({
      chapterNumber: currentChapter.chapterNumber,
      chapterTitle: `${currentChapter.partLabel}「${currentChapter.title}」`,
      playerInput: playerInputText,
      isFreeTalk,
      aiReaction: reactionText,
    });

    state = updateState(state, {
      isLoading: false,
      awaitingNextChapter: true,
      lastReactionText: reactionText,
      actionLogs: Object.freeze([...state.actionLogs, logEntry]),
      aiNoticeMessage: noticeMsg,
    });
    render();
  };

  /**
   * エンディング画面へ移行し、陽菜からの手紙を生成する
   */
  const transitionToEnding = async () => {
    if (state.blueprint === null) {
      return;
    }
    const ending = determineEnding(state.blueprint, state.metrics);
    const unlockedSet = new Set([...state.unlockedEndings, ending.id]);

    state = updateState(state, {
      phase: 'ending',
      currentEnding: ending,
      personalLetter: ending.defaultLetterFromA,
      unlockedEndings: Object.freeze([...unlockedSet]),
      isLoading: state.hasApiKey,
    });
    document.body.setAttribute('data-mood', ending.id.startsWith('bad_') ? 'tense' : 'hope');
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (state.hasApiKey) {
      const prompt = buildPersonalLetterPrompt({
        answers: state.answers,
        blueprint: state.blueprint,
        ending,
        actionLogs: state.actionLogs,
      });
      const letterRes = await callGeminiWithFallback({
        prompt,
        apiKey: state.apiKey,
        temperature: 0.75,
        maxOutputTokens: 650,
      });
      state = updateState(state, {
        isLoading: false,
        personalLetter: letterRes.ok ? letterRes.text : ending.defaultLetterFromA,
        aiNoticeMessage: letterRes.ok
          ? null
          : `${letterRes.errorMessage}\n（※手紙は内蔵パーソナライズ版を表示しています）`,
      });
      render();
    }
  };

  /**
   * 現在の状態からUI全体を描画する
   */
  const render = () => {
    // ステータスピル
    aiStatusPill.textContent = state.hasApiKey
      ? '✨ Gemini AI フルパーソナライズ稼働中'
      : '🌱 内蔵パーソナライズエンジン稼働中';
    aiStatusPill.classList.toggle('ai-active', state.hasApiKey);

    const hasNotice =
      typeof state.aiNoticeMessage === 'string' && state.aiNoticeMessage.length > 0;
    aiNoticeBanner.classList.toggle('hidden', !hasNotice);
    aiNoticeBanner.style.whiteSpace = 'pre-wrap';
    aiNoticeBanner.textContent = state.aiNoticeMessage ?? '';

    // セクションの表示切り替え
    setupSection.classList.toggle('hidden', state.phase !== 'setup');
    diagnosisSection.classList.toggle('hidden', state.phase !== 'diagnosis');
    blueprintSection.classList.toggle('hidden', state.phase !== 'blueprint');
    storySection.classList.toggle('hidden', state.phase !== 'story');
    endingSection.classList.toggle('hidden', state.phase !== 'ending');

    apiKeyError.classList.toggle('hidden', !state.showApiKeyError);

    // Blueprint画面の描画
    if (state.phase === 'blueprint' && state.blueprint !== null) {
      blueprintLoading.classList.toggle('hidden', !state.isLoading);
      bpRouteBadge.textContent = state.blueprint.isPatientRoute
        ? '💚 IBS当事者・深掘り救済ルート'
        : '🤝 非当事者・マルチエンディングルート';
      bpRouteTitle.textContent = state.blueprint.routeTitle;
      bpRouteSubtitle.textContent = state.blueprint.routeSubtitle;
      bpRoleValue.textContent = state.blueprint.playerRoleLabel;
      bpSceneValue.textContent = state.blueprint.triggerSceneLabel;
      bpFearValue.textContent = state.blueprint.fearFocusLabel;
      bpCopingValue.textContent = state.blueprint.copingStyleLabel;
      bpDiagnosisSummary.textContent = state.blueprint.diagnosisSummary;
      bpCustomPrologue.textContent = state.blueprint.customPrologue;
      startStoryBtn.disabled = state.isLoading;
    }

    // Story本編の描画
    if (
      state.phase === 'story' &&
      state.blueprint !== null &&
      state.chapters.length > 0
    ) {
      const currentChapter = state.chapters[state.currentChapterIndex];
      document.body.setAttribute('data-mood', currentChapter.moodTheme);

      chapterPartBadge.textContent = currentChapter.partLabel;
      chapterLocationBadge.textContent = `📍 ${currentChapter.locationLabel}`;
      aiRewriteCheckbox.checked = state.aiRewriteEnabled;
      aiRewriteCheckbox.disabled = !state.hasApiKey || state.isLoading;

      const progressPercent = Math.round(
        ((state.currentChapterIndex + 1) / state.chapters.length) * 100
      );
      chapterProgressFill.style.width = `${progressPercent}%`;

      metricEmpathy.textContent = String(state.metrics.empathy);
      metricTrust.textContent = String(state.metrics.trust);
      metricCourage.textContent = String(state.metrics.courage);
      metricAssumption.textContent = String(state.metrics.assumption);
      metricAssumptionChip.classList.toggle('hidden', state.blueprint.isPatientRoute);

      chapterTitle.textContent = currentChapter.title;
      storyLoading.classList.toggle('hidden', !state.isLoading);
      storyLoadingText.textContent = state.loadingText;

      chapterParagraphs.innerHTML = '';
      for (const text of currentChapter.paragraphs) {
        const p = document.createElement('p');
        p.textContent = text;
        chapterParagraphs.appendChild(p);
      }

      chapterMonologue.textContent = currentChapter.innerMonologue;
      chapterPromptQuestion.textContent = currentChapter.promptQuestion;

      interactionArea.classList.toggle(
        'hidden',
        state.awaitingNextChapter || state.isLoading
      );
      reactionArea.classList.toggle('hidden', !state.awaitingNextChapter);

      if (!state.awaitingNextChapter) {
        choicesContainer.innerHTML = '';
        for (const choice of currentChapter.choices) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'choice-btn';
          btn.disabled = state.isLoading;

          const mainSpan = document.createElement('span');
          mainSpan.className = 'choice-main';
          mainSpan.textContent = choice.label;

          const subSpan = document.createElement('span');
          subSpan.className = 'choice-sub';
          subSpan.textContent = choice.subtext;

          btn.appendChild(mainSpan);
          btn.appendChild(subSpan);
          btn.addEventListener('click', () => {
            void handlePlayerAction(choice.label, choice.effect, false);
          });
          choicesContainer.appendChild(btn);
        }
        freeTalkInput.placeholder = currentChapter.freeInputPlaceholder;
        freeTalkInput.disabled = state.isLoading;
        freeTalkSubmitBtn.disabled = state.isLoading;
      } else {
        reactionPlayerText.textContent = `「${state.lastPlayerInput}」`;
        reactionAiText.textContent = state.lastReactionText;
        const isLastChapter =
          state.currentChapterIndex >= state.chapters.length - 1;
        nextChapterBtn.textContent = isLastChapter
          ? '✨ エンディングと陽菜からの手紙を見る ➔'
          : `次の部（第${state.currentChapterIndex + 2}部）へ進む ➔`;
      }
    }

    // Ending画面の描画
    if (state.phase === 'ending' && state.currentEnding !== null) {
      const ending = state.currentEnding;
      endingBadge.textContent = ending.badge;
      endingCategory.textContent = ending.category;
      endingTitle.textContent = ending.title;
      endingSubtitle.textContent = ending.subtitle;

      endingParagraphs.innerHTML = '';
      for (const pText of ending.paragraphs) {
        const p = document.createElement('p');
        p.textContent = pText;
        endingParagraphs.appendChild(p);
      }

      endingReflection.textContent = ending.reflectionNote;
      letterLoading.classList.toggle('hidden', !state.isLoading);
      letterContent.textContent = state.personalLetter;

      actionLogsList.innerHTML = '';
      for (const log of state.actionLogs) {
        const div = document.createElement('div');
        div.className = 'log-item';
        const titleStrong = document.createElement('strong');
        titleStrong.textContent = `${log.chapterTitle}${log.isFreeTalk ? '（自由対話）' : ''}`;
        const inputP = document.createElement('p');
        inputP.style.margin = '0.25rem 0';
        inputP.textContent = `あなたの言葉: 「${log.playerInput}」`;
        const reactP = document.createElement('p');
        reactP.style.margin = '0';
        reactP.className = 'caption-text';
        reactP.textContent = `反応: ${log.aiReaction}`;
        div.append(titleStrong, inputP, reactP);
        actionLogsList.appendChild(div);
      }

      endingCollectionGrid.innerHTML = '';
      const allEndingKeys = /** @type {EndingId[]} */ (Object.keys(ENDINGS));
      for (const key of allEndingKeys) {
        const item = ENDINGS[key];
        const unlocked = state.unlockedEndings.includes(key);
        const card = document.createElement('div');
        card.className = `collection-card ${unlocked ? 'unlocked' : ''}`;
        const badgeSpan = document.createElement('strong');
        badgeSpan.textContent = unlocked ? `${item.badge}` : `🔒 ${item.badge}`;
        const titleP = document.createElement('p');
        titleP.style.margin = '0.2rem 0 0';
        titleP.textContent = unlocked ? `『${item.title}』` : '（未到達のエンディング）';
        card.append(badgeSpan, titleP);
        endingCollectionGrid.appendChild(card);
      }
    }
  };

  /**
   * Blueprintを構築し、APIキーがあればAIプロローグも生成する
   * @param {StoryBlueprint} initialBlueprint
   */
  const prepareBlueprintScreen = async (initialBlueprint) => {
    const chapters = buildPersonalizedChapters(state.answers, initialBlueprint);
    state = updateState(state, {
      phase: 'blueprint',
      blueprint: initialBlueprint,
      chapters,
      isLoading: state.hasApiKey,
    });
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (state.hasApiKey) {
      const prompt = buildPreDiagnosisAiPrompt(state.answers, initialBlueprint);
      const aiRes = await callGeminiWithFallback({
        prompt,
        apiKey: state.apiKey,
        temperature: 0.8,
        maxOutputTokens: 550,
      });

      if (aiRes.ok && state.blueprint !== null) {
        const paragraphs = aiRes.text
          .split(/\n{2,}/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        const summaryPart = paragraphs[0] ?? state.blueprint.diagnosisSummary;
        const prologuePart =
          paragraphs.slice(1).join('\n\n') || state.blueprint.customPrologue;

        state = updateState(state, {
          isLoading: false,
          aiNoticeMessage: null,
          blueprint: Object.freeze({
            ...state.blueprint,
            diagnosisSummary: summaryPart,
            customPrologue: prologuePart,
          }),
        });
      } else {
        state = updateState(state, {
          isLoading: false,
          aiNoticeMessage: aiRes.ok
            ? null
            : `${aiRes.errorMessage}\n（※内蔵パーソナライズ設計図を表示しています）`,
        });
      }
      render();
    }
  };

  // =========================================================================
  // イベントリスナー登録
  // =========================================================================

  toggleApiKeyBtn.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  apiKeyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const trimmed = apiKeyInput.value.trim();
    if (trimmed.length === 0) {
      state = updateState(state, { showApiKeyError: true });
      render();
      return;
    }
    state = updateState(state, {
      apiKey: trimmed,
      hasApiKey: true,
      showApiKeyError: false,
      phase: 'diagnosis',
    });
    renderDiagnosisOptions();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  startOfflineBtn.addEventListener('click', () => {
    state = updateState(state, {
      apiKey: '',
      hasApiKey: false,
      showApiKeyError: false,
      phase: 'diagnosis',
    });
    renderDiagnosisOptions();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  backToSetupBtn.addEventListener('click', () => {
    state = updateState(state, { phase: 'setup' });
    render();
  });

  diagnosisForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const updatedAnswers = Object.freeze({
      ...state.answers,
      playerName: playerNameInput.value.trim() || '結城 蓮',
      freeComment: freeCommentInput.value.trim(),
    });
    state = updateState(state, { answers: updatedAnswers });
    const blueprint = createStoryBlueprint(updatedAnswers);
    void prepareBlueprintScreen(blueprint);
  });

  redoDiagnosisBtn.addEventListener('click', () => {
    state = updateState(state, { phase: 'diagnosis' });
    renderDiagnosisOptions();
    render();
  });

  switchRouteV1Btn.addEventListener('click', () => {
    const bp = overrideBlueprintRoute(state.answers, 'route_v1_bestfriend');
    void prepareBlueprintScreen(bp);
  });

  switchRouteV2Btn.addEventListener('click', () => {
    const bp = overrideBlueprintRoute(state.answers, 'route_v2_classmate');
    void prepareBlueprintScreen(bp);
  });

  switchRouteABtn.addEventListener('click', () => {
    const bp = overrideBlueprintRoute(state.answers, 'route_a_healing');
    void prepareBlueprintScreen(bp);
  });

  aiRewriteCheckbox.addEventListener('change', () => {
    state = updateState(state, { aiRewriteEnabled: aiRewriteCheckbox.checked });
  });

  startStoryBtn.addEventListener('click', () => {
    if (state.blueprint === null) {
      return;
    }
    const freshChapters = buildPersonalizedChapters(state.answers, state.blueprint);
    state = updateState(state, {
      phase: 'story',
      chapters: freshChapters,
      currentChapterIndex: 0,
      metrics: createInitialMetrics(),
      awaitingNextChapter: false,
      lastPlayerInput: '',
      lastReactionText: '',
      actionLogs: Object.freeze([]),
      currentEnding: null,
    });
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void maybeRewriteChapterWithAi(0);
  });

  abortToDiagnosisBtn.addEventListener('click', () => {
    state = updateState(state, { phase: 'blueprint', isLoading: false });
    document.body.setAttribute('data-mood', 'warm');
    render();
  });

  freeTalkForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (state.blueprint === null || state.isLoading) {
      return;
    }
    const text = freeTalkInput.value.trim();
    if (text.length === 0) {
      return;
    }
    freeTalkInput.value = '';
    const effect = evaluateFreeTextAction(text, state.blueprint.isPatientRoute);
    void handlePlayerAction(text, effect, true);
  });

  nextChapterBtn.addEventListener('click', () => {
    const nextIdx = state.currentChapterIndex + 1;
    if (nextIdx >= state.chapters.length) {
      void transitionToEnding();
      return;
    }
    state = updateState(state, {
      currentChapterIndex: nextIdx,
      awaitingNextChapter: false,
    });
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void maybeRewriteChapterWithAi(nextIdx);
  });

  downloadLetterBtn.addEventListener('click', () => {
    downloadPlayRecord(state, new Date());
  });

  replaySameDiagnosisBtn.addEventListener('click', () => {
    if (state.blueprint === null) {
      return;
    }
    const freshChapters = buildPersonalizedChapters(state.answers, state.blueprint);
    state = updateState(state, {
      phase: 'story',
      chapters: freshChapters,
      currentChapterIndex: 0,
      metrics: createInitialMetrics(),
      awaitingNextChapter: false,
      lastPlayerInput: '',
      lastReactionText: '',
      actionLogs: Object.freeze([]),
      currentEnding: null,
    });
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void maybeRewriteChapterWithAi(0);
  });

  restartFromDiagnosisBtn.addEventListener('click', () => {
    state = updateState(state, {
      phase: 'diagnosis',
      awaitingNextChapter: false,
      currentEnding: null,
    });
    document.body.setAttribute('data-mood', 'warm');
    renderDiagnosisOptions();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  renderDiagnosisOptions();
  render();
};

document.addEventListener('DOMContentLoaded', initApp);
