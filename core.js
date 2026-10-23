// @ts-check

import {
  COPING_STYLE_OPTIONS,
  ENDINGS,
  EXPERIENCE_OPTIONS,
  FEAR_FOCUS_OPTIONS,
  RELATIONSHIP_OPTIONS,
  TRIGGER_SCENE_OPTIONS,
  buildPersonalizedChapters,
  createStoryBlueprint,
} from './scenarios.js';

/**
 * @typedef {import('./scenarios.js').PreDiagnosisAnswers} PreDiagnosisAnswers
 * @typedef {import('./scenarios.js').StoryBlueprint} StoryBlueprint
 * @typedef {import('./scenarios.js').ChapterData} ChapterData
 * @typedef {import('./scenarios.js').ChoiceEffect} ChoiceEffect
 * @typedef {import('./scenarios.js').StoryMetrics} StoryMetrics
 * @typedef {import('./scenarios.js').EndingId} EndingId
 * @typedef {import('./scenarios.js').EndingDefinition} EndingDefinition
 *
 * @typedef {Object} ActionLogEntry
 * @property {number} chapterNumber
 * @property {string} chapterTitle
 * @property {string} playerInput
 * @property {boolean} isFreeTalk
 * @property {string} aiReaction
 *
 * @typedef {Object} ModelErrorEntry
 * @property {string} model
 * @property {unknown} error
 *
 * @typedef {Object} PersonalizedChapterRewrite
 * @property {readonly string[]} paragraphs
 * @property {string} innerMonologue
 *
 * @typedef {Object} TextToken
 * @property {string} text
 * @property {'normal' | 'crimson' | 'salvage'} kind
 */

export const CHAT_MODELS = Object.freeze([
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
]);

/** @type {readonly string[]} */
const EMPATHY_KEYWORDS = Object.freeze([
  'ありがとう',
  '苦しかった',
  'つらかった',
  '辛かった',
  '大変だった',
  '教えてくれて',
  '一緒に',
  '味方',
  'ひとりじゃない',
  '一人じゃない',
  '無理しないで',
  'ごめん',
  '聞かせて',
  'わかる',
  '寄り添',
  '安心',
  '支え',
  '大丈夫',
]);

/** @type {readonly string[]} */
const ASSUMPTION_KEYWORDS = Object.freeze([
  '気にしすぎ',
  '気のせい',
  '気合い',
  '根性',
  'すぐ治る',
  'サボり',
  '甘え',
  '大げさ',
  '全部わかる',
  '考えすぎ',
  '自己管理',
  '普通は',
]);

/** @type {readonly string[]} */
const COURAGE_KEYWORDS = Object.freeze([
  '先生',
  '保健室',
  '相談',
  '対策',
  '伝え',
  '守る',
  'おかしい',
  'やめよう',
  'やめなよ',
  '一歩',
  '病院',
  '親',
  '母',
  '合図',
]);

/** @type {readonly string[]} */
const HORROR_HIGHLIGHT_WORDS = Object.freeze([
  'オナラしてたよね？笑',
  'またトイレ？',
  'ギュルルッ',
  'ブゥッ',
  'オナラ',
  'お腹が痛い',
  '処刑',
  '密室',
  '金縛り',
  '生き地獄',
  '気のせい',
  '考えすぎ',
  'サボり',
  '監視の目',
  '無数の目',
]);

/** @type {readonly string[]} */
const SALVATION_HIGHLIGHT_WORDS = Object.freeze([
  '「——私も。」',
  '「私も。」',
  'ひとりじゃない',
  '味方',
  'IBS（過敏性腸症候群）',
]);

/**
 * 初期メトリクスを生成する純粋関数
 * @returns {StoryMetrics}
 */
export const createInitialMetrics = () =>
  Object.freeze({
    empathy: 0,
    assumption: 0,
    courage: 0,
    trust: 0,
    freeTalkCount: 0,
  });

