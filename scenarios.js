// @ts-check

/**
 * @typedef {'ibs_patient' | 'invisible_pain' | 'empathic_observer' | 'unaware_healthy'} ExperienceType
 * @typedef {'japanese_class' | 'silent_exam' | 'commuter_train' | 'school_assembly'} TriggerSceneType
 * @typedef {'sound_shame' | 'sudden_wave' | 'suspicion_gaze' | 'helpless_isolation'} FearFocusType
 * @typedef {'best_friend' | 'distant_classmate' | 'self_protagonist'} RelationshipType
 * @typedef {'endure_alone' | 'pretend_normal' | 'rationalize_judge' | 'seek_connection'} CopingStyleType
 * @typedef {'route_a_healing' | 'route_v1_bestfriend' | 'route_v2_classmate'} StoryRouteId
 * @typedef {'calm' | 'clock_panic' | 'heartbeat_heavy' | 'sorrow' | 'dawn'} SoundPresetType
 *
 * @typedef {'healing_true' | 'healing_gentle' | 'true_bond' | 'happy_ally' | 'ai_cocreation' | 'bitter_distance' | 'bad_assumption' | 'bad_conformity'} EndingId
 *
 * @typedef {Object} PreDiagnosisAnswers
 * @property {string} playerName
 * @property {ExperienceType} experience
 * @property {TriggerSceneType} triggerScene
 * @property {FearFocusType} fearFocus
 * @property {RelationshipType} relationship
 * @property {CopingStyleType} copingStyle
 * @property {string} freeComment
 *
 * @typedef {Object} StoryBlueprint
 * @property {StoryRouteId} routeId
 * @property {string} routeTitle
 * @property {string} routeSubtitle
 * @property {string} playerRoleLabel
 * @property {string} triggerSceneLabel
 * @property {string} fearFocusLabel
 * @property {string} copingStyleLabel
 * @property {string} diagnosisSummary
 * @property {string} customPrologue
 * @property {boolean} isPatientRoute
 *
 * @typedef {Object} ChoiceEffect
 * @property {number} empathyDelta
 * @property {number} assumptionDelta
 * @property {number} courageDelta
 * @property {number} trustDelta
 * @property {string} reactionKey
 *
 * @typedef {Object} ChapterChoice
 * @property {string} id
 * @property {string} label
 * @property {string} subtext
 * @property {ChoiceEffect} effect
 *
 * @typedef {Object} ChapterData
 * @property {number} chapterNumber
 * @property {string} partLabel
 * @property {string} title
 * @property {string} moodTheme
 * @property {string} locationLabel
 * @property {number} baseBpm
 * @property {number} silenceLevel
 * @property {number} gazeEyesCount
 * @property {SoundPresetType} soundPreset
 * @property {readonly string[]} paragraphs
 * @property {string} innerMonologue
 * @property {string} promptQuestion
 * @property {readonly ChapterChoice[]} choices
 * @property {string} freeInputPlaceholder
 *
 * @typedef {Object} StoryMetrics
 * @property {number} empathy
 * @property {number} assumption
 * @property {number} courage
 * @property {number} trust
 * @property {number} freeTalkCount
 *
 * @typedef {Object} EndingDefinition
 * @property {EndingId} id
 * @property {string} badge
 * @property {string} title
 * @property {string} subtitle
 * @property {string} category
 * @property {boolean} isHorrorBadEnd
 * @property {number} endingBpm
 * @property {readonly string[]} paragraphs
 * @property {string} defaultLetterFromA
 * @property {string} reflectionNote
 */

/** @type {Readonly<Record<ExperienceType, { readonly label: string; readonly description: string }>>} */
export const EXPERIENCE_OPTIONS = Object.freeze({
  ibs_patient: Object.freeze({
    label: 'お腹の不調（IBSなど）で深く悩んだ経験がある',
    description: '静かな場所や外出先でのお腹の痛み・音・トイレの恐怖を、自分自身の現実として知っている',
  }),
  invisible_pain: Object.freeze({
    label: '周囲からは見えにくい体調不良やパニック・緊張を抱えたことがある',
    description: 'お腹に限らず、頭痛・息苦しさ・動悸など「外から見えない密室の苦しみ」を経験したことがある',
  }),
  empathic_observer: Object.freeze({
    label: '大きな体調の悩みはないが、周囲の視線や空気を強く気にしやすい',
    description: '教室のピリピリした空気や、誰かの小さな異変に敏感で、強い緊張を感じることがある',
  }),
  unaware_healthy: Object.freeze({
    label: '体調や緊張で困ったことはあまりなく、普段意識したことがない',
    description: '静かな授業や試験も普通に座っていられるのが当たり前で、他人の体調不良を深く考えたことはなかった',
  }),
});

/** @type {Readonly<Record<TriggerSceneType, { readonly label: string; readonly placeName: string; readonly ambiance: string }>>} */
export const TRIGGER_SCENE_OPTIONS = Object.freeze({
  japanese_class: Object.freeze({
    label: '5限目の静まり返った国語の授業',
    placeName: '5限目・現代文の密室教室',
    ambiance: '扉は閉め切られ、教師が教科書を朗読する声と時計の秒針だけが不気味なほど大きく響いている',
  }),
  silent_exam: Object.freeze({
    label: '時計の針の音だけが響く、途中退室しづらい試験中',
    placeName: '校内一斉模試・試験会場',
    ambiance: '問題用紙をめくる乾いた音と秒針の音が脳内を侵食し、誰一人として声を発しない絶対的な静寂が支配している',
  }),
  commuter_train: Object.freeze({
    label: '次の駅まで扉が開かない、朝の満員電車・通学バス',
    placeName: '急行電車・開かない扉の前',
    ambiance: '無数の他人に前後左右を塞がれて身動きが取れず、次の停車駅まであと7分も密室から脱出できない',
  }),
  school_assembly: Object.freeze({
    label: '全校生徒が体育館に整列する、静かな全校集会',
    placeName: '体育館・全校集会の包囲列',
    ambiance: '何百人もの生徒が床に座り込み、立ち上がれば全員の視線が一斉に突き刺さる逃げ場のない空間',
  }),
});

/** @type {Readonly<Record<FearFocusType, { readonly label: string; readonly coreFear: string }>>} */
export const FEAR_FOCUS_OPTIONS = Object.freeze({
  sound_shame: Object.freeze({
    label: '静寂の中でお腹が鳴り、オナラだと誤解されて嘲笑される恐怖',
    coreFear: '死のような静寂の中で自分の身体が勝手に音を鳴らし、周囲から「あの子オナラしてたよね？笑」と処刑される恐怖',
  }),
  sudden_wave: Object.freeze({
    label: '今すぐトイレに駆け込みたいのに、金縛りのように動けない恐怖',
    coreFear: '内臓を掴まれるような激痛の波と、全員の視線を浴びながら手を挙げて退室することへのパニック',
  }),
  suspicion_gaze: Object.freeze({
    label: '何度も扉を開けるたび「また？」「サボり？」と監視される恐怖',
    coreFear: '教室を出入りするたびに背中へ突き刺さる「あの子、またトイレ？」という無数の冷酷な目',
  }),
  helpless_isolation: Object.freeze({
    label: 'どれだけ苦しんでも「気のせい」「考えすぎ」と突き放される絶望',
    coreFear: '地獄のような苦しみを訴えても「気合いの問題でしょ」と笑われ、世界で一人きりになる絶望',
  }),
});

/** @type {Readonly<Record<RelationshipType, { readonly label: string; readonly routeHint: string }>>} */
export const RELATIONSHIP_OPTIONS = Object.freeze({
  self_protagonist: Object.freeze({
    label: 'IBSを抱える高校生「陽菜（A）」本人として、静寂の悪夢から光へ生還したい',
    routeHint: 'IBS当事者深掘りルート（A視点・密室からの救済ストーリー）',
  }),
  best_friend: Object.freeze({
    label: '別クラスだけど昼休みを一緒に過ごす「親友（B）」として、突然の異変を体験したい',
    routeHint: 'Scenario Version.1（親友B視点・日常の崩壊と「私も。」の共鳴）',
  }),
  distant_classmate: Object.freeze({
    label: '同じクラスの「クラスメイト（B）」として、「あの子、また？」の謎と恐怖に触れたい',
    routeHint: 'Scenario Version.2（クラスメイトB視点・傍観者から当事者への暗転）',
  }),
});

/** @type {Readonly<Record<CopingStyleType, { readonly label: string; readonly monologueTone: string }>>} */
export const COPING_STYLE_OPTIONS = Object.freeze({
  endure_alone: Object.freeze({
    label: '「誰にも気づかれたくない」と息を止め、一人で限界まで耐えようとする',
    monologueTone: '爪が掌に食い込むほど拳を握りしめ、お願いだから止まってくれと自分の身体を呪うように祈る',
  }),
  pretend_normal: Object.freeze({
    label: '顔が引きつりながらも「平気なフリ」の仮面を貼り付け、内側で壊れていく',
    monologueTone: '「なんでもない」と微笑む仮面の裏側で、冷や汗と自己嫌悪がドロドロと溢れ出していく',
  }),
  rationalize_judge: Object.freeze({
    label: '「なぜ制御できないんだ」と頭で抑え込もうとして、さらなるパニックに陥る',
    monologueTone: '理性では抑えられない内臓の反乱に、これまで信じていた「普通」という足場が崩れ落ちていく',
  }),
  seek_connection: Object.freeze({
    label: '誰かに助けを求めたいのに、嘲笑される幻聴が聞こえて声を失う',
    monologueTone: '「助けて」の一言が喉まで出かかっているのに、突き放される恐怖が声帯を凍りつかせる',
  }),
});

/**
 * 事前診断の回答から最適なルートIDを判定する純粋関数
 * @param {PreDiagnosisAnswers} answers
 * @returns {StoryRouteId}
 */
export const resolveRouteId = (answers) => {
  if (answers.relationship === 'self_protagonist') {
    return 'route_a_healing';
  }
  if (answers.experience === 'ibs_patient' && answers.relationship !== 'distant_classmate') {
    return 'route_a_healing';
  }
  if (answers.relationship === 'distant_classmate') {
    return 'route_v2_classmate';
  }
  if (answers.experience === 'unaware_healthy' && answers.fearFocus === 'suspicion_gaze') {
    return 'route_v2_classmate';
  }
  return 'route_v1_bestfriend';
};

/**
 * 事前診断の恐怖焦点（fearFocus）に応じた第1部の不穏な伏線エピソードを生成する純粋関数
 * @param {FearFocusType} fearFocus
 * @param {StoryRouteId} routeId
 * @returns {string}
 */
