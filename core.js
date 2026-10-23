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
  '一歩',
  '病院',
  '親',
  '母',
  '合図',
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
      // 「気にしすぎじゃないよ」など否定文脈の場合は除外
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
 * - IBS当事者ルート（isPatientRoute === true）は必ずAが救われるエンドへ到達する
 * - 非IBS当事者ルートは選択やAI対話によってトゥルー・ハッピー・AI共創・ビター・バッドエンドへ分岐する
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
      `あなたの「${playerInput}」という思いが、静かに胸の奥に染み渡っていく。自分の痛みを無理に否定しなくていいのだと、心が少しだけ軽くなった。`,
      '深く息を吐き出すと、張り詰めていたお腹の緊張がほんの少し和らいだ。自分を守るための選択肢を持っていることが、確かな支えになっている。',
      '過去の涙を肯定できたことで、胸のつかえがスッと溶けていく。あの夜の自分が諦めなかったからこそ、今の自分がここにいる。',
      'あなたの「私も。」という言葉に、親友はポロポロと涙をこぼしながら頷いた。孤独だった二つの心が、確かな温もりで結ばれた瞬間だった。',
      'ひとりじゃない。そう実感した瞬間、教室の窓から差し込む光がこれまでよりずっと優しく見えた。',
    ];
    return responses[Math.min(responses.length - 1, Math.max(0, chapterNumber - 1))];
  }

  if (effect.assumptionDelta >= 3) {
    return 'その言葉を聞いた瞬間、陽菜（A）はハッとしたように言葉を飲み込み、少し寂しそうに目を伏せた。「……そっか、そうだよね」と微笑む彼女の声には、見えない壁ができてしまったような冷たさがあった。';
  }

  if (effect.trustDelta < 0 || effect.courageDelta <= -2) {
    return '言葉を飲み込んで目を逸らしたあと、胸の奥にチクリとした小さな痛みが残った。教室のざわめきが、いつもより遠く冷たく聞こえる。';
  }

  if (effect.reactionKey.startsWith('free_')) {
    return `あなたの「${playerInput}」という言葉に、陽菜（A）は驚いたように顔を上げ、やがて安心したように柔らかく微笑んだ。「……そんなふうに言ってくれて、本当にありがとう。なんだかすごく救われた気がするよ」`;
  }

  const positiveResponses = [
    '何気ないやり取りの中に、確かな優しさが流れる。まだ相手のすべてを知らなくても、そのまなざしは次の時間への伏線となっていく。',
    '目に見えない苦しさがどれほど人を追い詰めるか、身をもって知ったことで、世界の見え方が大きく変わり始めていた。',
    '決めつけずに耳を傾けようとするあなたの誠実な姿勢に、陽菜（A）は張り詰めていた肩の力を抜き、少しずつ本当の思いを語り始めた。',
    '彼女がくぐり抜けてきた長い夜と涙の記憶を受け止めたことで、ふたりの間には表面的な同情ではない、深い理解と信頼が生まれた。',
    'あなたが踏み出したその一歩が、静まり返った教室の空気を確かな温もりへと変えていった。',
  ];
  return positiveResponses[Math.min(positiveResponses.length - 1, Math.max(0, chapterNumber - 1))];
};