/**
 * 章の基本BPMと現在のメトリクスからリアルタイムの心拍数（BPM）を算出する純粋関数
 * @param {number} baseBpm
 * @param {StoryMetrics} metrics
 * @returns {number}
 */
export const calculateDynamicBpm = (baseBpm, metrics) => {
  const panicIncrease = metrics.assumption * 6;
  const calmDecrease = Math.min(20, Math.max(0, metrics.trust * 2));
  const rawBpm = baseBpm + panicIncrease - calmDecrease;
  return Math.min(175, Math.max(58, rawBpm));
};

/**
 * 本文テキストを通常トークン・ホラー強調トークン・救済強調トークンに分割する純粋関数
 * @param {string} text
 * @returns {readonly TextToken[]}
 */
export const tokenizeHorrorText = (text) => {
  if (text.length === 0) {
    return Object.freeze([]);
  }

  const allMarkers = [
    ...SALVATION_HIGHLIGHT_WORDS.map((w) => ({ word: w, kind: /** @type {const} */ ('salvage') })),
    ...HORROR_HIGHLIGHT_WORDS.map((w) => ({ word: w, kind: /** @type {const} */ ('crimson') })),
  ];

  /** @type {TextToken[]} */
  let tokens = [{ text, kind: 'normal' }];

  for (const marker of allMarkers) {
    /** @type {TextToken[]} */
    const nextTokens = [];
    for (const token of tokens) {
      if (token.kind !== 'normal' || !token.text.includes(marker.word)) {
        nextTokens.push(token);
        continue;
      }
      const parts = token.text.split(marker.word);
      parts.forEach((part, idx) => {
        if (part.length > 0) {
          nextTokens.push(Object.freeze({ text: part, kind: 'normal' }));
        }
        if (idx < parts.length - 1) {
          nextTokens.push(Object.freeze({ text: marker.word, kind: marker.kind }));
        }
      });
    }
    tokens = nextTokens;
  }

  return Object.freeze(tokens);
};

/**
 * 自由記述テキストからプレイヤーの行動効果（ChoiceEffect）を判定する純粋関数
 * @param {string} text
 * @param {boolean} isPatientRoute
 * @returns {ChoiceEffect}
 */
export const evaluateFreeTextAction = (text, isPatientRoute) => {
  const normalized = text.trim().toLowerCase();
  if (normalized.length === 0) {
    return Object.freeze({
      empathyDelta: 0,
      assumptionDelta: 0,
      courageDelta: 0,
      trustDelta: 0,
      reactionKey: 'free_neutral',
    });
  }

  let empathyScore = 1;
  let assumptionScore = 0;
  let courageScore = 1;

  for (const kw of EMPATHY_KEYWORDS) {
    if (normalized.includes(kw.toLowerCase())) {
      empathyScore += 2;
    }
  }

  for (const kw of ASSUMPTION_KEYWORDS) {
    if (normalized.includes(kw.toLowerCase())) {
      const negatedPattern = `${kw.toLowerCase()}じゃない`;
      const negatedPattern2 = `${kw.toLowerCase()}なんて言わない`;
      if (!normalized.includes(negatedPattern) && !normalized.includes(negatedPattern2)) {
        assumptionScore += 3;
      }
    }
  }

  for (const kw of COURAGE_KEYWORDS) {
    if (normalized.includes(kw.toLowerCase())) {
      courageScore += 2;
    }
  }

  if (isPatientRoute) {
    return Object.freeze({
      empathyDelta: Math.min(5, Math.max(2, empathyScore)),
      assumptionDelta: 0,
      courageDelta: Math.min(5, Math.max(2, courageScore)),
      trustDelta: Math.min(5, Math.max(2, empathyScore)),
      reactionKey: 'free_patient_empower',
    });
  }

  if (assumptionScore >= 3) {
    return Object.freeze({
      empathyDelta: -2,
      assumptionDelta: Math.min(6, assumptionScore),
      courageDelta: 0,
      trustDelta: -3,
      reactionKey: 'free_assumption_hurt',
    });
  }

  const clampedEmpathy = Math.min(5, empathyScore);
  const clampedCourage = Math.min(5, courageScore);
  const trustDelta = clampedEmpathy >= 3 ? 4 : 2;

  return Object.freeze({
    empathyDelta: clampedEmpathy,
    assumptionDelta: 0,
    courageDelta: clampedCourage,
    trustDelta,
    reactionKey: 'free_empathic_talk',
  });
};