const buildPart1ForeshadowParagraph = (fearFocus, routeId) => {
  if (routeId === 'route_v2_classmate') {
    switch (fearFocus) {
      case 'sound_shame':
        return '休み時間、近くの席の生徒たちが「さっきの静かな時間、誰かのお腹が変な音鳴ってなかった？笑」とクスクス笑っていた。その輪から離れた一番後ろの席で、朝霧さんが逃げるように教室を出ていくのが見えた。';
      case 'sudden_wave':
        return 'チャイムが鳴るたび、朝霧さんの指先が白くなるほど机の端を掴んでいることに私は気づかなかった。ただ「また授業の途中で出ていくな、サボりかな」と、安全圏から冷ややかに眺めていたのだ。';
      case 'suspicion_gaze':
        return '「ねえ、朝霧さんまたトイレ？」「授業とかテストちゃんと受けなくて大丈夫なのかな？」——教室に漂う無邪気で残酷な視線。事情を知らない私もまた、彼女を追い詰める「監視の目」のひとつになっていた。';
      case 'helpless_isolation':
        return '「体調悪いなら休めばいいのに、なんで普通そうな顔して座ってるんだろうね」——誰かの心ない言葉が教室に落ちる。外からは全く見えない「地獄」がこの教室に存在することを、私はまだ知らなかった。';
    }
  }

  switch (fearFocus) {
    case 'sound_shame':
      return 'お弁当を食べながら「5限目の授業ってシーンとしてて、お腹鳴りそうで嫌だよね」と私が何気なく笑った瞬間、陽菜の箸がピタリと止まった。「……うん。あの静けさは、時々息ができなくなるくらい怖いよ」と呟いた彼女の瞳の暗さに、この時の私は気づけなかった。';
    case 'sudden_wave':
      return '購買の冷たいジュースを飲もうとした私を見て、陽菜は「お腹が冷えると午後が怖いから、私は白湯にしてるんだ」と微笑んだ。その笑顔の裏に、毎時間「限界の波」に怯える壮絶な闘いがあることなど、私は想像すらしていなかった。';
    case 'suspicion_gaze':
      return '廊下を通りかかった生徒が「あいつまた授業中に抜けてたよな笑」と誰かの噂話をしていたとき、陽菜がビクッと肩を震わせて俯いた。だが私は、その小さな震えの意味を何も知らなかった。';
    case 'helpless_isolation':
      return '「もしさ、どれだけ苦しくても『気のせい』って誰にも信じてもらえなかったら、どうする？」——昼休みの光の中で陽菜がぽつりと落とした問いかけは、やがて私自身が体験する悪夢の予告編のようだった。';
  }
};

/**
 * 事前診断の舞台（triggerScene）と恐怖焦点（fearFocus）に応じた第2部のホラー・クライシス展開を生成する純粋関数
 * @param {TriggerSceneType} triggerScene
 * @param {FearFocusType} fearFocus
 * @param {string} playerName
 * @param {StoryRouteId} routeId
 * @returns {readonly string[]}
 */
const buildPart2CrisisParagraphs = (triggerScene, fearFocus, playerName, routeId) => {
  const scene = TRIGGER_SCENE_OPTIONS[triggerScene];

  if (routeId === 'route_a_healing') {
    const stageDesc =
      triggerScene === 'commuter_train'
        ? '扉が閉まり、急行電車が走り出す。次の駅まで7分間、絶対に外へ出られない鉄の密室。その閉塞感が引き金となり、私（陽菜）の下腹部に冷たい刃を突き立てられたような激痛が走った。'
        : triggerScene === 'school_assembly'
          ? '体育館の扉が閉ざされ、全校生徒が静まり返る。何百もの人間が密集する床の中央で、私（陽菜）の腸が不気味な音を立てて痙攣し始めた。'
          : `チャイムが鳴り終わり、${scene.placeName}の扉が閉まる。${scene.ambiance}。その「逃げ場のない静寂」が、私（陽菜）を捕らえる檻へと変貌した。`;

    const fearDesc =
      fearFocus === 'sound_shame'
        ? '「今、この死のような静けさの中でお腹が鳴ったらどうしよう。オナラだと誤解されて、一斉に振り返られたら——」恐怖が神経を逆撫でし、抑えようと力を込めるほどお腹の奥で不穏な空気が膨張していく。'
        : fearFocus === 'suspicion_gaze'
          ? '先生には事前に伝えてある。いつでも出ていいはずなのに、立ち上がった瞬間に背後から突き刺さる「またあの子出ていったよ」という無数の視線を想像するだけで、足が鉛のように凍りつく。'
          : '外から見れば、ただ静かに座っている一人の女子高生にしか見えない。けれど皮膚の内側では、冷や汗が噴き出し、1秒が1時間にも感じられる孤独な拷問が続いていた。';

    return Object.freeze([
      stageDesc,
      fearDesc,
      'かつて「IBS（過敏性腸症候群）」という病名を知る前、私はこの怪異のような身体の反乱を「自分の心が弱いせいだ」と責め続け、暗いトイレの個室でひとり震えていた。',
    ]);
  }

  if (routeId === 'route_v2_classmate') {
    const stageCrisis =
      triggerScene === 'commuter_train'
        ? `異変は前触れもなく訪れた。朝の満員電車、次の駅まで扉が開かない密室の中で、私（${playerName}）の下腹部を雑巾のように捻り上げる激痛が襲った。脂汗を流して学校に辿り着いたあとも、静まり返った教室の中で不気味な腹鳴と痛みの波が止まらない。`
        : triggerScene === 'school_assembly'
          ? `ある日の全校集会。体育館の列の真ん中で身動きが取れなくなった瞬間、私（${playerName}）のお腹の奥で何かが暴れ始めた。周囲は何百人もの生徒の壁。今ここで立ち上がれば、全員の目が自分に突き刺さる。`
          : `ある日の${scene.placeName}。${scene.ambiance}。その息が詰まるような静寂の中で、私（${playerName}）は突然お腹の激しい不調に襲われた。最初はすぐ治ると思っていたのに、冷や汗が背中を伝い、視界の端が暗く滲み始める。`;

    const fearRealization =
      fearFocus === 'sound_shame'
        ? '「やめてくれ、今ここで音が鳴ったらオナラだと思われる……！」必死に息を止めて腹筋に力を込めるが、静かな教室でまた症状が出たらどうしようと考えるうちに、心臓の鼓動が耳元で警報のように鳴り響いた。'
        : '「今席を立ったら、周りから『あの子、また？』って見られる……！」かつて自分が朝霧さんに向けていた何気ない疑問の目が、今度は教室中の生徒から自分へ向けられる恐怖となって襲いかかってきた。';

    return Object.freeze([
      stageCrisis,
      fearRealization,
      '外からは何も見えないのに、内側では発狂しそうなほどの恐怖と痛みが渦巻いている。私はこの時初めて、朝霧さんが何度も開けていたあの扉が「サボり」ではなく、この生き地獄から息をするための必死の脱出口だったのかもしれないと戦慄した。',
    ]);
  }

  // route_v1_bestfriend（シナリオVersion.1ベース・ホラー演出強化）
  const v1StageOpening =
    triggerScene === 'commuter_train'
      ? `異変の予兆は朝の満員電車から始まっていた。そして昼休みが終わり、5限目の授業が始まった直後——閉め切られた教室の中で、私（${playerName}）は自分の中の決定的な異変に気づいた。お腹が痛い。オナラも出そうだ。`
      : triggerScene === 'school_assembly'
        ? `昼休みが終わり、静まり返った体育館集会と5限目の授業が始まった。だが私（${playerName}）は自分の中の異変に気づく。お腹が痛い。オナラも出そうだ。誰も喋らない密室のような空間で、もし今オナラをしてしまったら……と血の気が引くような不安に駆られる。`
        : triggerScene === 'silent_exam'
          ? `昼休みが終わり、5限目の静まり返った小テストと朗読の時間になった。だが私（${playerName}）は自分の中の異変に気づく。お腹が痛い。オナラも出そうだ。時計の秒針と先生の声だけが響く教室で今、オナラをしてしまったら……と恐怖に駆られる。`
          : `昼休みが終わり、5限目の国語の授業が始まった。だが私（${playerName}）は自分の中の異変に気づく。お腹が痛い。オナラも出そうだ。でも今は国語の時間。先生が教科書を読む声だけが響く教室で今、オナラをしてしまったら……と全身が凍りつくような不安に駆られる。`;

  return Object.freeze([
    v1StageOpening,
    '必死に耐えようと全身を硬直させたが、耐えることができず、外には出なかったものの、お腹の中でオナラのような音が「ギュルルッ、ブゥッ……」と不気味なほど大きく鳴り響いてしまった。静寂を切り裂いたその音は周りにも聞こえていたようで、周囲のクラスメイトたちの「目」がチラチラと一斉にこちらを見ていることに気がついた。（やばい、今のオナラだと思われたかな、違うのに…！）心の中で悲鳴を上げ、周りが誤解していないことをただ祈った。',
    'ようやく5限目が終わり、私はトイレに行くため逃げるように席を立った。教室を出ようとしたその時——教室の奥の方から「さっきさ、あの子オナラしてたよね？笑」「ヤバかったよね笑」とクラスメイト数人が嘲笑う声が耳に突き刺さった。私はトイレの個室に駆け込み、鍵を閉めて震えた。（そうじゃないのに、違うのに…！）泣き目になりながら声を殺したあの日から、教室は私にとって「恐怖の密室」になった。静かで周りに人がいると「またあの時みたいなことが起きたら」と考えれば考えるほど症状は悪化し、悪夢が何度も繰り返されるようになった。',
  ]);
};

/**
 * 事前診断の心のクセ（copingStyle）に応じた第3部の相談・接触シーンを生成する純粋関数
 * @param {CopingStyleType} copingStyle
 * @param {string} playerName
 * @param {StoryRouteId} routeId
 * @returns {readonly string[]}
 */