/**
 * 事前診断結果にもとづき、AIによる「パーソナライズ診断レポート＆導入プロローグ」を生成するプロンプトを組み立てる純粋関数
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
あなたはインタラクティブ・ノベルゲーム『静寂の教室と、ふたりの呼吸』の専属ストーリーディレクターです。
プレイヤーの事前診断結果をもとに、プレイヤーに最も深く刺さる「個別最適化メッセージ」と「専用プロローグ」を作成してください。

【プレイヤー診断データ】
- 名前: ${answers.playerName || '結城 蓮'}
- 体調・不安の経験: ${exp.label}（${exp.description}）
- 最も緊張感・リアリティを感じる場面: ${scene.label}
- 最も怖い・つらいと感じる要素: ${fear.label}
- 希望する視点・関係性: ${rel.label}
- 追い詰められた時の心のクセ: ${coping.label}
- プレイヤーの自由記述: ${freeComment}
- 決定されたルート: ${blueprint.routeTitle}

【出力形式】
以下の2段落構成（合計250〜350文字程度）で、温かく没入感のある日本語で出力してください（見出し記号は不要）：
1段落目：プレイヤーの診断結果（特に「${scene.placeName}」への緊張感や「${coping.label}」という傾向、自由記述の内容）に優しく寄り添い、この物語があなたのためにどう最適化されたかを伝えるメッセージ。
2段落目：これから始まる第一部へとプレイヤーを誘う、情景が浮かぶような専用プロローグ文章。
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
あなたはIBS（過敏性腸症候群）と「見えない痛みへの理解」をテーマにした青春ノベルゲームの脚本AIです。
以下の「章の骨格（ベースシナリオ）」を守りつつ、プレイヤーの「事前診断プロファイル」と「これまでの選択の積み重ね」に合わせて、プレイヤーの心に最も深く刺さるように本文（3段落）と心の声（モノローグ1文）を個別最適化して執筆してください。

【プレイヤーの事前診断プロファイル】
- 主人公表記: ${blueprint.playerRoleLabel}
- ルート: ${blueprint.routeTitle}（${blueprint.isPatientRoute ? 'IBS当事者A視点・救済重視' : 'B視点・気づきと対話重視'}）
- 最もリアルに感じる舞台: ${scene.placeName}（${scene.ambiance}）
- 最も刺さる恐怖・葛藤: ${fear.coreFear}
- 主人公の性格・防衛スタイル: ${coping.monologueTone}
- 事前診断での自由記述: ${answers.freeComment.trim() || 'なし'}

【現在のストーリー状態】
- 章: ${chapterData.partLabel}「${chapterData.title}」
- 現在の共感度: ${metrics.empathy} / 決めつけ度: ${metrics.assumption} / 信頼度: ${metrics.trust}
- 直前のシーンの余韻: ${lastReactionText || '物語の幕開け'}

【この章で必ず描くべきベースシナリオ（骨格）】
段落1ベース: ${chapterData.paragraphs[0]}
段落2ベース: ${chapterData.paragraphs[1]}
段落3ベース: ${chapterData.paragraphs[2]}
心の声ベース: ${chapterData.innerMonologue}

【厳守する出力フォーマット】
以下の4行構成（区切り文字「===」を使用）で出力してください。余計な解説は一切含めないでください。
段落1の文章
===
段落2の文章
===
段落3の文章
===
（心の声・モノローグの文章）
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
あなたは青春ノベルゲーム『静寂の教室と、ふたりの呼吸』の語り手および登場人物「朝霧陽菜（A）」です。
現在のシーンでプレイヤーが取った行動・発言に対して、物語の反応描写（150〜220文字程度）を生成してください。

【現在のシーン】
- ルート: ${blueprint.routeTitle}
- 章: ${chapterData.partLabel}「${chapterData.title}」（場所: ${chapterData.locationLabel}）
- シーンのあらすじ: ${chapterData.paragraphs.join(' ')}
- プレイヤーの性格傾向: ${COPING_STYLE_OPTIONS[answers.copingStyle].label}
- プレイヤーの選択/発言（${isFreeTalk ? '自由入力による直接対話' : '選択肢'}）: 「${playerActionText}」
- 現在の関係性スコア: 共感度=${metrics.empathy}, 決めつけ度=${metrics.assumption}, 信頼度=${metrics.trust}

【執筆指針】
- ${blueprint.isPatientRoute ? 'プレイヤーはIBSを抱える陽菜（A）自身です。彼女の心が少し救われたり、親友との絆を感じたりする温かい描写にしてください。' : 'プレイヤーはBです。もしプレイヤーの発言が「自分の浅い経験だけで決めつける内容（気にしすぎ、すぐ治る等）」や「冷たい態度」であれば、陽菜（A）が静かに傷つき心を閉ざすリアルな反応を描いてください。逆に誠実に耳を傾けたり寄り添う内容であれば、陽菜の表情がほころび、心の距離が縮まる描写にしてください。'}
- 小説の地の文と陽菜の短いセリフを織り交ぜ、1段落（150〜220文字）で出力してください。
`.trim();
};

/**
 * エンディング到達時に、登場人物A（朝霧陽菜）からプレイヤー個人宛ての『あなた専用の手紙』を生成するプロンプト
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
    .map((entry) => `- 第${entry.chapterNumber}部: 「${entry.playerInput}」`)
    .join('\n');

  return `
あなたは物語の登場人物「朝霧 陽菜（あさぎり ひな / IBSを抱える高校生）」です。
物語を終えたプレイヤー（${playerName}）に向けて、事前診断の内容と物語の中で選んでくれた言葉を振り返りながら、心に響く『あなた専用の手紙』を書いてください。

【プレイヤーと物語の記録】
- プレイヤー名: ${playerName}
- プレイしたルート: ${blueprint.routeTitle}
- プレイヤーが事前診断で選んだ一番緊張する場面: ${TRIGGER_SCENE_OPTIONS[answers.triggerScene].label}
- プレイヤーが事前診断で選んだ心のクセ: ${COPING_STYLE_OPTIONS[answers.copingStyle].label}
- プレイヤーの事前診断自由記述: ${answers.freeComment.trim() || 'なし'}
- 到達したエンディング: ${ending.badge}『${ending.title}』（${ending.subtitle}）
- プレイヤーが物語の中で選んだ行動・言葉:
${logSummary}

【執筆ルール】
- 250〜380文字程度で、手紙形式（「${playerName}へ」で始まり、「朝霧 陽菜より」で結ぶ）にしてください。
- ${blueprint.isPatientRoute ? '同じIBSや見えない痛みを抱える仲間として、プレイヤー自身のこれまでの頑張りを深く肯定し、「あなたはひとりじゃないよ」と温かく包み込む手紙にしてください。' : ending.id.startsWith('bad_') ? 'すれ違ってしまった寂しさを滲ませつつも、相手を一方的に責めるのではなく「見えない痛みが誰の隣にもあることを、いつか思い出してくれたら嬉しい」と静かに語りかける手紙にしてください。' : 'プレイヤーが物語の中で掛けてくれた具体的な言葉に触れながら、どれほど救われたか、そしてこれからも支え合っていきたいという感謝を伝える手紙にしてください。'}
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