/**
 * メトリクスに選択・発言の効果をイミュータブルに反映する純粋関数
 * @param {StoryMetrics} current
 * @param {ChoiceEffect} effect
 * @param {boolean} isFreeTalk
 * @returns {StoryMetrics}
 */
export const applyChoiceEffect = (current, effect, isFreeTalk) =>
  Object.freeze({
    empathy: current.empathy + effect.empathyDelta,
    assumption: Math.max(0, current.assumption + effect.assumptionDelta),
    courage: current.courage + effect.courageDelta,
    trust: current.trust + effect.trustDelta,
    freeTalkCount: isFreeTalk ? current.freeTalkCount + 1 : current.freeTalkCount,
  });

/**
 * 最終章完了時のメトリクスとストーリー設計図から到達エンディングを判定する純粋関数
 * @param {StoryBlueprint} blueprint
 * @param {StoryMetrics} metrics
 * @returns {EndingDefinition}
 */
export const determineEnding = (blueprint, metrics) => {
  if (blueprint.isPatientRoute) {
    if (metrics.courage >= 10 || metrics.empathy >= 15) {
      return ENDINGS.healing_true;
    }
    return ENDINGS.healing_gentle;
  }

  if (metrics.assumption >= 6) {
    return ENDINGS.bad_assumption;
  }

  if (metrics.trust <= -2 || (metrics.empathy <= 2 && metrics.courage <= -1)) {
    return ENDINGS.bad_conformity;
  }

  if (
    metrics.freeTalkCount >= 2 &&
    metrics.empathy >= 12 &&
    metrics.assumption <= 2 &&
    metrics.trust >= 10
  ) {
    return ENDINGS.ai_cocreation;
  }

  if (
    metrics.empathy >= 14 &&
    metrics.courage >= 10 &&
    metrics.trust >= 12 &&
    metrics.assumption <= 2
  ) {
    return ENDINGS.true_bond;
  }

  if (metrics.empathy >= 8 && metrics.trust >= 6) {
    return ENDINGS.happy_ally;
  }

  return ENDINGS.bitter_distance;
};

/**
 * オフライン・API未設定時にも即座に機能する決定論的シーン反応テキスト生成関数
 * @param {StoryBlueprint} blueprint
 * @param {number} chapterNumber
 * @param {ChoiceEffect} effect
 * @param {string} playerInput
 * @returns {string}
 */