const buildPart3EncounterParagraphs = (copingStyle, playerName, routeId) => {
  if (routeId === 'route_v2_classmate') {
    const approachContext =
      copingStyle === 'endure_alone'
        ? '放課後、薄暗い廊下の隅でお腹を押さえて立ち尽くしていた私の前に、白湯のボトルを持った朝霧陽菜（A）が静かに現れた。'
        : copingStyle === 'rationalize_judge'
          ? '放課後、震える指でスマホに「静かな教室 お腹 恐怖」と打ち込んでいた私が顔を上げると、誰もいない踊り場に朝霧陽菜（A）が立っていた。'
          : '夕暮れの影が伸びる放課後の渡り廊下で、私は朝霧陽菜（A）と二人きりになった。';

    return Object.freeze([
      approachContext,
      '私の脳裏には、以前彼女に対して抱いていた「またトイレ？」「テストちゃんと受けなくて大丈夫なのかな」という冷たい疑問がよみがえっていた。「もしかして、朝霧さんもずっと、あの教室の静寂の中でこんな恐怖と戦っていたのか……？」',
      'だが、ここで選択を誤ってはいけない。自分が一度経験しただけの浅い恐怖で「私も同じ、わかるよ」と決めつけてしまえば、それは彼女を再び孤独の檻へ突き落とす刃になる。本人の口から直接聞いて初めてわかる真実があるはずだ。',
    ]);
  }

  const v1Opening =
    copingStyle === 'pretend_normal'
      ? '悪夢のような症状に苦しめられるようになって数週間。私は昼休みも必死に平気なフリの仮面を貼り付けていたが、震える手で箸を落とした私を見て、陽菜（A）が静かに顔を覗き込んだ。もう限界だった。私は思い切って陽菜に相談してみることにした。'
      : copingStyle === 'endure_alone'
        ? '症状に苦しめられるようになって数週間。誰にも言えず暗い階段の踊り場でうずくまっていた私を見つけたのは、陽菜（A）だった。私は震える声で、ついに秘密を打ち明けることにした。'
        : '症状に苦しめられるようになって数週間が経った頃、精神の限界を迎えていた私は、思い切って陽菜（A）に相談してみることにした。';

  return Object.freeze([
    v1Opening,
    '「最近さ、授業とか静かで人がいっぱいのとこで緊張してお腹が痛くなっちゃって、全然集中できないんだよね。」——そう告げて、私は暗い床へと目を落とした。きっとわかってもらえない。そんな子、自分も見たことないし、「気にしすぎじゃない？」ってあしらわれちゃうかも。その一言でトドメを刺されるのが怖かった。',
    'だが、暗闇の中で返ってきたのは、私の予想とは全く逆の言葉だった。「——私も。」陽菜は静かに、けれど真っ直ぐな声でそう告げた。驚きに顔を上げた私の目に映ったのは、私の痛みが骨の髄までわかると言いたげな陽菜の瞳だった。そこで陽菜は、自分も同じように長年IBS（過敏性腸症候群）という見えない怪物に苦しめられてきたこと、そして先生に相談し、どうやってあの教室を生き延びる対策を取っているのかを詳細に教えてくれたのだ。',
  ]);
};

/**
 * 事前診断の恐怖焦点（fearFocus）に応じた第4部（Aのアナザーストーリー・過去編）を生成する純粋関数
 * @param {FearFocusType} fearFocus
 * @param {StoryRouteId} routeId
 * @returns {readonly string[]}
 */
const buildPart4AnotherStoryParagraphs = (fearFocus, routeId) => {
  const specificStruggle =
    fearFocus === 'sound_shame'
      ? '「私もね、静かな教室でお腹が鳴るのが死ぬほど怖くて、水すら飲めなくなった時期があったの。それなのに家に帰ってお母さんに話しても『お腹が鳴るくらい誰でもあるでしょ、考えすぎ！』って笑われて……世界中が敵に見えて、暗い部屋で毎日泣いてた」'
      : fearFocus === 'suspicion_gaze'
        ? '「私もね、何度も席を立つたびにクラス中から『また？』『サボり？』って見られるのが怖くて、教室の扉が処刑台の入り口に見えてたの。お母さんに言っても最初は『気合いで我慢しなさい』って突き放されて、誰にも理解してもらえなかった」'
        : '「最初はね、お母さんに何度話してもなかなか理解されなかったの。『またお腹痛いの？ 神経質すぎるんじゃない？』って。一番近くにいてほしい人に『気のせい』って切り捨てられるのが、一番恐ろしくて孤独だった」';

  if (routeId === 'route_v2_classmate') {
    return Object.freeze([
      '夕闇が迫る廊下で、朝霧さんは自分がどうやってあの孤独な暗闇から今の自分に至ることができたのかを語ってくれた。',
      specificStruggle,
      '「でもある夜、過呼吸になるくらい泣きながら『サボりたいんじゃない、本当に毎日苦しいの！』って魂を削るように伝えたら、ようやくお母さんも理解してくれて。病院でIBSって診断を受けて、先生にも相談して配慮対策をしてもらえるようになったの」——彼女の壮絶な過去を知り、私は相手の事情を知らないまま外見だけで判断することの恐ろしさに身震いした。',
    ]);
  }

  return Object.freeze([
    '私の冷え切った手を両手で包み込みながら、陽菜は自分がどうやって今の自分に至ることができたのか——彼女の「アナザーストーリー」を語ってくれた。',
    specificStruggle,
    '「でもある日、暗い部屋で泣きながら、本当に深刻に苦しんでいることをお母さんに全部ぶつけたの。そしたらようやく理解してもらえて、病院へ行き、学校の先生にも相談して『出入口の席』や『無言で退出できる合図』の配慮対策をしてもらえるようになったんだ」——今こうして私を暗闇から引き上げてくれる陽菜もまた、かつては同じ暗闇の中で『誰かに支えてほしかった女の子』だったのだと知り、私の目から熱い涙がこぼれた。',
  ]);
};

/**
 * 事前診断に応じたモノローグ文を生成する純粋関数
 * @param {CopingStyleType} copingStyle
 * @param {'daily' | 'crisis' | 'aftermath' | 'confession' | 'resolution'} phase
 * @param {StoryRouteId} routeId
 * @returns {string}
 */
const buildPersonalizedMonologue = (copingStyle, phase, routeId) => {
  if (routeId === 'route_a_healing') {
    switch (phase) {
      case 'daily':
        return copingStyle === 'pretend_normal'
          ? '（笑っていれば、誰も私がポケットの中で薬のシートを握り潰しそうなことなんて気づかない。チャイムが鳴るまでの、束の間の執行猶予）'
          : '（この陽だまりがずっと続けばいいのに。予鈴が鳴れば、またあの『静寂の檻』へ戻らなければならない）';
      case 'crisis':
        return copingStyle === 'endure_alone'
          ? '（ドクン、ドクンと心臓が耳の奥で鳴る。お願い、静まって……。ここで音が鳴ったら、ここで動いたら、教室中の「目」が一斉に私を貫く）'
          : '（時計の針が遅すぎる。どうして私のお腹は、一番静かにしていたい密室に限って悲鳴をあげるんだろう）';
      case 'aftermath':
        return '（『考えすぎでしょ』——母のその一言が、私を一番暗い孤独の底へ突き落とした。痛みに名前がつくまでの夜は、本当に長くて冷たかった）';
      case 'confession':
        return '（震える声で打ち明けてくれた親友の顔を見て、胸の奥に光が差した。私が暗い夜を生き延びてきたのは、今日この子に『私も。』と伝えるためだったんだ）';
      case 'resolution':
        return '（怪異のように見えた教室の静寂も、味方がひとりいるだけでただの教室に戻っていく。私はもう、暗闇の中でひとりじゃない）';
    }
  }

  if (routeId === 'route_v2_classmate') {
    switch (phase) {
      case 'daily':
        return copingStyle === 'rationalize_judge'
          ? '（また朝霧さんが席を立った。試験中や大事な授業中なのに、ちゃんと受けなくて大丈夫なのかな……安全圏にいた私は、そんなふうに他人事として眺めていた）'
          : '（後ろの扉が閉まる音。『またトイレ？』という誰かの嘲笑。私は声に出さなかっただけで、心の中で同じ冷たい目を向けていたのだ）';
      case 'crisis':
        return copingStyle === 'endure_alone'
          ? '（冷や汗が止まらない。お腹が鳴りそうだ。今ここで席を立ったら、今度は私が『あの子、また？』と教室中の目に晒される側になる……！）'
          : '（秒針の音が頭蓋骨を直接叩くように響く。外からは普通に見えるのに、内側では地獄のようなパニックが起きている。朝霧さんは毎日これと戦っていたのか……！？）';
      case 'aftermath':
        return '（一度その恐怖を味わったくらいで『全部わかった』と思い上がるな。私が勝手に彼女を誤解していたように、浅い決めつけは相手を傷つける凶器になる）';
      case 'confession':
        return '（家族にすら信じてもらえず泣き叫んだ夜。先生と決めた退室の合図。あの後ろの扉は『逃げ』なんかじゃなく、彼女が教室で生き延びるための命綱だったんだ）';
      case 'resolution':
        return '（事情を知らないまま人を裁く『無数の目』の恐ろしさを、私はもう知っている。次に扉が開く時、私はその空気を変える側に立つ）';
    }
  }

  // route_v1_bestfriend
  switch (phase) {
    case 'daily':
      return copingStyle === 'seek_connection'
        ? '（陽菜と笑っている昼休みだけが安心できる時間だった。陽菜が時々体調を気にしている裏に、どれほどの孤独が隠されていたかなんて、この時の私は何も知らなかった）'
        : '（当たり前にお弁当を食べて、当たり前に5限目の教室へ戻る。その日常が数十分後に音を立てて崩れ去るなんて、夢にも思わなかった）';
    case 'crisis':
      return copingStyle === 'endure_alone'
        ? '（やばい、今の音、オナラだと思われたかな……違うのに、お腹の中で鳴っただけなのに！ 頼むからこっちを見ないで、チラチラ見ないで……！）'
        : '（先生の朗読の声しか聞こえない密室で、お腹の奥から響いた大きな音。一斉にこちらへ向けられたクラスメイトの視線が、皮膚を焼くように突き刺さる）';
    case 'aftermath':
      return copingStyle === 'pretend_normal'
        ? '（『さっきさ、あの子オナラしてたよね？笑』……トイレの個室で耳を塞いでも、あの笑い声が頭の中でリフレインして消えない。そうじゃないのに、違うのに……！）'
        : '（静かな教室に入るたび、心臓が跳ね上がりお腹が痛くなる。『またあの時みたいなことが起きたら』と怯える予期不安の無限ループが、私を蝕んでいった）';
    case 'confession':
      return '（『気にしすぎ』と笑われる恐怖で目を伏せた私に、陽菜が告げた『私も。』という一言。その瞬間、私を閉じ込めていた暗い密室の壁に、初めて光が差し込んだ）';
    case 'resolution':
      return '（私を支えてくれた陽菜もまた、かつては暗い部屋で泣いていたひとりの女の子だった。ふたりで息を合わせれば、もうあの静寂には呑み込まれない）';
  }
};

/**
 * 事前診断からプレイヤー専用のストーリー設計図（StoryBlueprint）を生成する純粋関数
 * @param {PreDiagnosisAnswers} answers
 * @returns {StoryBlueprint}
 */
