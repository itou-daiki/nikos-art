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
  calculateDynamicBpm,
  callGeminiWithFallback,
  createInitialMetrics,
  createStoryBlueprint,
  determineEnding,
  evaluateFreeTextAction,
  formatFileTimestamp,
  parsePersonalizedChapterRewrite,
  tokenizeHorrorText,
} from './core.js';

/**
 * @typedef {import('./scenarios.js').PreDiagnosisAnswers} PreDiagnosisAnswers
 * @typedef {import('./scenarios.js').ExperienceType} ExperienceType
 * @typedef {import('./scenarios.js').TriggerSceneType} TriggerSceneType
 * @typedef {import('./scenarios.js').FearFocusType} FearFocusType
 * @typedef {import('./scenarios.js').RelationshipType} RelationshipType
 * @typedef {import('./scenarios.js').CopingStyleType} CopingStyleType
 * @typedef {import('./scenarios.js').StoryRouteId} StoryRouteId
 * @typedef {import('./scenarios.js').SoundPresetType} SoundPresetType
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
 * @property {boolean} soundEnabled
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
 * Web Audio API を用いた外部音源不要のプロシージャル・ホラー音響エンジン
 */
const createHorrorSoundEngine = () => {
  /** @type {AudioContext | null} */
  let audioCtx = null;
  /** @type { ReturnType<typeof setInterval> | null } */
  let ambientTimer = null;
  let isEnabled = true;

  const ensureContext = () => {
    if (!isEnabled) {
      return null;
    }
    if (audioCtx === null && typeof window !== 'undefined' && 'AudioContext' in window) {
      audioCtx = new window.AudioContext();
    }
    if (audioCtx !== null && audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  };

  /**
   * ドクン…という心拍音（二重低音パルス）を鳴らす
   * @param {boolean} isHeavy
   */
  const playHeartbeatOnce = (isHeavy) => {
    const ctx = ensureContext();
    if (ctx === null) {
      return;
    }
    const now = ctx.currentTime;
    const peakGain = isHeavy ? 0.24 : 0.12;

    const triggerPulse = (offsetSec, freq, gainVal) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + offsetSec);
      osc.frequency.exponentialRampToValueAtTime(28, now + offsetSec + 0.14);

      gain.gain.setValueAtTime(0.001, now + offsetSec);
      gain.gain.linearRampToValueAtTime(gainVal, now + offsetSec + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offsetSec + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offsetSec);
      osc.stop(now + offsetSec + 0.17);
    };

    triggerPulse(0, 68, peakGain);
    triggerPulse(0.18, 54, peakGain * 0.75);
  };

  /**
   * 静寂の教室に響く時計の秒針音「カチ…」を鳴らす
   */
  const playClockTick = () => {
    const ctx = ensureContext();
    if (ctx === null) {
      return;
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  };

  /**
   * サウンドノベル風タイプライター打鍵音
   */
  const playTypeBlip = () => {
    const ctx = ensureContext();
    if (ctx === null) {
      return;
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.022);
  };

  /**
   * 恐怖・決めつけ時の不協和音スティンガー
   */
  const playHorrorStinger = () => {
    const ctx = ensureContext();
    if (ctx === null) {
      return;
    }
    const now = ctx.currentTime;
    const freqs = [110, 116.5, 233];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.68);
    }
  };

  /**
   * 救済・共感成立時の澄んだチャイム和音
   */
  const playSalvationChime = () => {
    const ctx = ensureContext();
    if (ctx === null) {
      return;
    }
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.05, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.75);
    });
  };

  const stopAmbientLoop = () => {
    if (ambientTimer !== null) {
      clearInterval(ambientTimer);
      ambientTimer = null;
    }
  };

  /**
   * 章のBPMとプリセットに応じた環境音ループを開始する
   * @param {number} bpm
   * @param {SoundPresetType} preset
   */
  const startAmbientLoop = (bpm, preset) => {
    stopAmbientLoop();
    if (!isEnabled || preset === 'dawn') {
      return;
    }
    const intervalMs = Math.max(420, Math.round((60 / Math.max(60, bpm)) * 1000));
    let tickCounter = 0;
    ambientTimer = setInterval(() => {
      if (!isEnabled) {
        return;
      }
      tickCounter += 1;
      if (preset === 'clock_panic') {
        playHeartbeatOnce(true);
        playClockTick();
      } else if (preset === 'heartbeat_heavy') {
        playHeartbeatOnce(true);
      } else if (preset === 'sorrow' && tickCounter % 2 === 0) {
        playHeartbeatOnce(false);
      } else if (preset === 'calm' && tickCounter % 3 === 0) {
        playClockTick();
      }
    }, intervalMs);
  };

  /**
   * @param {boolean} enabled
   */
  const setSoundEnabled = (enabled) => {
    isEnabled = enabled;
    if (!enabled) {
      stopAmbientLoop();
    }
  };

  return Object.freeze({
    playTypeBlip,
    playHorrorStinger,
    playSalvationChime,
    startAmbientLoop,
    stopAmbientLoop,
    setSoundEnabled,
  });
};

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
    soundEnabled: true,
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
 * 暗闇に浮かぶ「クラスメイトの視線（目）」を背景レイヤーに描画する
 * @param {HTMLElement} layer
 * @param {number} count
 */