export const buildFallbackReaction = (blueprint, chapterNumber, effect, playerInput) => {
  if (blueprint.isPatientRoute) {
    const responses = [
      `あなたの「${playerInput}」という思いが、暗闇の中で静かに灯る。自分の痛みを無理に押し殺さなくていいのだと、心拍数がほんの少し落ち着いた。`,
      '深く息を吐き出すと、檻のように迫っていた教室の圧迫感がわずかに緩んだ。自分を守るための退路を持っていることが、確かな命綱になっている。',
      '過去の暗い部屋の記憶を肯定できたことで、胸を締め付けていた呪縛がスッと溶けていく。あの夜の自分が叫んだからこそ、今の自分が生きている。',
      'あなたの「私も。」という言葉に、親友は震える肩を押さえて涙をこぼした。恐怖の密室で孤独だった二つの魂が、確かな温もりで結ばれた瞬間だった。',
      'ひとりじゃない。そう実感した瞬間、不気味だった教室の静寂は消え、窓から澄んだ朝の光が差し込んできた。',
    ];
    return responses[Math.min(responses.length - 1, Math.max(0, chapterNumber - 1))];
  }

  if (effect.assumptionDelta >= 3) {
    return '【警告：心の断絶】その言葉を聞いた瞬間、陽菜（A）の瞳からスッと光が消えた。「……そっか、そうだよね」と凍りついた声で呟く彼女の背後で、教室の暗闇がいっそう深く濃くなった気がした。';
  }

  if (effect.trustDelta < 0 || effect.courageDelta <= -2) {
    return '目を逸らして沈黙を選んだ瞬間、時計の秒針の音が不気味なほど大きく耳元で響いた。暗闇の中から、無数の視線がこちらを覗き込んでいる気がする。';
  }

  if (effect.reactionKey.startsWith('free_')) {
    return `あなたの「${playerInput}」という言葉が暗闇を切り裂くように届き、陽菜（A）はハッと顔を上げた。張り詰めていた彼女の表情が和らぎ、「……ありがとう。その言葉で、息ができるようになった気がするよ」と静かに微笑んだ。`;
  }

  const positiveResponses = [
    '穏やかなやり取りの裏で、予鈴のチャイムが遠くに響く。まだ誰も、これから始まる静寂の恐怖を知らない。',
    '外からは一切見えない痛みが、これほどまでに人間を追い詰めるという事実。冷や汗とともに、これまで見えていなかった世界の裏側が浮かび上がる。',
    '決めつけずに耳を傾けようとするあなたの誠実な声に、陽菜（A）は凍りついていた肩の力を抜き、長年隠してきた秘密の扉を少しずつ開いてくれた。',
    '彼女がくぐり抜けてきた暗い夜と涙の記憶を受け止めたことで、恐怖の密室に確かな「連帯の光」が差し込み始めた。',
    'あなたが恐怖に打ち勝って踏み出したその一歩が、教室を支配していた冷酷な空気を確実に塗り替えていった。',
  ];
  return positiveResponses[Math.min(positiveResponses.length - 1, Math.max(0, chapterNumber - 1))];
};

/**
 * 事前診断結果にもとづき、AIによる「トラウマ・共感プロファイル診断レポート＆導入プロローグ」を生成するプロンプト
 * @param {PreDiagnosisAnswers} answers
 * @param {StoryBlueprint} blueprint
 * @returns {string}
 */
export const buildPreDiagnosisAiPrompt = (answers, blueprint) => {
  const exp = EXPERIENCE_OPTIONS[answers.experience];
  const scene = TRIGGER_SCENE_OPTIONS[answers.triggerScene];
  const fear = FEAR_FOCUS_OPTIONS[answers.fearFocus];
  const rel = RELATIONSHIP_OPTIONS[answers.relationship];
  const coping = COPING_STYLE_OPTIONS[answers.copingStyle];
  const freeComment = answers.freeComment.trim() || '（特になし）';

  return `
あなたは心理ホラー×共感ノベルゲーム『静寂の教室と、ふたりの呼吸 — SILENT CLASSROOM —』の専属ディレクターです。
プレイヤーの事前診断（トラウマ・閉所恐怖プロファイリング）結果をもとに、プレイヤーの心に深く刺さる「プロファイル解析メッセージ」と「ホラーノベル風の導入プロローグ」を作成してください。

【プレイヤー診断データ】
- 名前: ${answers.playerName || '結城 蓮'}
- 体調・不安の経験: ${exp.label}（${exp.description}）
- 最も逃げ場がないと感じる密室舞台: ${scene.label}
- 最も恐れる処刑・状況: ${fear.label}
- 希望する視点・関係性: ${rel.label}
- 追い詰められた時の精神防衛反応: ${coping.label}
- プレイヤーの自由記述: ${freeComment}
- 決定されたシナリオ: ${blueprint.routeTitle}

【出力形式】
以下の2段落構成（合計250〜350文字程度）で出力してください（見出し記号は不要）：
1段落目：プレイヤーが選んだ密室（${scene.placeName}）や恐怖の核（${fear.label}）、自由記述の内容に寄り添い、この物語があなた専用の心理ホラー＆救済体験としてどう構築されたかを伝える文章。
2段落目：これから始まる第一幕へとプレイヤーを引き込む、静寂と緊張感が漂うサウンドノベル風の専用プロローグ文章。
`.trim();
};