export const createStoryBlueprint = (answers) => {
  const routeId = resolveRouteId(answers);
  const name = answers.playerName.trim().length > 0 ? answers.playerName.trim() : '結城 蓮';
  const sceneInfo = TRIGGER_SCENE_OPTIONS[answers.triggerScene];
  const fearInfo = FEAR_FOCUS_OPTIONS[answers.fearFocus];
  const copingInfo = COPING_STYLE_OPTIONS[answers.copingStyle];

  if (routeId === 'route_a_healing') {
    return Object.freeze({
      routeId,
      routeTitle: '特別編：『静寂の檻と、夜明けの呼吸』',
      routeSubtitle: 'IBSを抱える高校生・朝霧陽菜（A）の視点で体験する、密室の恐怖から救済への物語',
      playerRoleLabel: '朝霧 陽菜（A本人 / あなたの投影）',
      triggerSceneLabel: sceneInfo.label,
      fearFocusLabel: fearInfo.label,
      copingStyleLabel: copingInfo.label,
      diagnosisSummary:
        `【トラウマ・共感プロファイル解析完了】\nあなたの診断から「見えない痛みを抱える当事者としての深い共鳴」が検出されました。密室舞台を「${sceneInfo.placeName}」、恐怖の核を「${fearInfo.label}」に設定し、暗闇の孤独から確実な救済（光）へと至る専用シナリオを構築しました。`,
      customPrologue:
        `チャイムが鳴り、扉が閉まるたび、普通の教室は「音を立ててはいけない処刑場」へと姿を変える。${sceneInfo.placeName}の静寂に怯え続けたあなた（陽菜）が、痛みに名前をつけ、理解者と出会って呪縛を解くまでの記録——。`,
      isPatientRoute: true,
    });
  }

  if (routeId === 'route_v2_classmate') {
    return Object.freeze({
      routeId,
      routeTitle: 'Scenario Version.2：『「あの子、また？」の視線の牢獄』',
      routeSubtitle: 'クラスメイトの何気ない疑問が、自分自身を襲う密室の恐怖へと暗転する物語',
      playerRoleLabel: `${name}（陽菜のクラスメイト・B）`,
      triggerSceneLabel: sceneInfo.label,
      fearFocusLabel: fearInfo.label,
      copingStyleLabel: copingInfo.label,
      diagnosisSummary:
        `【トラウマ・共感プロファイル解析完了】\nあなたの診断に合わせて、発症密室を「${sceneInfo.placeName}」、恐怖の焦点を「${fearInfo.label}」、精神防衛反応を「${copingInfo.label}」に最適化したクラスメイト視点（Version.2）を構築しました。選択を誤れば本格的なホラーバッドエンドへ分岐します。`,
      customPrologue:
        `授業中や試験中、何度も後ろの扉から消えるクラスメイト・朝霧陽菜。「またトイレ？」「大丈夫なのかな？」——安全圏から向けていたその無邪気な視線は、ある日『${sceneInfo.placeName}』で${name}自身の身体が悲鳴を上げた瞬間、逃げ場のない恐怖となって牙を剥く。`,
      isPatientRoute: false,
    });
  }

  return Object.freeze({
    routeId: 'route_v1_bestfriend',
    routeTitle: 'Scenario Version.1：『五限目の静寂と、ふたりの呼吸』',
    routeSubtitle: '親友との穏やかな日常が、教室に響いた「音」と嘲笑によって悪夢へと変わる全五部作',
    playerRoleLabel: `${name}（陽菜の親友・B）`,
    triggerSceneLabel: sceneInfo.label,
    fearFocusLabel: fearInfo.label,
    copingStyleLabel: copingInfo.label,
    diagnosisSummary:
      `【トラウマ・共感プロファイル解析完了】\nあなたの診断に合わせて、悪夢の舞台を「${sceneInfo.placeName}」、最大の恐怖を「${fearInfo.label}」、脳内モノローグを「${copingInfo.label}」に個別最適化した親友視点（Version.1）を構築しました。`,
    customPrologue:
      `昼休みの陽だまりの中で笑い合っていた親友・朝霧陽菜（A）と${name}（B）。陽菜が隠していた痛みを何も知らなかった${name}は、5限目のチャイムとともに『${sceneInfo.placeName}』の静寂という名の密室に閉じ込められる——。`,
    isPatientRoute: false,
  });
};

/**
 * 事前診断とルートに基づいて全5章のパーソナライズされた章データを生成する純粋関数
 * @param {PreDiagnosisAnswers} answers
 * @param {StoryBlueprint} blueprint
 * @returns {readonly ChapterData[]}
 */