const renderGazeEyes = (layer, count) => {
  layer.innerHTML = '';
  const clampedCount = Math.min(24, Math.max(0, count));
  if (clampedCount === 0) {
    return;
  }

  // 画面端（左右・上下）に不気味な目を配置する決定論的座標テーブル
  const positions = [
    { top: '8%', left: '4%' },
    { top: '14%', left: '88%' },
    { top: '24%', left: '2%' },
    { top: '28%', left: '92%' },
    { top: '42%', left: '3%' },
    { top: '46%', left: '91%' },
    { top: '62%', left: '4%' },
    { top: '66%', left: '89%' },
    { top: '78%', left: '6%' },
    { top: '82%', left: '87%' },
    { top: '18%', left: '11%' },
    { top: '20%', left: '82%' },
    { top: '54%', left: '8%' },
    { top: '56%', left: '85%' },
    { top: '88%', left: '14%' },
    { top: '90%', left: '78%' },
    { top: '6%', left: '22%' },
    { top: '7%', left: '72%' },
  ];

  for (let i = 0; i < clampedCount; i += 1) {
    const pos = positions[i % positions.length];
    const wrapper = document.createElement('div');
    wrapper.className = 'gaze-eye';
    wrapper.style.top = pos.top;
    wrapper.style.left = pos.left;
    wrapper.style.animationDelay = `${(i * 0.37) % 3.5}s`;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 60 30');
    svg.setAttribute('width', '46');
    svg.setAttribute('height', '24');

    const outer = document.createElementNS(svgNS, 'path');
    outer.setAttribute('d', 'M2,15 Q30,-5 58,15 Q30,35 2,15 Z');
    outer.setAttribute('fill', '#1a0508');
    outer.setAttribute('stroke', '#ef4444');
    outer.setAttribute('stroke-width', '2');

    const iris = document.createElementNS(svgNS, 'circle');
    iris.setAttribute('cx', '30');
    iris.setAttribute('cy', '15');
    iris.setAttribute('r', '6');
    iris.setAttribute('fill', '#dc2626');

    const pupil = document.createElementNS(svgNS, 'circle');
    pupil.setAttribute('cx', '30');
    pupil.setAttribute('cy', '15');
    pupil.setAttribute('r', '2.5');
    pupil.setAttribute('fill', '#000000');

    svg.appendChild(outer);
    svg.appendChild(iris);
    svg.appendChild(pupil);
    wrapper.appendChild(svg);
    layer.appendChild(wrapper);
  }
};

/**
 * 段落配列をホラー強調トークン付きのDOM要素として構築する
 * @param {HTMLElement} container
 * @param {readonly string[]} paragraphs
 */