/**
 * 事前診断と直前の展開にもとづいて、各章のストーリー本文とモノローグをプレイヤー専用に書き換えるAIプロンプト
 * @param {Object} params
 * @param {PreDiagnosisAnswers} params.answers
 * @param {StoryBlueprint} params.blueprint
 * @param {ChapterData} params.chapterData
 * @param {StoryMetrics} params.metrics
 * @param {string} params.lastReactionText
 * @returns {string}
 */
export const buildPersonalizedChapterAiPrompt = ({
  answers,
  blueprint,
  chapterData,
  metrics,
  lastReactionText,
}) => {
  const scene = TRIGGER_SCENE_OPTIONS[answers.triggerScene];
  const fear = FEAR_FOCUS_OPTIONS[answers.fearFocus];
  const coping = COPING_STYLE_OPTIONS[answers.copingStyle];

  return `
あなたはIBS（過敏性腸症候群）の「静かな教室での予期不安・腹鳴・視線の恐怖」をリアルな心理ホラー（サウンドノベル風）として描き、そこから理解と連帯による救済へと導くゲームの脚本AIです。
以下の「章の骨格（ベースシナリオ）」を必ず守りつつ、プレイヤーの「事前診断プロファイル」と「現在の状態」に合わせて、本文（3段落）と脳内モノローグ（1文）を執筆してください。

【プレイヤーの事前診断プロファイル】
- 主人公表記: ${blueprint.playerRoleLabel}
- ルート: ${blueprint.routeTitle}（${blueprint.isPatientRoute ? 'IBS当事者A視点・密室の恐怖から確実な救済へ' : 'B視点・日常の暗転と他者の痛みへの気づき'}）
- 最も恐怖を感じる密室舞台: ${scene.placeName}（${scene.ambiance}）
- 最も刺さる恐怖の核: ${fear.coreFear}
- 追い詰められた時の脳内反応: ${coping.monologueTone}
- 事前診断での自由記述: ${answers.freeComment.trim() || 'なし'}

【現在のゲームステータス】
- 章: ${chapterData.partLabel}「${chapterData.title}」（基本心拍数: ${chapterData.baseBpm} BPM / 静寂圧迫度: ${chapterData.silenceLevel}%）
- 共感度: ${metrics.empathy} / 決めつけ度: ${metrics.assumption} / 信頼度: ${metrics.trust}
- 直前のシーンの余韻: ${lastReactionText || '物語の幕開け'}

【この章で必ず描くべきベースシナリオ（骨格）】
段落1ベース: ${chapterData.paragraphs[0]}
段落2ベース: ${chapterData.paragraphs[1]}
段落3ベース: ${chapterData.paragraphs[2]}
脳内モノローグベース: ${chapterData.innerMonologue}

【厳守する出力フォーマット】
以下の4行構成（区切り文字「===」を使用）で出力してください。余計な解説は一切含めないでください。
段落1の文章
===
段落2の文章
===
段落3の文章
===
（脳内モノローグの文章）
`.trim();
};

/**
 * AIが生成した章書き換えテキストを安全にパースする純粋関数
 * @param {string} rawText
 * @param {ChapterData} fallbackChapter
 * @returns {PersonalizedChapterRewrite}
 */
export const parsePersonalizedChapterRewrite = (rawText, fallbackChapter) => {
  const parts = rawText
    .split('===')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (parts.length < 4) {
    return Object.freeze({
      paragraphs: fallbackChapter.paragraphs,
      innerMonologue: fallbackChapter.innerMonologue,
    });
  }

  return Object.freeze({
    paragraphs: Object.freeze([parts[0], parts[1], parts[2]]),
    innerMonologue: parts[3],
  });
};