export const buildPersonalizedChapters = (answers, blueprint) => {
  const playerName = answers.playerName.trim().length > 0 ? answers.playerName.trim() : '蓮';
  const scene = TRIGGER_SCENE_OPTIONS[answers.triggerScene];
  const routeId = blueprint.routeId;

  // =========================================================================
  // ルートA：IBS当事者深掘り救済ルート（登場人物A視点）
  // =========================================================================
  if (routeId === 'route_a_healing') {
    return Object.freeze([
      Object.freeze({
        chapterNumber: 1,
        partLabel: '第一幕：仮面の昼休み',
        title: '陽だまりの執行猶予と、ポケットの薬',
        moodTheme: 'warm',
        locationLabel: '校舎の中庭ベンチ・昼休み',
        baseBpm: 76,
        silenceLevel: 25,
        gazeEyesCount: 2,
        soundPreset: 'calm',
        paragraphs: Object.freeze([
          `昼休みのチャイムが鳴ると、私（朝霧陽菜）はお弁当箱を抱えて別クラスの親友・${playerName}のもとへ向かう。玉子焼きを交換して他愛もない話で笑い合うこの時間だけが、私にとって唯一「普通の高校生」でいられる時間だった。`,
          `「陽菜、今日のお茶も温かいやつなんだね」「うん、こっちの方が落ち着くんだ」——笑顔で答えながら、私はスカートの中のポケットで整腸剤と頓服薬のシートを強く握りしめていた。`,
          buildPart1ForeshadowParagraph(answers.fearFocus, routeId),
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'daily', routeId),
        promptQuestion: `予鈴のチャイムが近づく中、${playerName}が「午後もがんばろうね！」と無邪気に笑っています。あなたの胸の内は？`,
        choices: Object.freeze([
          Object.freeze({
            id: 'a1_smile',
            label: '「うん、また放課後ね！」と笑顔の仮面を崩さずに手を振る',
            subtext: '大切な日常を壊したくなくて、迫りくる午後の恐怖をひとりで飲み込む',
            effect: Object.freeze({ empathyDelta: 2, assumptionDelta: 0, courageDelta: 1, trustDelta: 2, reactionKey: 'warm_hide' }),
          }),
          Object.freeze({
            id: 'a1_hint',
            label: '「午後は静かな時間があるから、実はちょっと怖いんだよね」と小さくこぼす',
            subtext: 'ほんの少しだけ、心の奥のSOSを言葉にしてみる',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 3, trustDelta: 3, reactionKey: 'small_open' }),
          }),
          Object.freeze({
            id: 'a1_breathe',
            label: 'ポケットのお守りの薬を確かめ、「私なら生き延びられる」と息を吐く',
            subtext: 'これから始まる静寂の密室に備えて、自分の呼吸を整える',
            effect: Object.freeze({ empathyDelta: 2, assumptionDelta: 0, courageDelta: 2, trustDelta: 2, reactionKey: 'self_calm' }),
          }),
        ]),
        freeInputPlaceholder: 'または、予鈴が鳴る前のあなたの本音や親友への一言を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 2,
        partLabel: '第二幕：静寂という名の檻',
        title: `${scene.placeName}の処刑台`,
        moodTheme: 'tense',
        locationLabel: scene.placeName,
        baseBpm: 138,
        silenceLevel: 94,
        gazeEyesCount: 14,
        soundPreset: 'clock_panic',
        paragraphs: buildPart2CrisisParagraphs(
          answers.triggerScene,
          answers.fearFocus,
          playerName,
          routeId
        ),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'crisis', routeId),
        promptQuestion: '時計の秒針と腹痛の波が迫り、暗闇から無数の視線を感じる中、あなたはどうやって自分を守りますか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'a2_sign',
            label: '先生と事前に決めた「無言の合図」を使い、限界が来る前に静かに扉を出る',
            subtext: 'かつての涙の末に手に入れた「自分を守るルール」を行使する',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 3, trustDelta: 3, reactionKey: 'use_accommodation' }),
          }),
          Object.freeze({
            id: 'a2_grounding',
            label: '「いつ出てもいい退路がある」と自分に言い聞かせ、4秒吸って8秒吐く呼吸に集中する',
            subtext: 'パニックの暴走を食い止め、静寂の圧力をやり過ごす',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 2, trustDelta: 2, reactionKey: 'mindful_breathe' }),
          }),
          Object.freeze({
            id: 'a2_recall_pain',
            label: '「これは私の弱さじゃない、IBSという疾患なんだ」と心の中で自分を強く肯定する',
            subtext: '自分を責める呪いの声を打ち消し、痛みを抱える自分に寄り添う',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 2, trustDelta: 3, reactionKey: 'self_compassion' }),
          }),
        ]),
        freeInputPlaceholder: 'または、密室の静寂の中であなたが必死に唱えている心の言葉を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 3,
        partLabel: '第三幕：暗い部屋の記憶',
        title: '「気のせいじゃない、本当に苦しいの！」',
        moodTheme: 'emotional',
        locationLabel: '回想・深夜の自室と母の前',
        baseBpm: 112,
        silenceLevel: 70,
        gazeEyesCount: 6,
        soundPreset: 'sorrow',
        paragraphs: Object.freeze([
          '今でこそ先生に配慮してもらえている私だが、ここに至るまでには絶望の淵を彷徨うような日々があった。一番苦しかったのは、一番助けてほしかった母親に何度話しても「またお腹痛いの？ 考えすぎでしょ」「気合いでなんとかなるわよ」と突き放されたことだった。',
          '「私の苦しみは、誰にも見えないんだ」——暗い部屋の布団の中で声を殺して泣き続け、明日が来るのが怖くて震えていたある夜。私はついに限界を迎え、母の前で過呼吸になりながら涙をボロボロこぼして叫んだ。',
          '「サボりたいんじゃない！ 静かな場所でお腹が痛くなったり鳴ったりするのが本当に怖いの、毎日死ぬほど苦しいの……！」——私の悲痛な叫びに、母は初めて凍りついたように目を見開き、私を抱きしめて謝ってくれた。そこから病院でのIBS診断と、担任・養護教諭との配慮対策が始まったのだ。',
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'aftermath', routeId),
        promptQuestion: '暗闇の中で誰にも理解されずに泣いていた過去の自分に、今のあなたならどんな言葉をかけますか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'a3_not_fault',
            label: '「あなたが弱いせいじゃなかったよ。あの夜、諦めずに泣いて叫んでくれてありがとう」',
            subtext: '過去の自分の孤独と勇気を抱きしめ、傷を癒やす',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 3, reactionKey: 'affirm_past' }),
          }),
          Object.freeze({
            id: 'a3_thank_mom',
            label: '「本気で伝えたからこそ、お母さんも先生も『味方』に変わってくれたんだよ」',
            subtext: '理解を得るまでの苦闘が無駄ではなかったと確信する',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 4, trustDelta: 3, reactionKey: 'value_courage' }),
          }),
          Object.freeze({
            id: 'a3_pass_baton',
            label: '「あの地獄を知っている私だからこそ、同じ暗闇に落ちた誰かを絶対に救える」',
            subtext: '自分の痛みを、他者を照らす灯火へと変える決意をする',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 4, reactionKey: 'become_light' }),
          }),
        ]),
        freeInputPlaceholder: 'または、過去の自分や家族に対して伝えたい言葉を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 4,
        partLabel: '第四幕：暗闇を裂く「私も。」',
        title: '同じ悪夢に震える親友の手',
        moodTheme: 'emotional',
        locationLabel: '夕暮れの階段踊り場',
        baseBpm: 92,
        silenceLevel: 50,
        gazeEyesCount: 3,
        soundPreset: 'sorrow',
        paragraphs: Object.freeze([
          `そんなある日、いつも明るかった親友の${playerName}（B）が、ここ数週間、まるで何かに怯えるように青ざめていることに私は気づいた。チャイムが鳴るたびにビクッと肩を震わせるその姿は、かつて静寂の恐怖に蝕まれていた私自身の姿そのものだった。`,
          `放課後の薄暗い階段の踊り場で、${playerName}は床を睨みつけ、消え入りそうな声で告白した。「最近さ、授業とか静かで人がいっぱいのとこで緊張してお腹が痛くなっちゃって、全然集中できないんだよね……」`,
          `きっと「気にしすぎ」と笑われると思って震えている${playerName}。私は一歩踏み出し、その冷たい手を握って告げた。「——私も。」弾かれたように顔を上げた${playerName}に、私は自分がIBSと戦ってきたこと、そして先生と決めた「教室を生き延びるための対策」のすべてを打ち明けた。`,
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'confession', routeId),
        promptQuestion: `暗闇の中で初めて理解者に出会い、涙を浮かべている${playerName}にどんな言葉をかけますか？`,
        choices: Object.freeze([
          Object.freeze({
            id: 'a4_together',
            label: '「ひとりでずっと怖かったよね。でも、もうあの静寂の中でひとりにはさせないから」',
            subtext: 'かつて自分が一番欲しかった救いの言葉を、親友に手渡す',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 4, reactionKey: 'deep_empathy' }),
          }),
          Object.freeze({
            id: 'a4_practical',
            label: '「明日、一緒に保健室の先生のところへ行こう。私が隣で一緒に説明するから大丈夫だよ」',
            subtext: '恐怖の密室を書き換えるための具体的な退路を一緒に作る',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 4, trustDelta: 4, reactionKey: 'practical_ally' }),
          }),
          Object.freeze({
            id: 'a4_thank_you',
            label: '「打ち明けてくれてありがとう。私もね、あなたに『私も』って言えて、今すごく救われたんだよ」',
            subtext: '支えることで、自分自身の長年の孤独もまた救済されたことを伝える',
            effect: Object.freeze({ empathyDelta: 5, assumptionDelta: 0, courageDelta: 3, trustDelta: 5, reactionKey: 'mutual_salvation' }),
          }),
        ]),
        freeInputPlaceholder: 'または、震える親友にかけるあなた自身の言葉を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 5,
        partLabel: '最終幕：呪いが解ける朝',
        title: '静寂の檻から、ふたりの呼吸へ',
        moodTheme: 'hope',
        locationLabel: '夜明けの光が差す教室・昇降口',
        baseBpm: 68,
        silenceLevel: 15,
        gazeEyesCount: 0,
        soundPreset: 'dawn',
        paragraphs: Object.freeze([
          `あの日から、私と${playerName}の間には暗闇を祓う「作戦」が生まれた。親に本音を伝えるための手紙の下書き、養護教諭と担任を交えた配慮の共有、そして5限目の前に送り合う『いつでも出ていい、私がいるよ』という合図。`,
          'もちろん、お腹の痛みや不安が魔法のようにゼロになるわけではない。けれど、かつて「音を立てたら終わりの処刑場」に見えていた教室には今、確かな退路と、痛みを完全に分かり合える同志がいる。',
          `朝の光が差し込む昇降口で${playerName}と目が合い、小さく頷き合う。私たちが流した涙は、誰かを救い、自分自身を生かす力へと変わったのだ。`,
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'resolution', routeId),
        promptQuestion: '長い夜を越えた今、あなたはどんな未来を選び取りますか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'a5_true_hope',
            label: '痛みを抱える自分自身を誇りに思い、ふたりで「静寂を恐れない場所」を広げていく',
            subtext: '過去の傷の完全な肯定と、連帯による救済トゥルーエンドへ',
            effect: Object.freeze({ empathyDelta: 5, assumptionDelta: 0, courageDelta: 4, trustDelta: 5, reactionKey: 'healing_true' }),
          }),
          Object.freeze({
            id: 'a5_gentle_pace',
            label: 'もう二度と「普通」の仮面に縛られず、自分の心と身体のペースを最優先に歩いていく',
            subtext: '自分を優しく守り抜くセルフケア救済エンドへ',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 2, trustDelta: 4, reactionKey: 'healing_gentle' }),
          }),
        ]),
        freeInputPlaceholder: 'または、生還したあなた自身へのメッセージを自由に入力...',
      }),
    ]);
  }

  // =========================================================================
  // ルートV2：クラスメイトルート（Scenario Version.2 ベース・ホラー演出強化）
  // =========================================================================
  if (routeId === 'route_v2_classmate') {
    return Object.freeze([
      Object.freeze({
        chapterNumber: 1,
        partLabel: '第一幕：あの子、また？',
        title: '静寂の教室で開く後ろの扉',
        moodTheme: 'neutral',
        locationLabel: '2年B組の教室・監視の空間',
        baseBpm: 74,
        silenceLevel: 60,
        gazeEyesCount: 6,
        soundPreset: 'calm',
        paragraphs: Object.freeze([
          `同じクラスの朝霧陽菜（A）とは、ほとんど話したことがなかった。そんな私（${playerName}・B）が彼女を意識するようになったのは、静まり返った授業中や試験中に、彼女が何度も席を立つ不自然な姿に気づいてからだった。`,
          '張り詰めた空気の中、出入口に一番近い後ろの席から、朝霧さんが亡霊のようにそっと立ち上がり、扉を開けて消えていく。今週だけでもう三度目だ。',
          buildPart1ForeshadowParagraph(answers.fearFocus, routeId),
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'daily', routeId),
        promptQuestion: '隣の席の生徒が「またトイレ？ テスト中なのにヤバくない？笑」と囁いてきました。どう反応しますか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c1_wonder',
            label: '「確かに最近多いよね、ちゃんと授業受けなくて大丈夫なのかな…」と呟く',
            subtext: '悪気はないつもりで、安全圏から彼女へ疑問の目を向ける',
            effect: Object.freeze({ empathyDelta: 1, assumptionDelta: 1, courageDelta: 0, trustDelta: 0, reactionKey: 'mild_doubt' }),
          }),
          Object.freeze({
            id: 'v2_c1_judge',
            label: '「正直、毎回抜けるのは周りに迷惑だよね。自己管理の問題でしょ」と冷たく笑う',
            subtext: '教室の冷酷な「監視の目」と完全に同化し、彼女を裁く側に回る',
            effect: Object.freeze({ empathyDelta: -2, assumptionDelta: 3, courageDelta: -1, trustDelta: -2, reactionKey: 'harsh_judge' }),
          }),
          Object.freeze({
            id: 'v2_c1_stop',
            label: '「何か言えない事情があるのかもしれないし、勝手に笑うのはやめなよ」と制止する',
            subtext: '事情は知らないが、集団で誰かを覗き見る不気味な空気に抵抗する',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: -1, courageDelta: 2, trustDelta: 2, reactionKey: 'fair_stance' }),
          }),
        ]),
        freeInputPlaceholder: 'または、席を立つ朝霧さんを見て感じたあなたの率直な言葉を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 2,
        partLabel: '第二幕：侵食する静寂（自分にも起こる）',
        title: `${scene.placeName}の金縛り`,
        moodTheme: 'tense',
        locationLabel: scene.placeName,
        baseBpm: 144,
        silenceLevel: 96,
        gazeEyesCount: 16,
        soundPreset: 'clock_panic',
        paragraphs: buildPart2CrisisParagraphs(
          answers.triggerScene,
          answers.fearFocus,
          playerName,
          routeId
        ),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'crisis', routeId),
        promptQuestion: '心拍数が跳ね上がり、教室の静寂が怪物のようにのしかかる中、あなたの脳裏をよぎるのは？',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c2_realize',
            label: '「外からは何も見えないのに、こんなに苦しいなんて……朝霧さんもずっとこの地獄にいたのか！？」',
            subtext: '自分が味わった密室の恐怖を通して、彼女の「扉」の意味に気づく',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 1, trustDelta: 2, reactionKey: 'connect_dots' }),
          }),
          Object.freeze({
            id: 'v2_c2_shame',
            label: '「動くな、声も音も出すな……今立ったら、教室中の『目』が私を嗤う……！」',
            subtext: 'かつて自分が他人に向けていた視線の刃が、自分の首元へ突きつけられる',
            effect: Object.freeze({ empathyDelta: 2, assumptionDelta: 0, courageDelta: 0, trustDelta: 1, reactionKey: 'mirror_gaze' }),
          }),
          Object.freeze({
            id: 'v2_c2_dismiss',
            label: '「こんなのただの一時的な腹痛だ！ 気合いでねじ伏せればいいだけだ！」',
            subtext: '恐怖を認めず、根性論で無理やり蓋をしようとする',
            effect: Object.freeze({ empathyDelta: -1, assumptionDelta: 2, courageDelta: 0, trustDelta: -1, reactionKey: 'force_endure' }),
          }),
        ]),
        freeInputPlaceholder: 'または、静寂の密室でパニックに襲われた瞬間の心の叫びを自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 3,
        partLabel: '第三幕：知らなかった事情',
        title: '薄暗い廊下の邂逅と「決めつけ」の罠',
        moodTheme: 'emotional',
        locationLabel: '放課後の薄暗い渡り廊下',
        baseBpm: 104,
        silenceLevel: 65,
        gazeEyesCount: 5,
        soundPreset: 'heartbeat_heavy',
        paragraphs: buildPart3EncounterParagraphs(
          answers.copingStyle,
          playerName,
          routeId
        ),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'aftermath', routeId),
        promptQuestion: '薄暗い廊下でこちらを見つめる朝霧さんに、あなたはどんな言葉をかけますか？（※生死・結末を分ける重要分岐）',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c3_listen_humbly',
            label: '「今日、自分も静かな場所でお腹が怖くなって……もし迷惑じゃなければ、朝霧さんの話を聞かせてもらえないかな」',
            subtext: '自分の経験だけで決めつけず、敬意を持って本人の声に耳を傾ける',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: -2, courageDelta: 3, trustDelta: 4, reactionKey: 'humble_ask' }),
          }),
          Object.freeze({
            id: 'v2_c3_assume_same',
            label: '「朝霧さんもお腹痛くなりやすいんでしょ？ 私も今日なったから全部わかるよ！ 気にしなきゃすぐ治るって！」',
            subtext: '【危険】一度の経験だけで「全部わかる」と決めつけ、呪いの言葉を投げかける',
            effect: Object.freeze({ empathyDelta: -3, assumptionDelta: 5, courageDelta: 1, trustDelta: -4, reactionKey: 'bad_assume' }),
          }),
          Object.freeze({
            id: 'v2_c3_apologize_first',
            label: '「今まで、何も知らないのに『また席を立ってる』って勝手な目で見ててごめん」と頭を下げる',
            subtext: '自分が「教室の監視者」の一人だった非を認め、誠実に向き合う',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: -2, courageDelta: 4, trustDelta: 4, reactionKey: 'sincere_apology' }),
          }),
          Object.freeze({
            id: 'v2_c3_walk_away',
            label: '関わるのが怖くなり、目を逸らして暗い廊下を足早に立ち去る',
            subtext: '対話から逃げ出し、再び無関心の闇へと戻る',
            effect: Object.freeze({ empathyDelta: -1, assumptionDelta: 1, courageDelta: -3, trustDelta: -2, reactionKey: 'avoid_contact' }),
          }),
        ]),
        freeInputPlaceholder: 'または、あなたの言葉で直接、朝霧さんに話しかけてみてください...',
      }),
      Object.freeze({
        chapterNumber: 4,
        partLabel: '第四幕：理解の始まり',
        title: '彼女がくぐり抜けてきた長い夜',
        moodTheme: 'emotional',
        locationLabel: '夕闇の特別教室前',
        baseBpm: 86,
        silenceLevel: 45,
        gazeEyesCount: 3,
        soundPreset: 'sorrow',
        paragraphs: buildPart4AnotherStoryParagraphs(answers.fearFocus, routeId),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'confession', routeId),
        promptQuestion: '朝霧さんが家族や周囲の無理解と戦ってきた壮絶な過去を聞き、あなたはどう応えますか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c4_respect',
            label: '「話してくれてありがとう。授業を諦めたくないからこそ、毎回あの扉を開けて戦っていたんだね」',
            subtext: '彼女の行動の意味を深く理解し、心からの敬意を伝える',
            effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -1, courageDelta: 3, trustDelta: 5, reactionKey: 'deep_respect' }),
          }),
          Object.freeze({
            id: 'v2_c4_ally',
            label: '「少なくとも私は、もう絶対に冷たい目で見ない。この教室の中に味方がいるって思ってほしい」',
            subtext: '教室という密室の中で、彼女の確かな味方になることを誓う',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: -1, courageDelta: 4, trustDelta: 4, reactionKey: 'promise_ally' }),
          }),
          Object.freeze({
            id: 'v2_c4_light_advice',
            label: '「大変だったんだね。でもあんまり病気のことばかり意識しすぎない方がいいよ！」',
            subtext: '【危険】無自覚に「気の持ちよう」という呪いを再び押しつけてしまう',
            effect: Object.freeze({ empathyDelta: -2, assumptionDelta: 4, courageDelta: 0, trustDelta: -3, reactionKey: 'toxic_positivity' }),
          }),
        ]),
        freeInputPlaceholder: 'または、朝霧さんの告白に対するあなたの言葉を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 5,
        partLabel: '最終幕：視線の牢獄を破るか、呑まれるか',
        title: '扉が開く音と、教室の審判',
        moodTheme: 'tense',
        locationLabel: '数日後の教室・静寂の自習時間',
        baseBpm: 118,
        silenceLevel: 82,
        gazeEyesCount: 10,
        soundPreset: 'heartbeat_heavy',
        paragraphs: Object.freeze([
          '数日後の自習時間。静まり返った教室で、朝霧さんがそっと席を立ち、後ろの扉から出ていった。',
          'その直後、斜め前の席の生徒がニヤニヤしながら周りに囁いた。「おい、あいつまたトイレかよ、サボり癖ヤバくね？笑」——教室の空気が歪み、無数の冷たい視線と嘲笑の渦が生まれようとしていた。',
          '今、あなたが試されている。あの不気味な「同調の群れ」に呑み込まれて目を伏せるか、それとも見えない痛みを抱える人の尊厳を守るために声を上げるか。',
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'resolution', routeId),
        promptQuestion: '教室に広がる嘲笑の空気の中で、あなたは最後の選択としてどう行動しますか？（※最終分岐）',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c5_speak_up',
            label: '「先生に相談して配慮してもらってるんだよ。事情も知らないのに裏で笑うのはやめなよ」とはっきり告げる',
            subtext: '教室の呪われた同調圧力を断ち切り、空気を変える一歩を踏み出す',
            effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -2, courageDelta: 5, trustDelta: 5, reactionKey: 'change_classroom' }),
          }),
          Object.freeze({
            id: 'v2_c5_warm_note',
            label: '朝霧さんが戻ってきた時、周囲の目を遮るように笑顔で「ここ進んだよ、ゆっくりで大丈夫！」と声をかける',
            subtext: '彼女が孤立しないよう、自分の隣を安全な居場所に変える',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: -1, courageDelta: 3, trustDelta: 4, reactionKey: 'warm_support' }),
          }),
          Object.freeze({
            id: 'v2_c5_silent_freeze',
            label: '自分が標的になるのが怖くなり、周囲の笑い声に合わせて曖昧に笑って目を伏せる',
            subtext: '【危険】恐怖に屈し、再び冷酷な「教室の目」の一部へと堕ちていく',
            effect: Object.freeze({ empathyDelta: -3, assumptionDelta: 2, courageDelta: -4, trustDelta: -4, reactionKey: 'silent_regret' }),
          }),
        ]),
        freeInputPlaceholder: 'または、このクライマックスであなたが取る行動や言葉を自由に入力...',
      }),
    ]);
  }

  // =========================================================================
  // ルートV1：親友ルート（Scenario Version.1 ベース・ホラー演出＆全5部完全補完）
  // =========================================================================
  return Object.freeze([
    Object.freeze({
      chapterNumber: 1,
      partLabel: '第一幕：当たり前の日常',
      title: 'ふたりの昼休みと、忍び寄る影',
      moodTheme: 'warm',
      locationLabel: '中庭を望む渡り廊下のベンチ・昼休み',
      baseBpm: 72,
      silenceLevel: 20,
      gazeEyesCount: 0,
      soundPreset: 'calm',
      paragraphs: Object.freeze([
        `朝霧陽菜（A）と私（${playerName}・B）は別クラスだが、昼休みはいつも一緒に過ごす仲良しだ。今日もごく普通にお弁当を食べ、他愛もない世間話をしながら陽菜との穏やかな昼休みを楽しんでいた。`,
        buildPart1ForeshadowParagraph(answers.fearFocus, routeId),
        '私は陽菜が時々体調を気にしていることを知っていたが、その裏にある深い苦悩までは何も知らなかった。予鈴のチャイムが鳴り、「じゃあまた放課後ね！」と手を振って別れた数分後、自分の日常が恐怖の底へ暗転するとも知らずに——。',
      ]),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'daily', routeId),
      promptQuestion: '昼休みの終わり、陽菜が「午後も無理しすぎないでね」と少し心配そうに微笑みました。どう返しますか？',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c1_cheerful',
          label: '「陽菜こそね！ 5限目眠くならないようにがんばるよ！」と無邪気に返す',
          subtext: 'まだ「静かな授業」が恐怖になり得るなんて微塵も疑っていない日常',
          effect: Object.freeze({ empathyDelta: 2, assumptionDelta: 0, courageDelta: 1, trustDelta: 2, reactionKey: 'normal_peace' }),
        }),
        Object.freeze({
          id: 'v1_c1_care_a',
          label: '「ありがとう。陽菜も今日、お腹の調子大丈夫そう？」と気遣う',
          subtext: '深い理由は知らなくても、大切な親友として声をかける',
          effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 1, trustDelta: 3, reactionKey: 'gentle_friend' }),
        }),
        Object.freeze({
          id: 'v1_c1_casual',
          label: '「5限目はシーンとしてるから退屈なんだよね〜」と軽く笑う',
          subtext: 'その「シーンとした静寂」が直後に牙を剥くことも知らずに笑う',
          effect: Object.freeze({ empathyDelta: 1, assumptionDelta: 1, courageDelta: 0, trustDelta: 1, reactionKey: 'unaware_casual' }),
        }),
      ]),
      freeInputPlaceholder: 'または、昼休みの陽菜との何気ない会話を自由に入力...',
    }),
    Object.freeze({
      chapterNumber: 2,
      partLabel: '第二幕：Bに起こる異変（密室の処刑）',
      title: '静寂に響いた音と、「あの子オナラしてたよね？笑」',
      moodTheme: 'tense',
      locationLabel: `${scene.placeName} 〜 逃げ込んだ個室トイレ`,
      baseBpm: 148,
      silenceLevel: 98,
      gazeEyesCount: 18,
      soundPreset: 'clock_panic',
      paragraphs: buildPart2CrisisParagraphs(
        answers.triggerScene,
        answers.fearFocus,
        playerName,
        routeId
      ),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'aftermath', routeId),
      promptQuestion: '「そうじゃないのに違うのに…！」個室トイレで泣き目になり、翌日から教室の静寂が恐怖の密室と化した数週間。あなたの心は？',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c2_fear_loop',
          label: '「またあの時みたいに音が鳴ったら…！」と考えるほどお腹が痛くなる悪循環に震える',
          subtext: '静かで人がたくさんいる場所そのものがトラウマになり、追い詰められていく',
          effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 0, trustDelta: 1, reactionKey: 'deep_trauma' }),
        }),
        Object.freeze({
          id: 'v1_c2_think_of_a',
          label: '「このままじゃ壊れちゃう……誰でもいいわけじゃない、陽菜になら話せるだろうか」とすがる',
          subtext: '孤独な悪夢の中で、唯一信頼できる親友・陽菜の顔を思い浮かべる',
          effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 2, trustDelta: 3, reactionKey: 'seek_hina' }),
        }),
        Object.freeze({
          id: 'v1_c2_hide_angry',
          label: '「誰にも絶対に言わない。周りは全員敵だ、ひとりで隠して耐えるしかない」と心を凍らせる',
          subtext: '嘲笑への恐怖から、他者への信頼を完全に閉ざしてしまう',
          effect: Object.freeze({ empathyDelta: -1, assumptionDelta: 2, courageDelta: -2, trustDelta: -2, reactionKey: 'shut_down' }),
        }),
      ]),
      freeInputPlaceholder: 'または、トイレの個室で震えながら抱えていたあなたの本音を自由に入力...',
    }),
    Object.freeze({
      chapterNumber: 3,
      partLabel: '第三幕：初めての理解者',
      title: '暗闇を切り裂いた「私も。」',
      moodTheme: 'emotional',
      locationLabel: '昼休みの薄暗い階段踊り場',
      baseBpm: 108,
      silenceLevel: 55,
      gazeEyesCount: 4,
      soundPreset: 'heartbeat_heavy',
      paragraphs: buildPart3EncounterParagraphs(
        answers.copingStyle,
        playerName,
        routeId
      ),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'confession', routeId),
      promptQuestion: '「気にしすぎ」とあしらわれる恐怖を覆した陽菜の「私も。」という告白に、あなたはどう応えますか？（※重要分岐）',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c3_tears_gratitude',
          label: '「陽菜もずっとこんな怖い思いをしてたなんて知らなかった……気づけなくてごめん、話してくれてありがとう」',
          subtext: '自分が救われた安堵とともに、陽菜がひとりで耐えてきた歳月に涙する',
          effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -1, courageDelta: 3, trustDelta: 5, reactionKey: 'mutual_tears' }),
        }),
        Object.freeze({
          id: 'v1_c3_ask_detail',
          label: '「『気にしすぎ』って言われると思ってたから、救われた……。先生にはどんな対策を相談したの？」',
          subtext: '暗闇から抜け出すための知恵を、初めての理解者である陽菜から真剣に学ぶ',
          effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 4, reactionKey: 'eager_learn' }),
        }),
        Object.freeze({
          id: 'v1_c3_compare_light',
          label: '「えっ、でも陽菜はいつも普通に笑ってるじゃん！ あんなふうにクラスで笑われた私の方が絶対つらいよ！」',
          subtext: '【危険】自分の傷ばかりを主張し、陽菜が笑顔の裏で流してきた血のにじむ努力を否定してしまう',
          effect: Object.freeze({ empathyDelta: -3, assumptionDelta: 4, courageDelta: 0, trustDelta: -4, reactionKey: 'deny_her_pain' }),
        }),
      ]),
      freeInputPlaceholder: 'または、陽菜の「私も。」を聞いた瞬間のあなたの言葉を自由に入力...',
    }),
    Object.freeze({
      chapterNumber: 4,
      partLabel: '第四幕：Aのアナザーストーリー',
      title: '支える彼女もまた、暗闇で泣いていた女の子だった',
      moodTheme: 'emotional',
      locationLabel: '陽菜の過去の記憶 〜 放課後のベンチ',
      baseBpm: 84,
      silenceLevel: 40,
      gazeEyesCount: 2,
      soundPreset: 'sorrow',
      paragraphs: buildPart4AnotherStoryParagraphs(answers.fearFocus, routeId),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'confession', routeId),
      promptQuestion: '母に理解されず泣き続け、それでも必死に訴えて道を切り開いた陽菜の過去を知り、あなたはどう伝えますか？',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c4_deep_bond',
          label: '「陽菜があの暗い夜を乗り越えてくれたから、今の私が救われたんだね。これからは私も陽菜を支えたい」',
          subtext: '陽菜の過去の孤独まで丸ごと受け止め、支え合う対等な絆を結ぶ',
          effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -1, courageDelta: 4, trustDelta: 5, reactionKey: 'reciprocal_bond' }),
        }),
        Object.freeze({
          id: 'v1_c4_courage_family',
          label: '「私も親や先生に言うのが怖かったけど、陽菜がくれた勇気でちゃんと伝えてみるよ」',
          subtext: '陽菜のアナザーストーリーを力に変え、密室から抜け出す現実の一歩を踏み出す',
          effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 4, trustDelta: 4, reactionKey: 'inherit_courage' }),
        }),
        Object.freeze({
          id: 'v1_c4_give_up',
          label: '「陽菜は強いからできたんだよ。私には無理だ、もう誰にも言わずに隠れて生きるよ…」',
          subtext: '【危険】陽菜が差し伸べてくれた手を振り払い、自ら再び暗闇の檻へ閉じこもる',
          effect: Object.freeze({ empathyDelta: -1, assumptionDelta: 2, courageDelta: -3, trustDelta: -2, reactionKey: 'fear_retreat' }),
        }),
      ]),
      freeInputPlaceholder: 'または、陽菜の過去を知ったあなたが彼女に伝えたい言葉を自由に入力...',
    }),
    Object.freeze({
      chapterNumber: 5,
      partLabel: '最終幕：支え合うということ',
      title: '静寂の悪夢を越えて、誰かの痛みに気づける人へ',
      moodTheme: 'hope',
      locationLabel: `保健室前 〜 ${scene.placeName}`,
      baseBpm: 72,
      silenceLevel: 20,
      gazeEyesCount: 0,
      soundPreset: 'dawn',
      paragraphs: Object.freeze([
        '陽菜は自分が助けられた経験を生かし、私と一緒に「相談先」や「学校でできる具体的な配慮対策」を一つずつ考えてくれた。私の症状が魔法のように今日すぐ消えるわけではないが、「ずっと一人でこの恐怖を抱え込まないといけない」と思っていた絶望の日々に、確かな光が生まれた。',
        `そして数週間後の${scene.placeName}。かつて私をパニックに陥れたあの静寂の中で、少し離れた席の生徒が真っ青な顔でお腹を押さえ、周囲の目を気にして震えているのが目に入った。`,
        '以前の私なら気づきもしなかった「見えない悲鳴」が、今の私には痛いほどわかる。陽菜に救われた私は今、試されている。',
      ]),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'resolution', routeId),
      promptQuestion: '物語の最終局面。陽菜と支え合って生還したあなたは、どんな未来へ踏み出しますか？',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c5_true_pass_on',
          label: '陽菜と支え合いながら、休み時間にその子へそっと声をかけ、今度は私が「誰かの見えない苦しさ」に寄り添う人になる',
          subtext: '恐怖の記憶を「誰かを救う優しさ」へと昇華させる真の生還トゥルーエンドへ',
          effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -1, courageDelta: 5, trustDelta: 5, reactionKey: 'chain_of_empathy' }),
        }),
        Object.freeze({
          id: 'v1_c5_happy_two',
          label: 'まずは陽菜と決めたお守りの合言葉を胸に、ふたりで一歩ずつ安心できる毎日を重ねていく',
          subtext: '親友との確かな絆で教室の恐怖を乗り越えるハッピーエンドへ',
          effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 4, reactionKey: 'warm_two_step' }),
        }),
        Object.freeze({
          id: 'v1_c5_still_afraid',
          label: 'まだ教室の目が怖くて動けないまま、自分の席で息を潜めてチャイムを待つ',
          subtext: '理解者は得たものの、恐怖の影から完全には抜け出せないビターエンドへ',
          effect: Object.freeze({ empathyDelta: 1, assumptionDelta: 1, courageDelta: -3, trustDelta: 0, reactionKey: 'hesitant_stop' }),
        }),
      ]),
      freeInputPlaceholder: 'または、物語の締めくくりとなるあなたの行動や陽菜への言葉を自由に入力...',
    }),
  ]);
};