const renderTokenizedParagraphs = (container, paragraphs) => {
  container.innerHTML = '';
  for (const paraText of paragraphs) {
    const p = document.createElement('p');
    const tokens = tokenizeHorrorText(paraText);
    for (const token of tokens) {
      if (token.kind === 'crimson') {
        const span = document.createElement('span');
        span.className = 'token-crimson';
        span.textContent = token.text;
        p.appendChild(span);
      } else if (token.kind === 'salvage') {
        const span = document.createElement('span');
        span.className = 'token-salvage';
        span.textContent = token.text;
        p.appendChild(span);
      } else {
        p.appendChild(document.createTextNode(token.text));
      }
    }
    container.appendChild(p);
  }
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
  const fileName = `silent_classroom_record_${timestamp}.txt`;
  const logsText = state.actionLogs
    .map(
      (log) =>
        `【第${log.chapterNumber}幕: ${log.chapterTitle}】\n` +
        `あなたの言葉: ${log.playerInput}\n` +
        `反応: ${log.aiReaction}\n`
    )
    .join('\n');

  const content = [
    '====================================================',
    '👁️ SILENT CLASSROOM — 静寂の教室と、ふたりの呼吸',
    '====================================================',
    `被験者名: ${state.answers.playerName}`,
    `シナリオ: ${state.blueprint.routeTitle}`,
    `到達エンディング: ${state.currentEnding.badge}『${state.currentEnding.title}』`,
    '',
    '----------------------------------------------------',
    '💌 朝霧 陽菜（A）からの手紙・記録',
    '----------------------------------------------------',
    state.personalLetter,
    '',
    '----------------------------------------------------',
    '📖 あなたが辿った全5幕の選択と対話の記録',
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
  const soundEngine = createHorrorSoundEngine();

  const gazeEyesLayer = getRequiredElement('gaze-eyes-layer', HTMLElement);
  const aiStatusPill = getRequiredElement('ai-status-pill', HTMLElement);
  const soundToggleBtn = getRequiredElement('sound-toggle-btn', HTMLButtonElement);
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

  // Story HUD & elements
  const hudBpmValue = getRequiredElement('hud-bpm-value', HTMLElement);
  const hudSilenceValue = getRequiredElement('hud-silence-value', HTMLElement);
  const hudSilenceFill = getRequiredElement('hud-silence-fill', HTMLElement);
  const hudGazeStatus = getRequiredElement('hud-gaze-status', HTMLElement);
  const chapterPartBadge = getRequiredElement('chapter-part-badge', HTMLElement);
  const chapterLocationBadge = getRequiredElement('chapter-location-badge', HTMLElement);
  const skipTypewriterBtn = getRequiredElement('skip-typewriter-btn', HTMLButtonElement);
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
  const endingHeroBox = getRequiredElement('ending-hero-box', HTMLElement);
  const endingBadge = getRequiredElement('ending-badge', HTMLElement);
  const endingCategory = getRequiredElement('ending-category', HTMLElement);
  const endingTitle = getRequiredElement('ending-title', HTMLElement);
  const endingSubtitle = getRequiredElement('ending-subtitle', HTMLElement);
  const endingParagraphs = getRequiredElement('ending-paragraphs', HTMLElement);
  const endingReflection = getRequiredElement('ending-reflection', HTMLElement);
  const letterHeadingTitle = getRequiredElement('letter-heading-title', HTMLElement);
  const letterLoading = getRequiredElement('letter-loading', HTMLElement);
  const letterContent = getRequiredElement('letter-content', HTMLElement);
  const downloadLetterBtn = getRequiredElement('download-letter-btn', HTMLButtonElement);
  const actionLogsList = getRequiredElement('action-logs-list', HTMLElement);
  const endingCollectionGrid = getRequiredElement('ending-collection-grid', HTMLElement);
  const replaySameDiagnosisBtn = getRequiredElement('replay-same-diagnosis-btn', HTMLButtonElement);
  const restartFromDiagnosisBtn = getRequiredElement('restart-from-diagnosis-btn', HTMLButtonElement);

  let state = createInitialState();
  /** @type {ReturnType<typeof setInterval> | null} */
  let typewriterTimer = null;
  let lastTypedChapterKey = '';

  const clearTypewriter = () => {
    if (typewriterTimer !== null) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
    }
  };

  /**
   * 現在の章の全文を即時表示する（タイプライタースキップ）
   */
  const completeTypewriterImmediately = () => {
    clearTypewriter();
    if (state.phase === 'story' && state.chapters.length > 0) {
      const currentChapter = state.chapters[state.currentChapterIndex];
      renderTokenizedParagraphs(chapterParagraphs, currentChapter.paragraphs);
    }
  };

  /**
   * サウンドノベル風のタイプライター文字送りを開始する
   * @param {readonly string[]} paragraphs
   * @param {string} chapterKey
   */
  const startTypewriterEffect = (paragraphs, chapterKey) => {
    if (lastTypedChapterKey === chapterKey) {
      renderTokenizedParagraphs(chapterParagraphs, paragraphs);
      return;
    }
    lastTypedChapterKey = chapterKey;
    clearTypewriter();

    chapterParagraphs.innerHTML = '';
    const pElements = paragraphs.map(() => {
      const p = document.createElement('p');
      chapterParagraphs.appendChild(p);
      return p;
    });

    let pIdx = 0;
    let charIdx = 0;

    typewriterTimer = setInterval(() => {
      if (pIdx >= paragraphs.length) {
        completeTypewriterImmediately();
        return;
      }
      const currentFullText = paragraphs[pIdx];
      charIdx += 2;
      pElements[pIdx].textContent = currentFullText.slice(0, charIdx);
      if (charIdx % 6 === 0) {
        soundEngine.playTypeBlip();
      }
      if (charIdx >= currentFullText.length) {
        pIdx += 1;
        charIdx = 0;
      }
    }, 24);
  };

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
      loadingText: `AIがあなたの恐怖プロファイルに合わせて${targetChapter.partLabel}の脚本を生成しています...`,
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
      lastTypedChapterKey = '';
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
    completeTypewriterImmediately();

    if (effect.assumptionDelta >= 3 || effect.trustDelta < 0) {
      soundEngine.playHorrorStinger();
    } else if (effect.empathyDelta >= 4) {
      soundEngine.playSalvationChime();
    }

    const currentChapter = state.chapters[state.currentChapterIndex];
    const updatedMetrics = applyChoiceEffect(state.metrics, effect, isFreeTalk);

    state = updateState(state, {
      metrics: updatedMetrics,
      lastPlayerInput: playerInputText,
      isLoading: true,
      loadingText: '教室の反応と陽菜の声を呼び出しています...',
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
    clearTypewriter();
    const ending = determineEnding(state.blueprint, state.metrics);
    const unlockedSet = new Set([...state.unlockedEndings, ending.id]);

    if (ending.isHorrorBadEnd) {
      soundEngine.playHorrorStinger();
      soundEngine.startAmbientLoop(ending.endingBpm, 'clock_panic');
      renderGazeEyes(gazeEyesLayer, 22);
      document.body.setAttribute('data-mood', 'horror_bad');
    } else {
      soundEngine.playSalvationChime();
      soundEngine.stopAmbientLoop();
      renderGazeEyes(gazeEyesLayer, 0);
      document.body.setAttribute('data-mood', ending.id === 'bitter_distance' ? 'emotional' : 'hope');
    }

    state = updateState(state, {
      phase: 'ending',
      currentEnding: ending,
      personalLetter: ending.defaultLetterFromA,
      unlockedEndings: Object.freeze([...unlockedSet]),
      isLoading: state.hasApiKey,
    });
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
    aiStatusPill.textContent = state.hasApiKey
      ? '✨ Gemini AI 深層ホラー＆救済エンジン稼働中'
      : '🕯️ 内蔵パーソナライズエンジン稼働中';
    aiStatusPill.classList.toggle('ai-active', state.hasApiKey);

    soundToggleBtn.textContent = state.soundEnabled
      ? '🔊 ホラー音響: ON'
      : '🔇 ホラー音響: OFF';

    const hasNotice =
      typeof state.aiNoticeMessage === 'string' && state.aiNoticeMessage.length > 0;
    aiNoticeBanner.classList.toggle('hidden', !hasNotice);
    aiNoticeBanner.style.whiteSpace = 'pre-wrap';
    aiNoticeBanner.textContent = state.aiNoticeMessage ?? '';

    setupSection.classList.toggle('hidden', state.phase !== 'setup');
    diagnosisSection.classList.toggle('hidden', state.phase !== 'diagnosis');
    blueprintSection.classList.toggle('hidden', state.phase !== 'blueprint');
    storySection.classList.toggle('hidden', state.phase !== 'story');
    endingSection.classList.toggle('hidden', state.phase !== 'ending');

    apiKeyError.classList.toggle('hidden', !state.showApiKeyError);

    if (state.phase === 'setup' || state.phase === 'diagnosis' || state.phase === 'blueprint') {
      soundEngine.stopAmbientLoop();
      renderGazeEyes(gazeEyesLayer, state.phase === 'setup' ? 4 : 2);
      document.body.setAttribute('data-mood', 'tense');
    }

    // Blueprint画面
    if (state.phase === 'blueprint' && state.blueprint !== null) {
      blueprintLoading.classList.toggle('hidden', !state.isLoading);
      bpRouteBadge.textContent = state.blueprint.isPatientRoute
        ? '🕯️ IBS当事者・密室からの救済生還ルート'
        : '👁️ 非当事者・マルチホラー＆生還分岐ルート';
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

    // Story本編
    if (
      state.phase === 'story' &&
      state.blueprint !== null &&
      state.chapters.length > 0
    ) {
      const currentChapter = state.chapters[state.currentChapterIndex];
      document.body.setAttribute('data-mood', currentChapter.moodTheme);

      const dynamicBpm = calculateDynamicBpm(currentChapter.baseBpm, state.metrics);
      const isHighPanic = dynamicBpm >= 115 || currentChapter.silenceLevel >= 80;

      hudBpmValue.textContent = String(dynamicBpm);
      hudBpmValue.classList.toggle('bpm-danger', isHighPanic);

      hudSilenceValue.textContent = `${currentChapter.silenceLevel}%`;
      hudSilenceFill.style.width = `${currentChapter.silenceLevel}%`;

      const totalGazeEyes =
        currentChapter.gazeEyesCount + Math.max(0, state.metrics.assumption * 2);
      renderGazeEyes(gazeEyesLayer, totalGazeEyes);

      if (totalGazeEyes >= 12) {
        hudGazeStatus.textContent = 'CRITICAL // 無数の視線と嘲笑';
        hudGazeStatus.classList.add('gaze-danger');
      } else if (totalGazeEyes >= 4) {
        hudGazeStatus.textContent = 'WATCHED // 周囲の視線';
        hudGazeStatus.classList.remove('gaze-danger');
      } else {
        hudGazeStatus.textContent = 'SAFE // 理解者の存在';
        hudGazeStatus.classList.remove('gaze-danger');
      }

      soundEngine.startAmbientLoop(dynamicBpm, currentChapter.soundPreset);

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

      const chapterKey = `${state.blueprint.routeId}_${currentChapter.chapterNumber}_${currentChapter.paragraphs[0].slice(0, 15)}`;
      if (!state.isLoading) {
        startTypewriterEffect(currentChapter.paragraphs, chapterKey);
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
          ? '👁️ 最終結末（エンディング）を見届ける ➔'
          : `次の幕（第${state.currentChapterIndex + 2}幕）へ進む ➔`;
      }
    }

    // Ending画面
    if (state.phase === 'ending' && state.currentEnding !== null) {
      const ending = state.currentEnding;
      endingHeroBox.classList.toggle('horror-bad-hero', ending.isHorrorBadEnd);
      endingBadge.textContent = ending.badge;
      endingCategory.textContent = ending.category;
      endingTitle.textContent = ending.title;
      endingSubtitle.textContent = ending.subtitle;

      renderTokenizedParagraphs(endingParagraphs, ending.paragraphs);

      endingReflection.textContent = ending.reflectionNote;
      letterHeadingTitle.textContent = ending.isHorrorBadEnd
        ? '🩸 残された未送信メモ・破られた記録'
        : '💌 朝霧 陽菜（A）からあなたへ届いた手紙';
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
        titleP.textContent = unlocked ? `『${item.title}』` : '（未到達の結末）';
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

  soundToggleBtn.addEventListener('click', () => {
    const nextSound = !state.soundEnabled;
    soundEngine.setSoundEnabled(nextSound);
    state = updateState(state, { soundEnabled: nextSound });
    render();
  });

  skipTypewriterBtn.addEventListener('click', () => {
    completeTypewriterImmediately();
  });

  chapterParagraphs.addEventListener('click', () => {
    completeTypewriterImmediately();
  });

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
    lastTypedChapterKey = '';
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
    clearTypewriter();
    soundEngine.stopAmbientLoop();
    state = updateState(state, { phase: 'blueprint', isLoading: false });
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
    lastTypedChapterKey = '';
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
    lastTypedChapterKey = '';
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
    clearTypewriter();
    soundEngine.stopAmbientLoop();
    state = updateState(state, {
      phase: 'diagnosis',
      awaitingNextChapter: false,
      currentEnding: null,
    });
    renderDiagnosisOptions();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  renderDiagnosisOptions();
  render();
};

document.addEventListener('DOMContentLoaded', initApp);