/**
 * プレイヤーの選択または自由入力に対する、登場人物A（陽菜）や場面のリアルタイム反応を生成するプロンプト
 * @param {Object} params
 * @param {PreDiagnosisAnswers} params.answers
 * @param {StoryBlueprint} params.blueprint
 * @param {ChapterData} params.chapterData
 * @param {string} params.playerActionText
 * @param {boolean} params.isFreeTalk
 * @param {StoryMetrics} params.metrics
 * @returns {string}
 */
export const buildSceneReactionPrompt = ({
  answers,
  blueprint,
  chapterData,
  playerActionText,
  isFreeTalk,
  metrics,
}) => {
  return `
あなたは心理ホラー×共感ノベルゲーム『静寂の教室と、ふたりの呼吸』の語り手および登場人物「朝霧陽菜（A）」です。
現在のシーンでプレイヤーが取った行動・発言に対して、サウンドノベル風の反応描写（150〜220文字程度）を生成してください。

【現在のシーン】
- ルート: ${blueprint.routeTitle}
- 章: ${chapterData.partLabel}「${chapterData.title}」（場所: ${chapterData.locationLabel}）
- シーンのあらすじ: ${chapterData.paragraphs.join(' ')}
- プレイヤーの防衛傾向: ${COPING_STYLE_OPTIONS[answers.copingStyle].label}
- プレイヤーの選択/発言（${isFreeTalk ? '自由入力による直接対話' : '選択肢'}）: 「${playerActionText}」
- 現在のスコア: 共感度=${metrics.empathy}, 決めつけ度=${metrics.assumption}, 信頼度=${metrics.trust}

【執筆指針】
- ${blueprint.isPatientRoute ? 'プレイヤーはIBSを抱える陽菜（A）自身です。暗闇の恐怖がほんの少し和らぎ、親友との絆や生き延びる希望を感じられる描写にしてください。' : 'プレイヤーはBです。もしプレイヤーの発言が「自分の浅い経験だけで決めつける内容（気にしすぎ、気合いで治る等）」や「嘲笑・逃避」であれば、陽菜（A）の瞳から光が消え、教室の暗闇と不気味な静寂がいっそう深まるホラー調の反応を描いてください。逆に誠実に耳を傾けたり寄り添う内容であれば、暗闇の中に温かい光が差し込み、陽菜が救われた表情を見せる描写にしてください。'}
- 1段落（150〜220文字）で出力してください。
`.trim();
};

/**
 * エンディング到達時に、登場人物A（朝霧陽菜）からプレイヤー個人宛ての『あなた専用の手紙（または残された記録）』を生成するプロンプト
 * @param {Object} params
 * @param {PreDiagnosisAnswers} params.answers
 * @param {StoryBlueprint} params.blueprint
 * @param {EndingDefinition} params.ending
 * @param {readonly ActionLogEntry[]} params.actionLogs
 * @returns {string}
 */
export const buildPersonalLetterPrompt = ({
  answers,
  blueprint,
  ending,
  actionLogs,
}) => {
  const playerName = answers.playerName.trim() || 'あなた';
  const logSummary = actionLogs
    .map((entry) => `- 第${entry.chapterNumber}幕: 「${entry.playerInput}」`)
    .join('\n');

  return `
あなたは物語の登場人物「朝霧 陽菜（あさぎり ひな / IBSを抱える高校生）」です。
物語を終えたプレイヤー（${playerName}）に向けて、事前診断の内容と物語の中で選んでくれた言葉を振り返りながら、『あなた専用の手紙（バッドエンドの場合は残された未送信メモ）』を書いてください。

【プレイヤーと物語の記録】
- プレイヤー名: ${playerName}
- プレイしたルート: ${blueprint.routeTitle}
- プレイヤーが事前診断で選んだ密室舞台: ${TRIGGER_SCENE_OPTIONS[answers.triggerScene].label}
- プレイヤーが事前診断で選んだ精神防衛傾向: ${COPING_STYLE_OPTIONS[answers.copingStyle].label}
- プレイヤーの事前診断自由記述: ${answers.freeComment.trim() || 'なし'}
- 到達したエンディング: ${ending.badge}『${ending.title}』（${ending.subtitle}）
- プレイヤーが物語の中で選んだ行動・言葉:
${logSummary}

【執筆ルール】
- 250〜380文字程度で出力してください。
- ${blueprint.isPatientRoute ? '同じIBSや見えない痛みを抱えて暗闇を生き延びてきた同志として、プレイヤー自身のこれまでの苦闘を深く肯定し、「もう教室の静寂の中でひとりじゃないよ」と温かく包み込む手紙にしてください。' : ending.isHorrorBadEnd ? 'ホラーバッドエンド後の「破り捨てられたノートの切れ端」または「未送信のメッセージ」として、無自覚な決めつけや嘲笑の目がどれほど人を追い詰めるかを静かに、背筋が冷たくなるような筆致で突きつける文章にしてください。' : 'プレイヤーが暗闇の中で掛けてくれた具体的な言葉に触れながら、どれほど救われたか、そしてこれからも一緒に呼吸していきたいという感謝を伝える温かい手紙にしてください。'}
`.trim();
};