/** @type {Readonly<Record<EndingId, EndingDefinition>>} */
export const ENDINGS = Object.freeze({
  healing_true: Object.freeze({
    id: 'healing_true',
    badge: '🌟 救済トゥルーエンド（当事者特別生還編）',
    title: '夜明けの教室、呪いが解ける呼吸',
    subtitle: 'あなたを苦しめた暗闇は、同じ痛みに震える誰かを救う光へと変わった',
    category: 'SALVATION TRUE END',
    isHorrorBadEnd: false,
    endingBpm: 64,
    paragraphs: Object.freeze([
      'かつては処刑場のように見えた静かな教室に、今は朝の澄んだ光が差し込んでいる。暗闇の中で無数に浮かんでいた「監視の目」は消え去り、いつでも外へ出られる先生との合図と、ポケットのお守りがあなたを守っている。',
      '母親に理解されずに泣いた夜も、静寂に怯えた時間も、何ひとつ無駄ではなかった。あなたが涙を流しながら自分の痛みに「IBS」という名前をつけ、生き延びてきたその軌跡そのものが、同じ悪夢に呑まれかけていた親友を救い出したのだ。',
      '痛みの波が完全にゼロになる日はまだ先かもしれない。それでも「痛くてもいい、席を立ってもいい、私は私のままでここにいていい」——そう心から思えた瞬間、教室の空気は驚くほど優しく、深く吸い込めるものに変わっていた。',
    ]),
    defaultLetterFromA:
      '今日まで、外からは誰にも見えない恐怖の密室の中で、本当によく生き延びてきましたね。「考えすぎ」「気合いの問題」という言葉の刃に傷ついた夜もあったと思います。でも、あなたの苦しみは紛れもない本物です。そして、あなたが暗闇の中で手探りで見つけた生き延びる知恵は、必ずあなた自身と、未来の誰かを救う光になります。もう二度と、自分を責めないでくださいね。——朝霧 陽菜より',
    reflectionNote: 'IBS当事者視点ルートにおける完全救済エンディングです。密室の恐怖からの生還と、自己肯定・相互理解のすべてに到達しました。',
  }),
  healing_gentle: Object.freeze({
    id: 'healing_gentle',
    badge: '🌅 救済セルフケアエンド（当事者特別編）',
    title: '仮面を脱いだ帰り道',
    subtitle: '「普通」という呪縛から降りて、自分の呼吸を取り戻した日',
    category: 'GENTLE HEALING END',
    isHorrorBadEnd: false,
    endingBpm: 68,
    paragraphs: Object.freeze([
      '放課後の夕焼けの中、親友と並んでゆっくりと駅への道を歩く。「今日は少しお腹が張るから、ベンチで休んでいこうかな」——そんな一言を、罪悪感なしに言える居場所がここにある。',
      'これまであなたは、周りの「普通」に合わせるために、引きつった笑顔の仮面を貼り付けて自分の身体の悲鳴を押し殺しすぎていた。でももう、自分を削ってまで密室に耐え続ける必要はない。',
      '苦しい時は立ち止まり、退路を使っていい。自分を縛っていた見えない鎖が外れたあなたの横顔は、夕陽の中でとても穏やかだった。',
    ]),
    defaultLetterFromA:
      '「みんなと同じように座っていなきゃ」って、ずっと自分を追い詰めてきませんでしたか？ 途中で扉を開けて出ることは、負けでも逃げでもありません。大切なあなた自身の心と身体を守るための、誇らしい選択です。これからはあなたのペースで呼吸していきましょう。——朝霧 陽菜より',
    reflectionNote: 'IBS当事者視点ルートにおける優しいセルフコンパッション（自己受容・生還）エンディングです。',
  }),
  true_bond: Object.freeze({
    id: 'true_bond',
    badge: '🌈 トゥルーエンド（完全生還）',
    title: '静寂を恐れない場所へ',
    subtitle: '支え合うふたりの勇気が、教室を支配していた「視線の呪い」を解き明かす',
    category: 'TRUE SURVIVAL END',
    isHorrorBadEnd: false,
    endingBpm: 66,
    paragraphs: Object.freeze([
      'あの5限目の悪夢をきっかけに初めて知った、陽菜（A）の長年の孤独な闘い。あなたは自分の浅い経験だけで「わかったつもり」になる罠を乗り越え、彼女の涙の過去に耳を傾け、先生や家族への相談という現実の退路を共に切り開いた。',
      'さらに、教室の中で無神経な嘲笑が起きたとき、あなたは同調圧力の恐怖に屈せず、見えない痛みを抱える人の尊厳を守るために声を上げた。',
      'その瞬間、教室の暗闇に浮かんでいた冷酷な「監視の目」は力を失った。痛みがすぐに消えるわけではなくても、支え合える理解者がいる教室はもはや密室ではない。そしてあなた自身も、誰かの静かなSOSに気づける人へと生まれ変わったのだ。',
    ]),
    defaultLetterFromA:
      '私の話を、決めつけずに最後まで聞いてくれて本当にありがとう。「私も。」って伝えたとき、あなたが顔を上げてくれた瞬間のことを私は一生忘れません。あの怖かった教室の静寂の中で、あなたが味方でいてくれることがどれほど心強いか、言葉では言い尽くせないほどです。これからも、ふたりで一緒に呼吸していこうね。——朝霧 陽菜より',
    reflectionNote: '最高の共感度・信頼度・行動力に到達したトゥルーエンディングです。密室の恐怖と教室の同調圧力の双方を打ち破りました。',
  }),
  happy_ally: Object.freeze({
    id: 'happy_ally',
    badge: '🕯️ ハッピーエンド（生還）',
    title: '秘密の退路と、お守りの合言葉',
    subtitle: 'ふたりだけのサインが、恐怖の時間を変えていく',
    category: 'HAPPY SURVIVAL END',
    isHorrorBadEnd: false,
    endingBpm: 70,
    paragraphs: Object.freeze([
      'トイレの個室でひとり震えていたあの日から数週間。今のあなたのポケットには、陽菜（A）と一緒に選んだ温かいお茶と、先生と共有した「いつでも退室できる合図」のお守りが入っている。',
      '「もし静かな授業中にまた波が来ても、放課後には陽菜に全部話せる」——その確信があるだけで、荒れ狂っていた心拍数は不思議と落ち着きを取り戻していった。',
      '昼休み、いつものベンチで交わす『今日も無理せずいこうね』という微笑み。ふたりの間には、どんな暗闇にも負けない絆が灯っていた。',
    ]),
    defaultLetterFromA:
      '勇気を出して私に打ち明けてくれて、本当にありがとう。ひとりでトイレで泣いていた時、どれほど怖かったかと思うと胸が締め付けられます。でも、もうあの暗闇の中にあなたはひとりじゃありません。苦しい時はいつでも合図してね。——朝霧 陽菜より',
    reflectionNote: '陽菜との深い信頼関係を築き、予期不安のループから生還したハッピーエンディングです。',
  }),
  ai_cocreation: Object.freeze({
    id: 'ai_cocreation',
    badge: '✨ AI共創スペシャルエンド',
    title: 'あなたの声が切り開いた夜明け',
    subtitle: '用意された選択肢を超え、あなた自身の言葉で悪夢を書き換えた結末',
    category: 'AI CO-CREATION END',
    isHorrorBadEnd: false,
    endingBpm: 65,
    paragraphs: Object.freeze([
      '定型のセリフではなく、あなた自身が暗闇の中で必死に紡ぎ出した言葉が、陽菜（A）の心の奥底に届いた。',
      '「そんなふうに言ってくれた人は、あなたが初めてだよ」——夕暮れの光の中で、陽菜はこれまで貼り付けていたどんな仮面とも違う、心からの安堵の涙を浮かべて微笑んだ。',
      '見えない痛みを完全に消し去ることはできなくても、自分の言葉で誰かと誠実に向き合うことで、恐怖の密室は確かな居場所へと変わる。あなたの言葉が、ふたりの新しい明日を創り出した。',
    ]),
    defaultLetterFromA:
      'あなたが自分の言葉で真っ直ぐに話しかけてくれたこと、本当に嬉しかったです。型通りの言葉じゃなく、あなた自身の心から出た声だったからこそ、私の長年の孤独がスッと溶けていきました。あなたと対話ができて本当によかったです。——朝霧 陽菜より',
    reflectionNote: 'AIとの自由入力対話を重ね、高い共感と信頼を獲得したプレイヤーだけが到達できる特別生還エンディングです。',
  }),
  bitter_distance: Object.freeze({
    id: 'bitter_distance',
    badge: '🌫️ ビターエンド（未脱出）',
    title: '開かない扉の前で',
    subtitle: '痛みを知りながらも、最後の一歩を踏み出せなかった教室',
    category: 'BITTER END : STAGNATION',
    isHorrorBadEnd: false,
    endingBpm: 105,
    paragraphs: Object.freeze([
      '陽菜（A）が抱えていたIBSの苦しみも、自分自身が味わった静寂の恐怖も、頭では痛いほどわかっていた。けれど、周囲の目を恐れるあまり、先生に相談したり教室の空気を変えたりする最後の一歩がどうしても踏み出せなかった。',
      'チャイムが鳴るたび、今でも心臓が速くなり、冷や汗をかきながら机の下で拳を握りしめる日々。遠くの席で陽菜が寂しそうにこちらを見ている気がしても、あなたは目を伏せることしかできない。',
      '「あの時、もう少しだけ勇気を出せていたら」——時計の秒針の音だけが、今日も静かな教室に冷たく響き続けている。',
    ]),
    defaultLetterFromA:
      '私の話を聞いてくれてありがとう。あなたが優しい人だということはわかっています。ただ、もしいつかまた、あの静かな教室で苦しんでいる誰かを見かけたときは、どうか目を逸らさずに小さな声をかけてあげてほしいなと思います。——朝霧 陽菜より',
    reflectionNote: '共感はあったものの、恐怖に足がすくんで行動を起こせなかったビターエンディングです。',
  }),
  bad_assumption: Object.freeze({
    id: 'bad_assumption',
    badge: '🩸 ホラーバッドエンド1（決めつけの断絶）',
    title: '「わかるよ」という名の呪詛',
    subtitle: '浅い経験で相手の地獄を測り、永遠の孤独へと墜ちた結末',
    category: 'HORROR BAD END : ASSUMPTION',
    isHorrorBadEnd: true,
    endingBpm: 162,
    paragraphs: Object.freeze([
      '「私もお腹痛くなったから全部わかるよ！ でも気合いで我慢すれば治るって、考えすぎだよ！」——あなたが放ったその無自覚な言葉が、陽菜（A）の心を完全に凍りつかせた。',
      '陽菜の瞳からハイライトが消え、能面のような笑顔で「……そっか。そうだね、さようなら」と呟いて暗い廊下の奥へと消えていった。それ以来、彼女があなたと目を合わせることは二度となかった。',
      'そして数日後。再び5限目の静まり返った教室で、あなた自身のお腹が激しい悲鳴を上げる。冷や汗が噴き出し、周囲から無数の目が突き刺さる中、今度はもう「私も。」と手を差し伸べてくれる人は世界のどこにもいなかった。時計の秒針と自分の荒い呼吸だけが、終わらない密室に響き渡る——。',
    ]),
    defaultLetterFromA:
      '【未送信のメモ】\n……一度似た経験をしただけで「全部わかる」「気にしなければ治る」と言われることが、何年も暗闇で泣いてきた人間にとってどれほど残酷な刃になるか、あなたにはきっと想像もつかなかったのだと思います。もう、私のことは放っておいてください。',
    reflectionNote: '自分の浅い経験だけで相手の深刻な苦しみを決めつけ、根性論を押しつけてしまった場合のホラーバッドエンディングです。',
  }),
  bad_conformity: Object.freeze({
    id: 'bad_conformity',
    badge: '💀 ホラーバッドエンド2（視線の牢獄）',
    title: '教室の標本、笑う無数の目',
    subtitle: '嘲笑の空気に同調し、あなた自身も「監視する怪物」の一部となった結末',
    category: 'HORROR BAD END : CONFORMITY',
    isHorrorBadEnd: true,
    endingBpm: 155,
    paragraphs: Object.freeze([
      '「あの子、またトイレ？」「さっきオナラしてたよね笑」——教室に渦巻く歪んだ笑い声の中で、あなたは自分が標的にされる恐怖から逃れるため、一緒になって嘲笑う道を選んだ。',
      '後ろの扉から出ていく陽菜（A）の背中を、教室中の生徒と一緒に冷たい目で見送る。自分の内側にあったはずの痛みも良心も、すべて黒く塗り潰して「普通」の群れに擬態した。',
      'だが、ふと窓ガラスに映った自分の顔を見た瞬間、背筋が凍りついた。そこに映っていたのは、人の痛みに気づく心を失い、誰かが少しでも乱れるのをギラギラした目で待ち構える「教室の監視者」そのものになったあなた自身の不気味な笑顔だった——。',
    ]),
    defaultLetterFromA:
      '【破り捨てられたノートの切れ端】\nあの教室で一番怖かったのは、お腹の痛みそのものよりも、事情も知らないまま一斉に向けられる「目」と「笑い声」でした。あなたも結局、あっち側の目になってしまうんですね。さようなら。',
    reflectionNote: '周囲の同調圧力や嘲笑に流され、対話と共感を放棄してしまった場合のホラーバッドエンディングです。',
  }),
});