/** @type {readonly (readonly [string, string])[]} */
const ERROR_STATUS_MARKERS = Object.freeze([
  Object.freeze(['RESOURCE_EXHAUSTED', '429']),
  Object.freeze(['quota', '429']),
  Object.freeze(['PERMISSION_DENIED', '403']),
  Object.freeze(['API_KEY_INVALID', '400']),
  Object.freeze(['NOT_FOUND', '404']),
  Object.freeze(['UNAVAILABLE', '503']),
]);

/**
 * 例外オブジェクトからHTTPステータスコード文字列のみを安全に抽出する純粋関数
 * @param {unknown} error
 * @returns {string}
 */
export const errorStatus = (error) => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = /** @type {{ code?: unknown }} */ (error).code;
    if (typeof code === 'number' && Number.isInteger(code) && code >= 400 && code <= 599) {
      return String(code);
    }
  }
  const text = String(error);
  const match = /\b([45]\d{2})\b/.exec(text);
  if (match !== null) {
    return match[1];
  }
  const lowerText = text.toLowerCase();
  for (const [marker, status] of ERROR_STATUS_MARKERS) {
    if (lowerText.includes(marker.toLowerCase())) {
      return status;
    }
  }
  return '不明';
};

/**
 * APIエラー一覧から認証情報や入力本文を含まない安全な案内メッセージを生成する純粋関数
 * @param {readonly ModelErrorEntry[]} errors
 * @returns {string}
 */
export const formatApiErrors = (errors) => {
  const statuses = errors.map(({ model, error }) => ({
    model,
    status: errorStatus(error),
  }));
  const codes = new Set(statuses.map((item) => item.status));
  /** @type {string[]} */
  const guidance = [];

  if (codes.has('400') || codes.has('401') || codes.has('403')) {
    guidance.push('APIキー・権限・リクエスト設定を確認してください。');
  }
  if (codes.has('429')) {
    guidance.push(
      'APIの利用上限に達したモデルがあります。Google AI Studioで割り当てと利用状況を確認してください。'
    );
  }
  if (codes.has('404')) {
    guidance.push(
      '利用できないモデルがあります。モデル名と利用可否を確認してください。'
    );
  }
  if (codes.has('500') || codes.has('502') || codes.has('503') || codes.has('504')) {
    guidance.push(
      'API側の一時的な障害やタイムアウトの可能性があります。時間をおいて再試行してください。'
    );
  }
  if (guidance.length === 0) {
    guidance.push('API呼び出しに失敗しました。内蔵パーソナライズエンジンで進行します。');
  }

  const details = statuses
    .map(({ model, status }) => `- ${model}: ${status}`)
    .join('\n');

  return (
    'AI生成の呼び出しに失敗しました。\n\n' +
    guidance.join('\n') +
    '\n\nモデル別ステータス:\n' +
    details
  );
};

/**
 * HTTPステータスコードを持つエラーを生成する
 * @param {number} statusCode
 * @param {string} message
 * @returns {Error & { code: number }}
 */
const createHttpError = (statusCode, message) => {
  const err = /** @type {Error & { code: number }} */ (new Error(message));
  err.code = statusCode;
  return err;
};

/**
 * Gemini API レスポンスJSONから生成テキストを安全に抽出する純粋関数
 * @param {unknown} payload
 * @returns {string | null}
 */
export const extractTextFromGeminiPayload = (payload) => {
  if (typeof payload !== 'object' || payload === null || !('candidates' in payload)) {
    return null;
  }
  const candidates = /** @type {{ candidates?: unknown }} */ (payload).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }
  const firstCandidate = /** @type {unknown} */ (candidates[0]);
  if (
    typeof firstCandidate !== 'object' ||
    firstCandidate === null ||
    !('content' in firstCandidate)
  ) {
    return null;
  }
  const content = /** @type {{ content?: unknown }} */ (firstCandidate).content;
  if (typeof content !== 'object' || content === null || !('parts' in content)) {
    return null;
  }
  const parts = /** @type {{ parts?: unknown }} */ (content).parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return null;
  }
  const texts = parts
    .map((part) => {
      if (typeof part === 'object' && part !== null && 'text' in part) {
        const text = /** @type {{ text?: unknown }} */ (part).text;
        return typeof text === 'string' ? text : '';
      }
      return '';
    })
    .filter((text) => text.length > 0);

  return texts.length > 0 ? texts.join('') : null;
};

const SAFETY_SETTINGS = Object.freeze([
  Object.freeze({ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }),
  Object.freeze({ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' }),
  Object.freeze({ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }),
  Object.freeze({ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }),
]);

/**
 * Gemini REST API をフォールバック付きで呼び出す汎用関数
 * @param {Object} params
 * @param {string} params.prompt
 * @param {string} params.apiKey
 * @param {number} [params.temperature]
 * @param {number} [params.maxOutputTokens]
 * @param {typeof fetch} [params.fetchImpl]
 * @returns {Promise<{ readonly ok: true; readonly text: string } | { readonly ok: false; readonly errorMessage: string }>}
 */
export const callGeminiWithFallback = async ({
  prompt,
  apiKey,
  temperature = 0.8,
  maxOutputTokens = 700,
  fetchImpl = globalThis.fetch,
}) => {
  const trimmedKey = apiKey.trim();
  if (trimmedKey.length === 0) {
    return Object.freeze({
      ok: false,
      errorMessage: formatApiErrors([
        { model: '初期化', error: createHttpError(400, 'API_KEY_INVALID') },
      ]),
    });
  }

  /** @type {ModelErrorEntry[]} */
  const errors = [];

  for (const modelName of CHAT_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName
      )}:generateContent`;

      const response = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': trimmedKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            topP: 0.92,
            maxOutputTokens,
          },
          safetySettings: SAFETY_SETTINGS,
        }),
      });

      if (!response.ok) {
        throw createHttpError(response.status, `HTTP ${response.status}`);
      }

      /** @type {unknown} */
      const payload = await response.json();
      const text = extractTextFromGeminiPayload(payload);
      if (text === null || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }

      return Object.freeze({ ok: true, text: text.trim() });
    } catch (error) {
      errors.push({ model: modelName, error });
    }
  }

  return Object.freeze({
    ok: false,
    errorMessage: formatApiErrors(errors),
  });
};

/**
 * タイムスタンプ文字列（YYYYMMDD_HHMMSS）を生成する純粋関数
 * @param {Date} date
 * @returns {string}
 */
export const formatFileTimestamp = (date) => {
  const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
};

export {
  buildPersonalizedChapters,
  createStoryBlueprint,
  COPING_STYLE_OPTIONS,
  ENDINGS,
  EXPERIENCE_OPTIONS,
  FEAR_FOCUS_OPTIONS,
  RELATIONSHIP_OPTIONS,
  TRIGGER_SCENE_OPTIONS,
};
