// @ts-check

/**
 * @typedef {'ibs_patient' | 'invisible_pain' | 'empathic_observer' | 'unaware_healthy'} ExperienceType
 * @typedef {'japanese_class' | 'silent_exam' | 'commuter_train' | 'school_assembly'} TriggerSceneType
 * @typedef {'sound_shame' | 'sudden_wave' | 'suspicion_gaze' | 'helpless_isolation'} FearFocusType
 * @typedef {'best_friend' | 'distant_classmate' | 'self_protagonist'} RelationshipType
 * @typedef {'endure_alone' | 'pretend_normal' | 'rationalize_judge' | 'seek_connection'} CopingStyleType
 * @typedef {'route_a_healing' | 'route_v1_bestfriend' | 'route_v2_classmate'} StoryRouteId
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
 * @property {readonly string[]} paragraphs
 * @property {string} defaultLetterFromA
 * @property {string} reflectionNote
 */

/** @type {Readonly<Record<ExperienceType, { readonly label: string; readonly description: string }>>} */
export const EXPERIENCE_OPTIONS = Object.freeze({
  ibs_patient: Object.freeze({
    label: 'お腹の不調（IBSなど）で深く悩んだ経験がある',
    description: '授業中や外出先でのお腹の痛み・音・トイレの不安を自分自身の経験として知っている',
  }),
  invisible_pain: Object.freeze({
    label: '周囲からは見えにくい体調不良や緊張を抱えたことがある',
    description: 'お腹に限らず、頭痛・めまい・息苦しさなど「外から見えないつらさ」を経験したことがある',
  }),
  empathic_observer: Object.freeze({
    label: '大きな体調の悩みはないが、周りの空気や視線を気にしやすい',
    description: '教室の雰囲気や友達のちょっとした変化に敏感で、気疲れすることがある',
  }),
  unaware_healthy: Object.freeze({
    label: '体調や緊張で困ったことはあまりなく、普段意識したことがない',
    description: '授業やテストも普通に受けられるのが当たり前で、他人の体調不良を深く考えたことはなかった',
  }),
});

/** @type {Readonly<Record<TriggerSceneType, { readonly label: string; readonly placeName: string; readonly ambiance: string }>>} */
export const TRIGGER_SCENE_OPTIONS = Object.freeze({
  japanese_class: Object.freeze({
    label: '5限目の静まり返った国語の授業',
    placeName: '5限目・現代文の教室',
    ambiance: '午後の日差しが差し込み、先生が教科書を朗読する声だけが静かな教室に響いている',
  }),
  silent_exam: Object.freeze({
    label: '時計の針の音だけが響く、途中退室しづらい試験中',
    placeName: '校内一斉模試の試験教室',
    ambiance: '問題用紙をめくる乾いた音と、秒針の音だけが張り詰めた空気を支配している',
  }),
  commuter_train: Object.freeze({
    label: '次の駅まで扉が開かない、朝の満員電車・通学バス',
    placeName: '朝の快速電車と1限目の教室',
    ambiance: 'ぎゅうぎゅう詰めの車内で身動きが取れず、次の停車駅まであと7分も扉が開かない',
  }),
  school_assembly: Object.freeze({
    label: '全校生徒が体育館に整列する、静かな全校集会',
    placeName: '体育館・全校集会の列の中央',
    ambiance: '何百人もの生徒が床に座り、校長先生のマイクの声だけが反響して誰も動けない',
  }),
});

/** @type {Readonly<Record<FearFocusType, { readonly label: string; readonly coreFear: string }>>} */
export const FEAR_FOCUS_OPTIONS = Object.freeze({
  sound_shame: Object.freeze({
    label: 'お腹の音やオナラだと誤解され、周りに笑われること',
    coreFear: '静寂の中でお腹が鳴り、「今のオナラじゃない？笑」と誤解されて噂になる羞恥と恐怖',
  }),
  sudden_wave: Object.freeze({
    label: '今すぐトイレに行きたいのに、席を立つ勇気が出ないこと',
    coreFear: '波のように押し寄せる腹痛と、全員の視線を浴びながら手を挙げて退室することへの恐怖',
  }),
  suspicion_gaze: Object.freeze({
    label: '何度も席を立つことで「また？」「サボり？」と思われること',
    coreFear: '扉を開けて出ていくたびに向けられる「あの子、またトイレ？」という無言の好奇と誤解の目',
  }),
  helpless_isolation: Object.freeze({
    label: '「気のせい」「考えすぎ」と誰にも本気にしてもらえないこと',
    coreFear: 'どれだけ深刻に苦しんでいても「気合いの問題でしょ」と片付けられてしまう絶望的な孤独',
  }),
});

/** @type {Readonly<Record<RelationshipType, { readonly label: string; readonly routeHint: string }>>} */
export const RELATIONSHIP_OPTIONS = Object.freeze({
  self_protagonist: Object.freeze({
    label: 'IBSを抱える高校生「陽菜（A）」本人として、自分の心と向き合いたい',
    routeHint: 'IBS当事者深掘りルート（A視点・救済ストーリー）',
  }),
  best_friend: Object.freeze({
    label: '別クラスだけど昼休みをいつも一緒に過ごす「一番の仲良し」として体験したい',
    routeHint: 'シナリオ Version.1 ベース（親友B視点・突然の異変と支え合い）',
  }),
  distant_classmate: Object.freeze({
    label: '同じクラスだけど、まだあまり話したことがない「クラスメイト」として体験したい',
    routeHint: 'シナリオ Version.2 ベース（クラスメイトB視点・疑問から理解へ）',
  }),
});

/** @type {Readonly<Record<CopingStyleType, { readonly label: string; readonly monologueTone: string }>>} */
export const COPING_STYLE_OPTIONS = Object.freeze({
  endure_alone: Object.freeze({
    label: '「迷惑をかけたくない」と一人で限界まで我慢してしまう',
    monologueTone: '誰にも気づかれたくない、自分さえ我慢すれば丸く収まるはずだと唇を噛みしめる',
  }),
  pretend_normal: Object.freeze({
    label: '平気なフリをして笑顔で隠し、あとで自分を責めてしまう',
    monologueTone: '「なんでもないよ」と作り笑いを浮かべながら、どうして普通にできないんだろうと胸の奥で泣いている',
  }),
  rationalize_judge: Object.freeze({
    label: '「どうしてこうなるんだろう」と理由や正論で考えすぎてしまう',
    monologueTone: '頭では冷静に考えようとするのに、身体が言うことを聞かない不条理さに焦りが募っていく',
  }),
  seek_connection: Object.freeze({
    label: '誰かにわかってほしいと願いながら、拒絶されるのが怖くて迷う',
    monologueTone: '本当は誰かに「助けて」と言いたいのに、笑われたり軽く流されたりするのが怖くて言葉を飲み込む',
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
 * 事前診断の恐怖焦点（fearFocus）に応じた第1部の伏線エピソードを生成する純粋関数
 * @param {FearFocusType} fearFocus
 * @param {StoryRouteId} routeId
 * @returns {string}
 */
const buildPart1ForeshadowParagraph = (fearFocus, routeId) => {
  if (routeId === 'route_v2_classmate') {
    switch (fearFocus) {
      case 'sound_shame':
        return '休み時間、近くの席の生徒たちが「さっきの静かな時間、誰かのお腹めっちゃ鳴ってなかった？笑」と冗談めかして笑っていた。その輪から少し離れた一番後ろの席で、朝霧さんが静かに筆箱を閉じて席を立つのが見えた。';
      case 'sudden_wave':
        return 'チャイムが鳴る直前、朝霧さんはいつも決まって担任の先生と短く目を合わせ、授業の途中でそっと後ろの扉から出ていく。「急にお腹でも痛くなるのかな、それともただのサボり？」——私は彼女の事情を知らないまま、ぼんやりとそんな疑問を抱いていた。';
      case 'suspicion_gaze':
        return '「ねえ、朝霧さんまたトイレ？」「テスト中や大事な授業中なのに、ちゃんと受けなくて大丈夫なのかな？」——クラスメイトたちの何気ないヒソヒソ話に、事情を知らない私も「確かに最近多いな」と心の中で同じ疑問を浮かべていた。';
      case 'helpless_isolation':
        return '「体調悪いなら保健室で寝てればいいのに、なんで中途半端に出てくるんだろうね」——誰かの無邪気で残酷な一言が教室に落ちる。外からは元気そうに見える彼女が、なぜ何度も席を立つのか、この時の私には想像すらできていなかった。';
    }
  }

  // V1 or A route
  switch (fearFocus) {
    case 'sound_shame':
      return 'お弁当を食べながら「午後の授業、先生が教科書を読んでる時ってシーンとしてて、お腹鳴りそうで緊張するんだよね」と何気なく笑ったとき、陽菜は一瞬だけ箸を止め、「……うん、静かすぎると落ち着かないよね」と少し寂しそうに微笑んだ。';
    case 'sudden_wave':
      return '購買で買った冷たいパック飲料を飲もうとした私を見て、陽菜は「私はお腹が冷えると午後がつらいから、いつも温かいお茶なんだ」と水筒を見せた。私は「陽菜はストイックだね」と笑うだけで、それが切実な防衛策だとは気づかなかった。';
    case 'suspicion_gaze':
      return '通りすがりの生徒が「うちのクラスの子、また授業中にトイレ行っててさ〜」と笑っているのが聞こえたとき、陽菜が小さく肩を揺らして下を向いたことに、私はまだ深い意味を見出せずにいた。';
    case 'helpless_isolation':
      return '「親に体調のことを言ってもさ、『気合いでなんとかなるでしょ』って流されると何も言えなくなるよね」——陽菜がふとこぼしたその言葉が、まさか彼女自身の涙の記憶から来ているとは、この時の私は知る由もなかった。';
  }
};

/**
 * 事前診断の舞台（triggerScene）と恐怖焦点（fearFocus）に応じた第2部のクライシス展開を生成する純粋関数
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
        ? '朝の快速電車。ぎゅうぎゅう詰めの車内で次の駅まであと7分も扉が開かないという閉塞感が、私（陽菜）のお腹に鋭い痛みの波を引き起こした。学校に着いてからも、その緊張の糸は張り詰めたままだった。'
        : triggerScene === 'school_assembly'
          ? '体育館での全校集会。何百人もの生徒が整列して床に座り、校長先生の声だけが反響する逃げ場のない空間で、私（陽菜）のお腹がギュルッと不穏に収縮し始めた。'
          : `${scene.placeName}。${scene.ambiance}。その逃げ場のない静けさが、私（陽菜）にとっては一番の引き金だった。`;

    const fearDesc =
      fearFocus === 'sound_shame'
        ? '「今ここでお腹の中でオナラのような音が鳴ってしまったら、周りの人に誤解されて笑われる」——そう意識すればするほどガスが溜まり、冷や汗が背中を伝う。'
        : fearFocus === 'suspicion_gaze'
          ? '先生には事前に伝えてあるから退室してもいいはずなのに、「またあの子出ていったよ」という周囲の視線を想像するだけで足がすくみそうになる。'
          : '外から見れば、みんなと同じように座っている普通の高校生にしか見えない。けれど内側では、1分1秒を生き延びるだけで精一杯の嵐が吹き荒れていた。';

    return Object.freeze([
      stageDesc,
      fearDesc,
      'かつて「IBS（過敏性腸症候群）」という名前を知る前、私はこの苦しみを自分の心が弱いせいだと思い込み、誰にも助けを求められずにひとりで唇を噛みしめていた。',
    ]);
  }

  if (routeId === 'route_v2_classmate') {
    const stageCrisis =
      triggerScene === 'commuter_train'
        ? `ある朝、満員電車の中で突然、私（${playerName}）の下腹部を雑巾で絞られるような痛みが襲った。次の駅まで扉は開かない。脂汗を流しながらなんとか登校したものの、静かな教室に入ってからもお腹の不穏な波は収まらなかった。`
        : triggerScene === 'school_assembly'
          ? `ある日の全校集会。体育館の列の真ん中で身動きが取れない中、突然私（${playerName}）のお腹に激しい痛みと張りが襲いかかった。周囲には何百人もの生徒が座っており、簡単に抜けることなどできない。`
          : `ある日の${scene.placeName}。${scene.ambiance}。そんな張り詰めた静寂の中で、私（${playerName}）は突然お腹の激しい不調に襲われた。最初はすぐ治ると思っていたのに、痛みと張りはどんどん強くなっていく。`;

    const fearRealization =
      fearFocus === 'sound_shame'
        ? '「もし今、お腹が鳴ってオナラだと思われたらどうしよう」——力を入れて我慢しようとすればするほどお腹の奥が不気味に鳴り、授業への集中など完全に吹き飛んでしまった。'
        : '「今ここで手を挙げて席を立ったら、周りから『えっ、このタイミングで？』って見られる」——静かな空間でまた症状が出たらどうしようと考えるうちに、呼吸まで浅くなっていく。';

    return Object.freeze([
      stageCrisis,
      fearRealization,
      '外からは何も見えないのに、内側では冷や汗が止まらないほどの恐怖が渦巻いている。私はこの時初めて、これまで遠くから見ていた朝霧さんの「何度も席を立つ背中」の向こう側にあったかもしれない苦しさを、自分の身体を通して思い知った。',
    ]);
  }

  // route_v1_bestfriend（シナリオVersion.1ベース＋舞台・恐怖カスタマイズ）
  const v1StageOpening =
    triggerScene === 'commuter_train'
      ? `異変の始まりは朝の満員電車だった。扉が開かない車内で急にお腹が張り、冷や汗をかいたあの日以来、静かな場所が気になり始めていた。そして今日、昼休みが終わり5限目の授業が始まった直後、私（${playerName}）は自分の中の決定的な異変に気づいた。`
      : triggerScene === 'school_assembly'
        ? `昼休みが終わり、午後の静かな体育館集会（そして続く5限目の授業）が始まった。だが私（${playerName}）は自分の中の異変に気づく。お腹が痛い。オナラも出そうだ。誰も喋らない静まり返った空間で、もし今オナラをしてしまったら……と強烈な不安に駆られる。`
        : triggerScene === 'silent_exam'
          ? `昼休みが終わり、5限目の小テストと静かな朗読の時間になった。だが私（${playerName}）は自分の中の異変に気づく。お腹が痛い。オナラも出そうだ。ペンの音と先生の声だけが響く教室で今、オナラをしてしまったら……と不安に駆られる。`
          : `昼休みが終わり、5限目の国語の授業が始まった。だが私（${playerName}）は自分の中の異変に気づく。お腹が痛い。オナラも出そうだ。先生の教科書を読む声だけが響く静かな教室で今、オナラをしてしまったら……と不安に駆られる。`;

  const v1SoundAndRumors =
    fearFocus === 'sudden_wave'
      ? '必死に耐えようとしたが、我慢の限界でお腹の中で大きな音が鳴り、冷や汗が噴き出した。周りのクラスメイトがチラチラこちらを見ていることに気づく。（やばい、今のオナラだと思われたかな、違うのに…！）授業が終わるなり席を立った私の耳に、教室の奥から「さっきさ、あの子オナラしてたよね？笑」「顔真っ青でヤバかったよね笑」と話す声が飛び込んできた。'
      : 'しかし耐えることができず、外には出なかったものの、お腹の中でオナラのような音が大きく鳴ってしまった。それは周りにも聞こえていたようで、クラスメイトがチラチラこちらを見ていることに気がついた。（やばい今のオナラだと思われたかな、違うのに…）と心の中で呟き、誤解していないことを願った。だが授業が終わりトイレに行くため席を立った時、教室の奥から「さっきさ、あの子オナラしてたよね？笑」と数人が話しているのが耳に入った。';

  return Object.freeze([
    v1StageOpening,
    v1SoundAndRumors,
    '私は逃げるようにトイレに駆け込んだ。（そうじゃないのに、違うのに…！）トイレの中で泣き目になりながらそう思った。そのことが深いトラウマとなり、普段の授業が怖くなった。静かで周りにたくさん人がいると、「今お腹が痛くなったら、またあの時みたいなことが起きたら」と考えれば考えるほど症状は悪化し、そのようなことが頻繁に起きるようになってしまった。',
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
        ? '放課後、誰もいない廊下のベンチでお腹を押さえて休んでいた私は、同じように白湯のボトルを持って通りかかった朝霧陽菜（A）と目が合った。'
        : copingStyle === 'rationalize_judge'
          ? '放課後、スマホで「静かな場所 お腹 緊張」と検索していた私は、ふと顔を上げた先の廊下で朝霧陽菜（A）が一人で歩いているのを見かけた。'
          : '放課後の静かな渡り廊下で、私は偶然、朝霧陽菜（A）と二人きりになった。';

    return Object.freeze([
      approachContext,
      '私の頭には、以前彼女に対して抱いていた「またトイレ？」「授業ちゃんと受けなくて大丈夫なのかな」という疑問が、まったく別の意味を持ってよみがえっていた。「もしかして、朝霧さんもずっとこういう不安を抱えていたのかな」。',
      'けれど、ここで自分が一度経験しただけのことで「私も同じ、わかるよ」と決めつけてしまえば、彼女が抱えてきた本当の苦しさを見誤ってしまう。本人の口から直接聞いて初めてわかることがあるはずだ。',
    ]);
  }

  // route_v1_bestfriend
  const v1Opening =
    copingStyle === 'pretend_normal'
      ? '症状に苦しめられるようになって数週間。私は昼休みも平気なフリをして笑おうとしていたが、お弁当が喉を通らない私を見て、陽菜が「……ねえ、無理して笑ってない？」と静かに声をかけてくれた。私はついに我慢の糸が切れ、思い切って陽菜に相談してみることにした。'
      : copingStyle === 'endure_alone'
        ? '症状に苦しめられるようになって数週間。誰にも迷惑をかけまいと一人で限界まで抱え込んでいた私は、4限目のあと保健室の前で立ち尽くしていたところを陽菜に見つけられ、思い切って打ち明けてみることにした。'
        : '症状に苦しめられるようになって数週間が経った頃、限界を迎えていた私は、思い切って陽菜（A）に相談してみることにした。';

  return Object.freeze([
    v1Opening,
    '「最近さ、授業とか静かで人がいっぱいのとこで緊張してお腹が痛くなっちゃって、全然集中できないんだよね。」——そう告げて、私は目を下に落とした。きっとわかってもらえない。そんな子、自分も見たことないし、「気にしすぎじゃない？」ってあしらわれちゃうかも。そう思っていた。',
    'だが、返ってきたのは私の思っていたこととは全く逆の答えだった。「私も。」——陽菜はそう告げた。私は驚き、顔を上げて陽菜の顔を見た。陽菜の顔は、私の気持ちが痛いほどわかると言いたげな顔をしていた。そこで陽菜は、自分も同じように長年IBS（過敏性腸症候群）の症状に苦しんでいたこと、先生に相談してどんな対策を取っているのかも詳細に教えてくれたのだ。',
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
      ? '「私もね、最初は静かな教室でお腹が鳴るのが死ぬほど怖くて、朝ごはんも昼ごはんも抜いてフラフラになってたの。それでも家に帰ってお母さんに話すと『お腹が鳴るくらい誰でもあるでしょ、考えすぎ！』って笑われて、何度も一人で泣いたんだ」'
      : fearFocus === 'suspicion_gaze'
        ? '「私もね、授業中やテスト中に何度も席を立つのが申し訳なくて、『あの子サボってるんじゃない？』って見られるのが怖くてたまらなかった。お母さんに言っても最初は『気合いで我慢しなさい』って言われて、誰にも理解してもらえなかったの」'
        : '「最初はね、お母さんに何度話してもなかなか理解してもらえなかったの。『またお腹痛いの？ 神経質すぎるんじゃない？』って。一番わかってほしい家族に本気にしてもらえないのが一番苦しかった」';

  if (routeId === 'route_v2_classmate') {
    return Object.freeze([
      '朝霧さんは、自分がどうやって今の自分に至ることができたのかを静かに話してくれた。',
      specificStruggle,
      '「でもある日、泣きながら深刻に『サボりたいんじゃない、本当に毎日苦しいの！』って本気で伝えたら、ようやくお母さんもわかってくれて。病院でIBSって診断を受けて、担任の先生にも相談して『出入口近くの席』や『いつでも出られる配慮』をしてもらえるようになったの」——これまで知らなかった彼女の涙の歴史を知り、私は相手の事情を知らないまま判断することの危うさを深く噛みしめていた。',
    ]);
  }

  // route_v1_bestfriend
  return Object.freeze([
    '私の手を優しく握りながら、陽菜は自分がどうやって今の自分に至ることができたのか——彼女の「アナザーストーリー」を語ってくれた。',
    specificStruggle,
    '「でもある日、布団の中で泣きながら、本当に深刻に苦しんでいることをお母さんに全部ぶつけたの。そしたらようやく理解してもらえて、一緒に病院へ行って、学校の先生にも相談して配慮対策をしてもらえるようになったんだ」——今こうして私を支えてくれる陽菜もまた、かつては同じように『誰かに支えてほしかった女の子』だったのだと知り、私の胸は熱いものでいっぱいになった。',
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
          ? '（笑っていれば、誰も私が朝から頓服薬を握りしめていることなんて気づかない。それでいい、今は普通の高校生でいたいから）'
          : '（この穏やかな昼休みがずっと続けばいいのに。チャイムが鳴れば、またあの静寂との戦いが始まる）';
      case 'crisis':
        return copingStyle === 'endure_alone'
          ? '（お願い、静まって……。ここで音を立てたら、ここで席を立ったら、またみんなの視線が集まってしまう）'
          : '（どうして私のお腹は、一番静かにしていたい時に限って悲鳴をあげるんだろう。サボりたいわけじゃないのに）';
      case 'aftermath':
        return '（お母さんに何度言っても「気のせい」「考えすぎ」って返されたあの夜が一番苦しかった。一番わかってほしい人に届かないのが、こんなにも痛いなんて）';
      case 'confession':
        return '（震える声で打ち明けてくれた目の前の親友を見て、胸が熱くなった。私だけじゃなかった。私が歩いてきた痛みは、この子を守るためにあったのかもしれない）';
      case 'resolution':
        return '（痛みや不安が今日すべて消えるわけじゃない。でも、「私もだよ」と言い合える人がいるだけで、教室の空気はこんなにも呼吸しやすくなるんだ）';
    }
  }

  if (routeId === 'route_v2_classmate') {
    switch (phase) {
      case 'daily':
        return copingStyle === 'rationalize_judge'
          ? '（また朝霧さんが席を立った。試験中や大事な授業中なのに、正直ちゃんと受けなくて大丈夫なのかな……なんて、他人事みたいに思っていた）'
          : '（後ろの扉がそっと閉まる音。「またトイレ？」って誰かが小さく笑った。私は何も言わなかったけれど、心の中で同じ疑問を浮かべていた）';
      case 'crisis':
        return copingStyle === 'endure_alone'
          ? '（まさか自分のお腹がこんなことになるなんて。静まり返った空間で、冷や汗が止まらない。今席を立ったら、自分が「あの子、また？」って見られる側になる……！）'
          : '（時計の針の音が心臓の鼓動みたいにうるさい。外からは平気そうに見えるのに、内側では嵐が吹いている。これがあの子の毎日だったのかもしれない）';
      case 'aftermath':
        return '（一度お腹が痛くなったくらいで「全部わかった」気になっちゃいけない。私が勝手に「大変そう」「サボり？」って決めつけていたように、また決めつけてしまうから）';
      case 'confession':
        return '（本人の口から直接聞いて初めてわかった。家族に理解してもらうまでに流した涙も、先生と決めた退室の合図も、全部「授業を受けたい」からこその必死の工夫だったんだ）';
      case 'resolution':
        return '（相手の事情を知らないまま判断することの危うさを、私は今日やっと知った。次に扉が開く音がした時、私はもう前と同じ目では見ない）';
    }
  }

  // route_v1_bestfriend
  switch (phase) {
    case 'daily':
      return copingStyle === 'seek_connection'
        ? '（陽菜と一緒にお弁当を食べている時間が一番ホッとする。陽菜が時々体調を気にしているのは知っていたけれど、その裏にどんな苦悩があるかなんて、この時の私はまだ何も知らなかった）'
        : '（別クラスだけど、昼休みはいつも陽菜と一緒。当たり前に笑って、当たり前に5限目の教室へ戻る。そんな日常がずっと続くと思っていた）';
    case 'crisis':
      return copingStyle === 'endure_alone'
        ? '（やばい、今の音、オナラだと思われたかな……違うのに、お腹が鳴っただけなのに！ 頼むから誰もこっちを見ないで、誤解しないで……！）'
        : '（冷や汗で背中が張り付く。我慢しようと力を込めた瞬間、お腹の奥で大きな音が響いた。チラチラと向けられる視線が針みたいに刺さる）';
    case 'aftermath':
      return copingStyle === 'pretend_normal'
        ? '（「さっきさ、あの子オナラしてたよね？笑」……個室トイレの鍵を閉めた瞬間、涙がにじんだ。そうじゃないのに、違うのに！ その日から、静かな教室に座ること自体が怖くなった）'
        : '（またあの時みたいな音が鳴ったらどうしよう。静かで人がたくさんいる場所に行くたび、考えれば考えるほどお腹が痛くなる悪循環から抜け出せなくなった）';
    case 'confession':
      return '（きっと「気にしすぎじゃない？」ってあしらわれちゃうかも。そう思って目を伏せた私に、陽菜が真っ直ぐな瞳で返してくれた「私も。」の一言が、凍りついていた心を溶かした）';
    case 'resolution':
      return '（陽菜もかつては、誰かに支えてほしくて泣いていた女の子だったんだ。ひとりで抱え込まなくていいと思えた瞬間、怖かった教室の景色が少しだけ変わって見えた）';
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
      routeTitle: '特別編：私の痛みに名前がつくまで、そして明日へ',
      routeSubtitle: 'IBSを抱える高校生・朝霧陽菜（A）の視点で紡ぐ、孤独と救済の物語',
      playerRoleLabel: '朝霧 陽菜（A本人 / あなたの投影）',
      triggerSceneLabel: sceneInfo.label,
      fearFocusLabel: fearInfo.label,
      copingStyleLabel: copingInfo.label,
      diagnosisSummary:
        `あなたの診断結果から「見えない痛みを抱える当事者としての深い共感性」が検出されました。舞台を「${sceneInfo.placeName}」、心の焦点を「${fearInfo.label}」に合わせ、IBSを患う陽菜（A）自身が周囲の無理解を乗り越えて救われる専用ストーリーを構築しました。`,
      customPrologue:
        `「普通に見えること」が、時々こんなにも苦しい。${sceneInfo.placeName}の静けさが怖くて、誰にも言えない痛みを抱えてきたあなた（陽菜）が、理解者と出会い、自分自身の痛みを肯定できるようになるまでの物語です。`,
      isPatientRoute: true,
    });
  }

  if (routeId === 'route_v2_classmate') {
    return Object.freeze({
      routeId,
      routeTitle: 'Scenario Version.2：『「あの子、また？」の向こう側』',
      routeSubtitle: 'クラスメイトの視点から、無自覚な疑問が「真の理解」へと変わる物語',
      playerRoleLabel: `${name}（陽菜のクラスメイト・B）`,
      triggerSceneLabel: sceneInfo.label,
      fearFocusLabel: fearInfo.label,
      copingStyleLabel: copingInfo.label,
      diagnosisSummary:
        `あなたの診断結果に合わせて、発症舞台を「${sceneInfo.placeName}」、核心テーマを「${fearInfo.label}」、主人公の行動傾向を「${copingInfo.label}」に最適化したクラスメイト視点（Version.2）のストーリーを構築しました。`,
      customPrologue:
        `同じクラスの朝霧陽菜が、授業中や試験中に何度も席を立つ。「またトイレ？」「大丈夫なのかな？」——${name}が抱いていた何気ない疑問は、ある日『${sceneInfo.placeName}』で自分自身に起きた異変をきっかけに、大きく揺らぎ始める。`,
      isPatientRoute: false,
    });
  }

  return Object.freeze({
    routeId: 'route_v1_bestfriend',
    routeTitle: 'Scenario Version.1：『当たり前の日常と、ふたりの呼吸』',
    routeSubtitle: '親友の視点から、突然のトラウマと「私も。」という救いを描く全五部作',
    playerRoleLabel: `${name}（陽菜の親友・B）`,
    triggerSceneLabel: sceneInfo.label,
    fearFocusLabel: fearInfo.label,
    copingStyleLabel: copingInfo.label,
    diagnosisSummary:
      `あなたの診断結果に合わせて、クライシス場面を「${sceneInfo.placeName}」、最大の葛藤を「${fearInfo.label}」、心理描写を「${copingInfo.label}」に個別最適化した親友視点（Version.1）のストーリーを構築しました。`,
    customPrologue:
      `別クラスだけど昼休みはいつも一緒の親友・朝霧陽菜（A）。${name}（B）は陽菜が時々体調を気にしていることを知っていたが、その裏にある苦悩までは知らなかった。あの日、『${sceneInfo.placeName}』で突然の異変が自分を襲うまでは——。`,
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
        partLabel: '第一部：笑顔の下の緊張',
        title: '昼休みの陽だまりと、言えない秘密',
        moodTheme: 'warm',
        locationLabel: '校舎の中庭ベンチ・昼休み',
        paragraphs: Object.freeze([
          `昼休みのチャイムが鳴ると、私（朝霧陽菜）はお弁当箱を抱えて別クラスの親友・${playerName}のもとへ向かう。玉子焼きを交換して、昨日の動画や次の休みの話で笑い合うこの時間だけが、唯一心から息をつける瞬間だった。`,
          `「陽菜、今日のお茶も温かいやつなんだね」「うん、こっちの方が落ち着くんだ」——そんな何気ない会話の裏で、私は制服のポケットに入れた整腸剤と頓服薬のシートを指先で確かめていた。`,
          buildPart1ForeshadowParagraph(answers.fearFocus, routeId),
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'daily', routeId),
        promptQuestion: `${playerName}が「午後も授業がんばろうね！」と無邪気に笑っています。今のあなたの心境は？`,
        choices: Object.freeze([
          Object.freeze({
            id: 'a1_smile',
            label: '「うん、また放課後ね！」と笑顔で手を振る（本音は隠す）',
            subtext: '大切な日常を壊したくなくて、いつもの明るい自分を演じる',
            effect: Object.freeze({ empathyDelta: 2, assumptionDelta: 0, courageDelta: 1, trustDelta: 2, reactionKey: 'warm_hide' }),
          }),
          Object.freeze({
            id: 'a1_hint',
            label: '「午後は静かな時間があるから、ちょっと緊張するんだよね」と少しだけこぼす',
            subtext: '全部は言えなくても、ほんの少しだけ心の重荷を言葉にしてみる',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 3, trustDelta: 3, reactionKey: 'small_open' }),
          }),
          Object.freeze({
            id: 'a1_breathe',
            label: '深呼吸をして「私なら大丈夫」と自分に言い聞かせる',
            subtext: '午後の静寂に備えて、自分のペースを整えようとする',
            effect: Object.freeze({ empathyDelta: 2, assumptionDelta: 0, courageDelta: 2, trustDelta: 2, reactionKey: 'self_calm' }),
          }),
        ]),
        freeInputPlaceholder: 'または、昼休みのあなたが心の中で思っていることや、親友への一言を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 2,
        partLabel: '第二部：静寂という名の檻',
        title: `${scene.placeName}の孤独な闘い`,
        moodTheme: 'tense',
        locationLabel: scene.placeName,
        paragraphs: buildPart2CrisisParagraphs(
          answers.triggerScene,
          answers.fearFocus,
          playerName,
          routeId
        ),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'crisis', routeId),
        promptQuestion: '静寂の中で波のように不安が押し寄せてきたとき、あなたはどうやって自分を守りますか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'a2_sign',
            label: '先生と事前に決めた「無言の合図」を使って、無理せず一度席を立つ',
            subtext: '我慢して悪化させるより、自分を守るためのルールを使う',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 3, trustDelta: 3, reactionKey: 'use_accommodation' }),
          }),
          Object.freeze({
            id: 'a2_grounding',
            label: '「いつでも出ていい場所がある」と思い出し、ゆっくり息を吐く',
            subtext: 'お守りの薬と逃げ道があることを確認して、予期不安の波をやり過ごす',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 2, trustDelta: 2, reactionKey: 'mindful_breathe' }),
          }),
          Object.freeze({
            id: 'a2_recall_pain',
            label: '誰にも言えずに限界まで我慢していた頃の自分を思い出し、今の自分を労わる',
            subtext: '「サボりじゃない、私は精一杯戦っている」と自分を肯定する',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 2, trustDelta: 3, reactionKey: 'self_compassion' }),
          }),
        ]),
        freeInputPlaceholder: 'または、静かな空間でお腹の不安と向き合う時のあなたの気持ちを自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 3,
        partLabel: '第三部：母への涙と、理解への道のり',
        title: '「気のせいじゃない、本当に苦しいの」',
        moodTheme: 'emotional',
        locationLabel: '回想・自宅のダイニングと夜の自室',
        paragraphs: Object.freeze([
          '私が今のように対策を取れるようになるまでには、長くて暗いトンネルがあった。最初は母に何度話しても、「またお腹痛いの？ 考えすぎじゃない？」「若いんだから気合いでなんとかなるでしょ」と軽く流されてしまったのだ。',
          '家族にすらわかってもらえないなら、世界中の誰にもわかってもらえるはずがない——そう思って布団の中で声を殺して泣いていたある夜、翌朝への恐怖で過呼吸のようになりながら、私は初めて母の前でボロボロと涙をこぼして叫んだ。',
          '「学校に行きたくないんじゃない！ 静かな教室でお腹が痛くなったり鳴ったりするのが本当に怖いの、毎日死ぬほど苦しいの……！」——私のただならぬ涙を見て、母は初めてハッとした顔で私を抱きしめ、謝ってくれた。そして一緒に専門の外来へ行き、学校の担任と保健室の先生に「出入口付近の席への変更」と「無言での退室許可」をお願いしてくれたのだった。',
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'aftermath', routeId),
        promptQuestion: 'かつて理解されずに泣いていた頃の自分に、今のあなたならどんな言葉をかけてあげたいですか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'a3_not_fault',
            label: '「あなたが弱いせいじゃないよ。ちゃんと言葉にして泣いてよかったんだよ」',
            subtext: '我慢し続けていた過去の自分の痛みを、丸ごと肯定してあげる',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 3, reactionKey: 'affirm_past' }),
          }),
          Object.freeze({
            id: 'a3_thank_mom',
            label: '「諦めずに本気で伝えたから、お母さんも先生も味方になってくれたんだよ」',
            subtext: '理解してもらうまでに振り絞った勇気を誇りに思う',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 4, trustDelta: 3, reactionKey: 'value_courage' }),
          }),
          Object.freeze({
            id: 'a3_pass_baton',
            label: '「その苦しみを知っているからこそ、同じように苦しむ誰かの光になれるよ」',
            subtext: '自分の経験を、誰かを救う優しさへと繋げていく決意をする',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 4, reactionKey: 'become_light' }),
          }),
        ]),
        freeInputPlaceholder: 'または、過去の自分や家族に対して伝えたい言葉を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 4,
        partLabel: '第四部：親友の涙と「私も。」',
        title: '震える告白が繋いだふたりの心',
        moodTheme: 'emotional',
        locationLabel: '放課後の階段の踊り場',
        paragraphs: Object.freeze([
          `そんなある日、いつも明るかった親友の${playerName}が、ここ数週間目に見えて元気を失っていることに私は気づいていた。お弁当もほとんど手をつけず、チャイムが鳴るたびに怯えたような顔をする——その姿は、かつての私自身と痛いほど重なっていた。`,
          `そして今日、${playerName}は目を伏せ、消え入りそうな声で打ち明けてくれた。「最近さ、授業とか静かで人がいっぱいのとこで緊張してお腹が痛くなっちゃって、全然集中できないんだよね……変だよね、こんなの」`,
          `きっと「気にしすぎ」とあしらわれると思って震えている${playerName}に、私は迷わず、心の底からの言葉を告げた。「——私も。」顔を上げた${playerName}の瞳が大きく見開かれる。私は、自分が長年IBSに苦しんできたこと、お守りの薬のこと、先生にお願いしている配慮対策のことを、包み隠さずすべて伝えた。`,
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'confession', routeId),
        promptQuestion: `驚きと安堵で涙ぐんでいる${playerName}に、あなたはどんな言葉を添えますか？`,
        choices: Object.freeze([
          Object.freeze({
            id: 'a4_together',
            label: '「ひとりでずっと怖かったよね。でも、もう私がいるから絶対に大丈夫だよ」',
            subtext: 'かつて自分が一番欲しかった言葉を、今度は親友に手渡す',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 4, reactionKey: 'deep_empathy' }),
          }),
          Object.freeze({
            id: 'a4_practical',
            label: '「保健室の先生、すごく親身に聞いてくれるから、明日一緒に相談しに行こう」',
            subtext: '共感だけでなく、具体的に安心できる環境づくりを一緒に踏み出す',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 4, trustDelta: 4, reactionKey: 'practical_ally' }),
          }),
          Object.freeze({
            id: 'a4_thank_you',
            label: '「話してくれてありがとう。私にとっても、初めて同じ痛みを分かち合える人ができたよ」',
            subtext: '支えるだけでなく、自分自身も救われたことを素直に伝える',
            effect: Object.freeze({ empathyDelta: 5, assumptionDelta: 0, courageDelta: 3, trustDelta: 5, reactionKey: 'mutual_salvation' }),
          }),
        ]),
        freeInputPlaceholder: 'または、親友にかけるあなた自身の言葉を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 5,
        partLabel: '第五部：支え合うということ',
        title: 'ひとりじゃない教室の呼吸',
        moodTheme: 'hope',
        locationLabel: '夕暮れの昇降口・翌朝の校門',
        paragraphs: Object.freeze([
          `あの日から、私と${playerName}の間には小さな「作戦会議」が生まれた。授業前にお互いのLINEに送る『いつでも出ていいからね』というスタンプ。養護教諭の先生を交えて作った、無理をしないための配慮カード。`,
          'もちろん、魔法のように今日からすべての腹痛や不安が消えるわけではない。静かな時間が来れば、今でも少しお腹が張ることはある。',
          `けれど、「この学校の中に、自分の痛みを100%わかってくれる人がいる」——その事実が、私自身の心をも驚くほど軽くしてくれた。かつて布団の中で泣いていた私は、自分の痛みを通して大切な人を支え、そして自分自身も深く救われたのだ。`,
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'resolution', routeId),
        promptQuestion: '物語の結末に向けて、これからの自分自身と親友へどんな未来を願いますか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'a5_true_hope',
            label: '痛みを抱える自分も否定せず、ふたりで静寂を恐れない場所を広げていきたい',
            subtext: '自分自身の救済と、支え合う未来の両方を抱きしめる',
            effect: Object.freeze({ empathyDelta: 5, assumptionDelta: 0, courageDelta: 4, trustDelta: 5, reactionKey: 'healing_true' }),
          }),
          Object.freeze({
            id: 'a5_gentle_pace',
            label: '周りと比べず、調子がいい日も悪い日も「自分のペース」を一番に大切にしていきたい',
            subtext: '無理をしない優しい日々を選び取る',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 2, trustDelta: 4, reactionKey: 'healing_gentle' }),
          }),
        ]),
        freeInputPlaceholder: 'または、未来の自分に向けたメッセージを自由に入力...',
      }),
    ]);
  }

  // =========================================================================
  // ルートV2：クラスメイトルート（Scenario Version.2 ベース＋事前診断動的変化）
  // =========================================================================
  if (routeId === 'route_v2_classmate') {
    return Object.freeze([
      Object.freeze({
        chapterNumber: 1,
        partLabel: '第一部：あの子、また？',
        title: '静かな教室で開く後ろの扉',
        moodTheme: 'neutral',
        locationLabel: '2年B組の教室・授業中',
        paragraphs: Object.freeze([
          `同じクラスの朝霧陽菜（A）とは、挨拶を交わす程度でそこまで親しいわけではなかった。そんな私（${playerName}）が彼女のことを意識するようになったのは、授業中や試験中に、彼女が何度も席を立つことに気づいてからだった。`,
          '張り詰めた空気の中、出入口に近い一番後ろの席から、朝霧さんがそっと立ち上がり、後ろの扉を開けて出ていく。今週だけでもう三度目だった。',
          buildPart1ForeshadowParagraph(answers.fearFocus, routeId),
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'daily', routeId),
        promptQuestion: 'クラスメイトが「また席立ってたよね、大丈夫なのかな？」とあなたに同意を求めてきました。どう反応しますか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c1_wonder',
            label: '「確かに最近多いよね、どこか体調でも悪いのかな…」と曖昧に頷く',
            subtext: '悪気はないものの、事情を知らないまま疑問を抱く',
            effect: Object.freeze({ empathyDelta: 1, assumptionDelta: 1, courageDelta: 0, trustDelta: 0, reactionKey: 'mild_doubt' }),
          }),
          Object.freeze({
            id: 'v2_c1_judge',
            label: '「テスト中まで抜けるのは、ちょっと自己管理が足りないのかもね」と同調する',
            subtext: '周囲の空気に流されて、目に見える行動だけで判断してしまう',
            effect: Object.freeze({ empathyDelta: -2, assumptionDelta: 3, courageDelta: -1, trustDelta: -2, reactionKey: 'harsh_judge' }),
          }),
          Object.freeze({
            id: 'v2_c1_stop',
            label: '「本人にしかわからない事情があるのかもしれないし、そういう言い方はやめようよ」と返す',
            subtext: 'まだ事情は知らないが、一方的な噂話には違和感を覚える',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: -1, courageDelta: 2, trustDelta: 2, reactionKey: 'fair_stance' }),
          }),
        ]),
        freeInputPlaceholder: 'または、この時のあなたの率直な感想やクラスメイトへの返答を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 2,
        partLabel: '第二部：自分にも起こる',
        title: `${scene.placeName}を襲った見えない嵐`,
        moodTheme: 'tense',
        locationLabel: scene.placeName,
        paragraphs: buildPart2CrisisParagraphs(
          answers.triggerScene,
          answers.fearFocus,
          playerName,
          routeId
        ),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'crisis', routeId),
        promptQuestion: '静まり返った空間でお腹の不調と予期不安に襲われた今、あなたの頭をよぎるのはどんな思いですか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c2_realize',
            label: '「こんなに苦しいのに、周りからは何も見えないんだ……朝霧さんもこれだったの？」とハッとする',
            subtext: '自分の苦しさを通して、これまで疑問に思っていた彼女の姿が重なる',
            effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 1, trustDelta: 2, reactionKey: 'connect_dots' }),
          }),
          Object.freeze({
            id: 'v2_c2_shame',
            label: '「席を立ったら『あの子、また？』って思われる……絶対に動けない！」と必死に耐える',
            subtext: 'かつて自分が向けていた視線の冷たさが、そのまま自分に跳ね返ってくる',
            effect: Object.freeze({ empathyDelta: 2, assumptionDelta: 0, courageDelta: 0, trustDelta: 1, reactionKey: 'mirror_gaze' }),
          }),
          Object.freeze({
            id: 'v2_c2_dismiss',
            label: '「たまたま今日食べたものが悪かっただけだ、気合いで我慢すれば治る」と無理やり抑え込む',
            subtext: 'まだ一時的な体調不良だと考え、根性論で乗り切ろうとする',
            effect: Object.freeze({ empathyDelta: -1, assumptionDelta: 2, courageDelta: 0, trustDelta: -1, reactionKey: 'force_endure' }),
          }),
        ]),
        freeInputPlaceholder: 'または、静かな教室で不安に襲われた瞬間のあなたの心の声を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 3,
        partLabel: '第三部：知らなかった事情',
        title: '決めつけの罠と、対話への一歩',
        moodTheme: 'emotional',
        locationLabel: '放課後の廊下・階段の踊り場',
        paragraphs: buildPart3EncounterParagraphs(
          answers.copingStyle,
          playerName,
          routeId
        ),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'aftermath', routeId),
        promptQuestion: '少し驚いたようにこちらを見ている朝霧さんに、あなたはどんな言葉で話しかけますか？（※重要分岐）',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c3_listen_humbly',
            label: '「今日、自分も静かな場所でお腹が不安になって……もし迷惑じゃなければ、朝霧さんのこと、少し聞かせてもらってもいい？」',
            subtext: '分かった気にならず、敬意を持って本人の話に耳を傾けようとする',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: -2, courageDelta: 3, trustDelta: 4, reactionKey: 'humble_ask' }),
          }),
          Object.freeze({
            id: 'v2_c3_assume_same',
            label: '「朝霧さんもお腹痛くなりやすいんでしょ？ 私も今日なったから全部わかるよ！ 気にしなきゃ治るって！」',
            subtext: '自分の浅い経験だけで「同じだ」と決めつけ、安易な励ましをしてしまう',
            effect: Object.freeze({ empathyDelta: -3, assumptionDelta: 5, courageDelta: 1, trustDelta: -4, reactionKey: 'bad_assume' }),
          }),
          Object.freeze({
            id: 'v2_c3_apologize_first',
            label: '「今まで、何度も席を立つのを見て『どうしたんだろう』って勝手に思ってた。ごめんね」と正直に謝る',
            subtext: '自分の無知と偏見を素直に認め、誠実に向き合う',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: -2, courageDelta: 4, trustDelta: 4, reactionKey: 'sincere_apology' }),
          }),
          Object.freeze({
            id: 'v2_c3_walk_away',
            label: '結局なんて声をかければいいかわからず、目を逸らして通り過ぎる',
            subtext: '踏み込む勇気が出ないまま、距離を置いてしまう',
            effect: Object.freeze({ empathyDelta: -1, assumptionDelta: 1, courageDelta: -3, trustDelta: -2, reactionKey: 'avoid_contact' }),
          }),
        ]),
        freeInputPlaceholder: 'または、あなたの言葉で直接、朝霧さんに話しかけてみてください（AIが彼女の反応を生成します）...',
      }),
      Object.freeze({
        chapterNumber: 4,
        partLabel: '第四部：理解の始まり',
        title: '彼女がくぐり抜けてきた長い夜',
        moodTheme: 'emotional',
        locationLabel: '夕暮れの特別教室前ベンチ',
        paragraphs: buildPart4AnotherStoryParagraphs(answers.fearFocus, routeId),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'confession', routeId),
        promptQuestion: '朝霧さんのこれまでの孤独な戦いを聞いた今、あなたはどう応えますか？',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c4_respect',
            label: '「教えてくれてありがとう。授業を諦めたくないからこそ、毎回勇気を出して席を立っていたんだね」',
            subtext: '「サボり」どころか「授業を受けるための必死の努力」だったことに深く敬意を示す',
            effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -1, courageDelta: 3, trustDelta: 5, reactionKey: 'deep_respect' }),
          }),
          Object.freeze({
            id: 'v2_c4_ally',
            label: '「少なくとも私は、もう絶対に誤解しない。これからは教室の中に味方がいるって思ってほしい」',
            subtext: '彼女が安心して席を立てるよう、クラス内の理解者になることを約束する',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: -1, courageDelta: 4, trustDelta: 4, reactionKey: 'promise_ally' }),
          }),
          Object.freeze({
            id: 'v2_c4_light_advice',
            label: '「大変だったんだね。でもあんまり病気のことばかり意識しない方が絶対いいよ！」',
            subtext: '励まそうとして、結果的に「気の持ちよう」というプレッシャーを与えてしまう',
            effect: Object.freeze({ empathyDelta: -2, assumptionDelta: 4, courageDelta: 0, trustDelta: -3, reactionKey: 'toxic_positivity' }),
          }),
        ]),
        freeInputPlaceholder: 'または、朝霧さんの告白に対するあなたの言葉を自由に入力...',
      }),
      Object.freeze({
        chapterNumber: 5,
        partLabel: '第五部：教室の空気を変える一歩',
        title: '扉が開く音に込めるまなざし',
        moodTheme: 'hope',
        locationLabel: '数日後の教室・静かな自習時間',
        paragraphs: Object.freeze([
          '数日後の自習時間。静まり返った教室で、朝霧さんがそっと席を立ち、後ろの扉から出ていった。',
          'すると、私の斜め前の席の男子が小声で「おい、あいつまたトイレかよ、余裕だな笑」と周りの生徒に笑いかけた。以前の私なら、聞こえないフリをして下を向いていた場面だ。',
          'けれど今の私は知っている。あの扉の向こう側にある苦しみも、自分の経験だけで他人を測ることの浅さも、そして「たった一人でも事情を知っている味方がいること」がどれほど救いになるかも。',
        ]),
        innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'resolution', routeId),
        promptQuestion: 'クラスメイトの心ない一言に対して、そして戻ってくる朝霧さんに対して、あなたはどう行動しますか？（※最終分岐）',
        choices: Object.freeze([
          Object.freeze({
            id: 'v2_c5_speak_up',
            label: '「先生にちゃんと伝えて配慮してもらってるんだよ。事情も知らないのに笑うのはおかしいよ」と静かに、でもはっきりと伝える',
            subtext: 'プライバシーは守りつつ、教室の無自覚な偏見を止める一歩を踏み出す',
            effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -2, courageDelta: 5, trustDelta: 5, reactionKey: 'change_classroom' }),
          }),
          Object.freeze({
            id: 'v2_c5_warm_note',
            label: '朝霧さんが戻ってきたとき、プリントと一緒に「今日の範囲ここだよ、焦らなくて大丈夫！」とメモを添えて微笑む',
            subtext: '彼女が教室に戻りやすい温かい空気を、自分の隣からつくる',
            effect: Object.freeze({ empathyDelta: 4, assumptionDelta: -1, courageDelta: 3, trustDelta: 4, reactionKey: 'warm_support' }),
          }),
          Object.freeze({
            id: 'v2_c5_silent_freeze',
            label: '周りの空気が怖くなり、結局何も言えずに目を伏せてしまう',
            subtext: '頭ではわかっていても、同調圧力の前で足がすくんでしまう',
            effect: Object.freeze({ empathyDelta: -2, assumptionDelta: 1, courageDelta: -4, trustDelta: -3, reactionKey: 'silent_regret' }),
          }),
        ]),
        freeInputPlaceholder: 'または、このクライマックスであなたが取る行動や言葉を自由に入力...',
      }),
    ]);
  }

  // =========================================================================
  // ルートV1：親友ルート（Scenario Version.1 ベース＋事前診断動的変化）
  // =========================================================================
  return Object.freeze([
    Object.freeze({
      chapterNumber: 1,
      partLabel: '第一部：当たり前の日常',
      title: 'ふたりの昼休みと、気づかなかった影',
      moodTheme: 'warm',
      locationLabel: '中庭を望む渡り廊下のベンチ・昼休み',
      paragraphs: Object.freeze([
        `朝霧陽菜（A）と私（${playerName}・B）は別クラスだが、昼休みはいつも一緒に過ごす大の仲良しだ。お弁当箱を広げて、好きな音楽や昨日のドラマ、次のテストの愚痴まで、どんな他愛もない世間話でも陽菜と一緒なら楽しくて仕方がなかった。`,
        buildPart1ForeshadowParagraph(answers.fearFocus, routeId),
        '私は陽菜が時々体調を気にしていることを知っていたが、その裏にある本当の苦悩までは何も知らなかった。今日もごく普通にお弁当を食べ、陽菜との昼休みを楽しむ。まさかこの直後、自分の日常が一変するとも知らずに。',
      ]),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'daily', routeId),
      promptQuestion: '昼休みの終わり、陽菜が「午後も無理しすぎないでね」と優しく声をかけてくれました。どう返しますか？',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c1_cheerful',
          label: '「陽菜こそね！ 5限目眠くならないようにがんばるよ！」と元気に返す',
          subtext: '何の屈託もない、いつもの楽しい昼休みのひととき',
          effect: Object.freeze({ empathyDelta: 2, assumptionDelta: 0, courageDelta: 1, trustDelta: 2, reactionKey: 'normal_peace' }),
        }),
        Object.freeze({
          id: 'v1_c1_care_a',
          label: '「ありがとう。陽菜も今日、体調大丈夫そう？」と気遣う',
          subtext: '深い事情までは知らなくても、親友として自然に気にかける',
          effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 1, trustDelta: 3, reactionKey: 'gentle_friend' }),
        }),
        Object.freeze({
          id: 'v1_c1_casual',
          label: '「午後は静かだから退屈だよね〜」と軽く笑う',
          subtext: '静かな時間が誰かにとって恐怖になり得るなんて、まだ思いもしない',
          effect: Object.freeze({ empathyDelta: 1, assumptionDelta: 1, courageDelta: 0, trustDelta: 1, reactionKey: 'unaware_casual' }),
        }),
      ]),
      freeInputPlaceholder: 'または、昼休みの陽菜との何気ない会話を自由に入力...',
    }),
    Object.freeze({
      chapterNumber: 2,
      partLabel: '第二部：Bに起こる変化',
      title: '静寂に響いた音と、トイレでの涙',
      moodTheme: 'tense',
      locationLabel: `${scene.placeName} 〜 廊下の個室トイレ`,
      paragraphs: buildPart2CrisisParagraphs(
        answers.triggerScene,
        answers.fearFocus,
        playerName,
        routeId
      ),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'aftermath', routeId),
      promptQuestion: 'トラウマから教室の静寂が怖くなり、症状が悪化していく数週間。あなたはどんな思いで日々を過ごしていますか？',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c2_fear_loop',
          label: '「誰にも言えない、恥ずかしくて親にも先生にも相談できない…」と一人で抱え込む',
          subtext: '誤解される恐怖と恥ずかしさから、誰にも助けを求められず孤立していく',
          effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 0, trustDelta: 1, reactionKey: 'deep_trauma' }),
        }),
        Object.freeze({
          id: 'v1_c2_think_of_a',
          label: '「こんな苦しい思い、誰もわかってくれない…でも、陽菜なら聞いてくれるだろうか」と迷う',
          subtext: '絶望の中で、唯一信頼できる親友の顔が浮かぶ',
          effect: Object.freeze({ empathyDelta: 3, assumptionDelta: 0, courageDelta: 2, trustDelta: 3, reactionKey: 'seek_hina' }),
        }),
        Object.freeze({
          id: 'v1_c2_hide_angry',
          label: '「何でもないフリをしてやり過ごすしかない、弱みを見せたら終わりだ」と心を閉ざす',
          subtext: '傷つくことを恐れて、自分の殻に強く閉じこもってしまう',
          effect: Object.freeze({ empathyDelta: 0, assumptionDelta: 2, courageDelta: -2, trustDelta: -1, reactionKey: 'shut_down' }),
        }),
      ]),
      freeInputPlaceholder: 'または、トイレの中で泣きそうになりながら抱えていたあなたの本音を自由に入力...',
    }),
    Object.freeze({
      chapterNumber: 3,
      partLabel: '第三部：初めての理解者',
      title: '「私も。」——顔を上げた先のまなざし',
      moodTheme: 'emotional',
      locationLabel: '昼休みの階段踊り場',
      paragraphs: buildPart3EncounterParagraphs(
        answers.copingStyle,
        playerName,
        routeId
      ),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'confession', routeId),
      promptQuestion: '陽菜の「私も。」という言葉と、彼女が長年抱えていた秘密を聞いたあなたはどう言葉を返しますか？（※重要分岐）',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c3_tears_gratitude',
          label: '「陽菜もずっとそうだったなんて知らなかった……気づけなくてごめんね。話してくれて本当にありがとう」',
          subtext: '自分が救われた安堵とともに、陽菜が一人で戦ってきた日々へ思いを馳せる',
          effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -1, courageDelta: 3, trustDelta: 5, reactionKey: 'mutual_tears' }),
        }),
        Object.freeze({
          id: 'v1_c3_ask_detail',
          label: '「『気にしすぎ』って言われると思ってたから、涙が出そう……。先生にはどうやって伝えたの？」',
          subtext: '初めて理解者に出会えた喜びを伝え、陽菜の経験を真剣に聞こうとする',
          effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 4, reactionKey: 'eager_learn' }),
        }),
        Object.freeze({
          id: 'v1_c3_compare_light',
          label: '「えっ、でも陽菜はいつも普通に笑ってたじゃん！ 私の方が絶対に重症だよ！」',
          subtext: '自分の苦しさばかりに目が行き、陽菜が見せないようにしてきた努力を否定してしまう',
          effect: Object.freeze({ empathyDelta: -3, assumptionDelta: 4, courageDelta: 0, trustDelta: -3, reactionKey: 'deny_her_pain' }),
        }),
      ]),
      freeInputPlaceholder: 'または、陽菜の「私も。」を聞いた瞬間のあなたの言葉を自由に入力...',
    }),
    Object.freeze({
      chapterNumber: 4,
      partLabel: '第四部：Aのアナザーストーリー',
      title: '支える彼女もまた、支えてほしかった女の子だった',
      moodTheme: 'emotional',
      locationLabel: '陽菜の回想 〜 放課後のベンチ',
      paragraphs: buildPart4AnotherStoryParagraphs(answers.fearFocus, routeId),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'confession', routeId),
      promptQuestion: '陽菜が母に泣きながら訴えて道を切り開いた過去を知り、あなたは彼女にどんな思いを伝えますか？',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c4_deep_bond',
          label: '「陽菜がひとりでそんなに頑張ってきたから、今の私が救われたんだね。今度は私も陽菜の支えになりたい」',
          subtext: '支えられるだけでなく、陽菜の過去の孤独まで包み込むような対等な絆を結ぶ',
          effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -1, courageDelta: 4, trustDelta: 5, reactionKey: 'reciprocal_bond' }),
        }),
        Object.freeze({
          id: 'v1_c4_courage_family',
          label: '「私も親や先生に『気のせい』って思われるのが怖かったけど、陽菜みたいに本気で伝えてみるよ」',
          subtext: '陽菜のアナザーストーリーから勇気を受け取り、自分も行動を起こす決意をする',
          effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 4, trustDelta: 4, reactionKey: 'inherit_courage' }),
        }),
        Object.freeze({
          id: 'v1_c4_give_up',
          label: '「陽菜だからできたんだよ。私の親やクラスの先生にはどうせ無理だよ…」と諦めてしまう',
          subtext: 'せっかくの陽菜の言葉にも、恐怖が勝って一歩を踏み出せない',
          effect: Object.freeze({ empathyDelta: 0, assumptionDelta: 2, courageDelta: -3, trustDelta: -1, reactionKey: 'fear_retreat' }),
        }),
      ]),
      freeInputPlaceholder: 'または、陽菜の過去を知ったあなたが彼女に伝えたい言葉を自由に入力...',
    }),
    Object.freeze({
      chapterNumber: 5,
      partLabel: '第五部：支え合うということ',
      title: 'いつか誰かの苦しさに気づける人へ',
      moodTheme: 'hope',
      locationLabel: `保健室前 〜 ${scene.placeName}`,
      paragraphs: Object.freeze([
        '陽菜は自分が助けられた経験を生かし、私と一緒に「誰に・どう相談するか」「学校でどんな対策ができるか」を一つずつ考えてくれた。メモに自分の症状とつらさを書き出して親に見せる方法、保健室の先生を味方につける方法、そして授業前にふたりで交わす『大丈夫、ひとりじゃないよ』という合言葉。',
        `もちろん、私の症状が魔法のように今日すぐ消えるわけではない。${scene.placeName}の時間が来れば、まだ少し心臓が速くなることもある。けれど、「ずっと一人で抱え込まないといけないかもしれない」と怯えていた日々に、確かな光と変化が生まれていた。`,
        'そしてある日、同じクラスの別の生徒が、静かな授業中に青い顔でお腹を押さえて俯いているのが目に入った。かつての私なら気づきもしなかったその小さなサインに、今の私は気づくことができる。',
      ]),
      innerMonologue: buildPersonalizedMonologue(answers.copingStyle, 'resolution', routeId),
      promptQuestion: '物語の最終局面。陽菜に支えられて一歩を踏み出したあなたは、これからどんな自分でありたいですか？',
      choices: Object.freeze([
        Object.freeze({
          id: 'v1_c5_true_pass_on',
          label: '陽菜と支え合いながら、今度は私が「誰かの見えない苦しさ」に気づいて寄り添える人になっていく',
          subtext: '救われた経験を次の誰かへの優しさへと繋げるトゥルーエンドへ',
          effect: Object.freeze({ empathyDelta: 5, assumptionDelta: -1, courageDelta: 5, trustDelta: 5, reactionKey: 'chain_of_empathy' }),
        }),
        Object.freeze({
          id: 'v1_c5_happy_two',
          label: 'まずは陽菜とふたりのペースを守りながら、少しずつ教室で安心できる時間を増やしていく',
          subtext: 'ふたりの絆をお守りにして、着実に前を向くハッピーエンドへ',
          effect: Object.freeze({ empathyDelta: 4, assumptionDelta: 0, courageDelta: 3, trustDelta: 4, reactionKey: 'warm_two_step' }),
        }),
        Object.freeze({
          id: 'v1_c5_still_afraid',
          label: '陽菜には感謝しているけれど、やっぱり周りの目が怖くて誰にも相談できないまま立ち止まる',
          subtext: '理解者はできたものの、最後の一歩が踏み出せないほろ苦い結末へ',
          effect: Object.freeze({ empathyDelta: 1, assumptionDelta: 1, courageDelta: -3, trustDelta: 0, reactionKey: 'hesitant_stop' }),
        }),
      ]),
      freeInputPlaceholder: 'または、物語の締めくくりとなるあなたの決意や陽菜への言葉を自由に入力...',
    }),
  ]);
};

/** @type {Readonly<Record<EndingId, EndingDefinition>>} */
export const ENDINGS = Object.freeze({
  healing_true: Object.freeze({
    id: 'healing_true',
    badge: '🌟 救済トゥルーエンド（当事者特別編）',
    title: '夜明けの教室、ひとりじゃない呼吸',
    subtitle: 'あなたの痛みは本物で、あなたの歩んできた道が誰かの光になった',
    category: 'SALVATION TRUE END',
    paragraphs: Object.freeze([
      '静かな教室の窓から、柔らかい風がカーテンを揺らしている。かつては「檻」のように見えていたこの場所も、今は先生との合図があり、お守りの薬があり、そして別クラスには自分の痛みをすべて理解してくれる親友がいる。',
      '母親に理解されずに泣いた夜も、周囲の視線に傷ついた日も、何ひとつ無駄ではなかった。あなたが涙を流しながら自分の苦しみに名前をつけ、生き延びてきたその経験そのものが、同じ痛みに震えていた親友を救い出したのだ。',
      'お腹の波が完全にゼロになる日はまだ先かもしれない。それでも、「痛くてもいい、席を立ってもいい、私は私のままでここにいていい」——そう心から思えた瞬間、あなたの胸にはこれまでで一番深く、温かい呼吸が満ちていった。',
    ]),
    defaultLetterFromA:
      '今日まで、誰にも言えない痛みや不安を抱えながら、本当によく頑張って生きてきましたね。「考えすぎ」「気合いの問題」なんて言葉に傷ついた日もあったと思います。でも、あなたの苦しみは紛れもない本物です。そして、あなたが痛みを乗り越えようと試行錯誤した日々は、必ずあなた自身と、未来の誰かを守る優しい力になります。どうか今日からは、自分自身に一番優しい味方でいてあげてくださいね。——朝霧 陽菜より',
    reflectionNote: 'IBS当事者視点ルートにおける完全救済エンディングです。過去の傷の肯定と、親友との相互理解・環境調整の両立に到達しました。',
  }),
  healing_gentle: Object.freeze({
    id: 'healing_gentle',
    badge: '🌅 救済セルフケアエンド（当事者特別編）',
    title: '私のペースで歩く帰り道',
    subtitle: '無理に「普通」を演じなくていいと気づけた日',
    category: 'GENTLE HEALING END',
    paragraphs: Object.freeze([
      '放課後の夕焼けの中、親友と並んでゆっくりと駅への道を歩く。「今日は少しお腹が張るから、一駅手前で休憩しようかな」——そんな一言を、何の遠慮もなく言える関係がここにある。',
      'これまであなたは、周りの「普通」に合わせるために、自分の身体の悲鳴を押し殺しすぎていたのかもしれない。でももう、満点を目指して無理をする必要はない。',
      '調子がいい日は笑い、苦しい日は立ち止まって深呼吸する。自分を責めるのをやめたあなたの横顔は、夕陽に照らされてとても穏やかだった。',
    ]),
    defaultLetterFromA:
      '「みんなと同じようにできなきゃ」って、ずっと自分を追い詰めてきませんでしたか？ 立ち止まることも、途中で席を外すことも、逃げることじゃありません。大切な自分を守るための立派な選択です。あなたのペースで、ゆっくり歩いていきましょう。——朝霧 陽菜より',
    reflectionNote: 'IBS当事者視点ルートにおける優しいセルフコンパッション（自己受容）エンディングです。',
  }),
  true_bond: Object.freeze({
    id: 'true_bond',
    badge: '🌈 トゥルーエンド',
    title: '静寂を恐れない場所へ',
    subtitle: '支え合うふたりの勇気が、教室の空気を少しずつ変えていく',
    category: 'TRUE END',
    paragraphs: Object.freeze([
      '自分の苦しみをきっかけに初めて知った、陽菜（A）の長年の孤独と戦い。あなたは自分の浅い経験だけで「わかったつもり」になることなく、彼女自身の言葉に深く耳を傾け、先生や家族への相談という現実の一歩を共に踏み出した。',
      'それだけではない。教室の中で誰かが無自覚な偏見やからかいを口にしたとき、あなたは黙って見過ごすのではなく、見えない痛みを抱える人の尊厳を守るために行動した。',
      '痛みがすぐに消えるわけではなくても、「ここには事情を知り、味方でいてくれる人がいる」という安心感が、予期不安の悪循環を確実に解きほぐしていく。そしてあなた自身もまた、誰かの小さなSOSに気づける温かい人間へと成長したのだった。',
    ]),
    defaultLetterFromA:
      '私の話を、決めつけずに最後まで聞いてくれて本当にありがとう。「私も。」って伝えたとき、あなたが顔を上げてくれた瞬間のことを私は一生忘れません。あなたが私の過去の痛みまで受け止めて、一緒に前を向いてくれたから、私もひとりじゃないって心から思えました。これからも、お互いのペースで支え合っていこうね。——朝霧 陽菜より',
    reflectionNote: '最高の共感度・信頼度・行動力に到達したトゥルーエンディングです。相手の背景を決めつけずに聞き、支え合う関係と周囲への働きかけを実現しました。',
  }),
  happy_ally: Object.freeze({
    id: 'happy_ally',
    badge: '🌸 ハッピーエンド',
    title: 'お守りのような隣席',
    subtitle: 'ふたりだけの合言葉が、怖かった時間を変えていく',
    category: 'HAPPY END',
    paragraphs: Object.freeze([
      '一人でトイレで泣いていたあの日から数週間。今のあなたのポケットには、陽菜（A）と一緒に選んだ温かいハーブティーのボトルと、いつでも先生に合図できるという安心感が入っている。',
      '「もし授業中にまた苦しくなっても、放課後には陽菜に全部話せる」——そう思えるだけで、あれほど恐ろしかった教室の静寂が、少しずつ過ごしやすい場所へと変わっていった。',
      '昼休み、いつものベンチでお弁当を広げながら交わす「今日もぼちぼちいこうね」という笑顔。ふたりの間には、どんな言葉よりも強い信頼が結ばれていた。',
    ]),
    defaultLetterFromA:
      '勇気を出して私に相談してくれて、本当にありがとう。最初はひとりでどれほど怖かったかと思うと胸が痛みます。でも、これからはもう絶対にひとりじゃありません。しんどい時はいつでも合図してね。明日の昼休みも、いつもの場所で待っています！——朝霧 陽菜より',
    reflectionNote: '陽菜との深い信頼関係を築き、一人で抱え込む状態から抜け出したハッピーエンディングです。',
  }),
  ai_cocreation: Object.freeze({
    id: 'ai_cocreation',
    badge: '✨ AI共創スペシャルエンド',
    title: 'あなたの言葉が紡いだ新しい明日',
    subtitle: '定型の選択肢を超え、あなた自身の言葉で相手の心を動かした結末',
    category: 'AI CO-CREATION END',
    paragraphs: Object.freeze([
      '誰かが用意した正解のセリフではなく、あなた自身の言葉で迷いながら紡いだ対話が、陽菜（A）の心を深く動かした。',
      '「そんなふうに言ってくれた人は、あなたが初めてだよ」——放課後の教室で、陽菜は少し照れたように、でもこれまでで一番晴れやかな笑顔を見せた。',
      '見えない痛みを完全に消し去ることはできなくても、自分の言葉で誰かと向き合い、対話を重ねることで、世界はいくらでも優しい場所へと書き換えられる。あなたが紡いだ言葉は、ふたりの心に消えない灯火をともした。',
    ]),
    defaultLetterFromA:
      'あなたが自分の言葉で真っ直ぐに話しかけてくれたこと、本当に嬉しかったです。型通りの励ましじゃなく、あなた自身の心から出た言葉だったからこそ、私の奥深くまで届きました。あなたと出会えて、対話ができて本当によかったです。——朝霧 陽菜より',
    reflectionNote: 'AIとの自由入力対話を積極的に行い、高い共感と信頼を獲得したプレイヤーだけが到達できる特別エンディングです。',
  }),
  bitter_distance: Object.freeze({
    id: 'bitter_distance',
    badge: '🍃 ビターエンド',
    title: '優しい距離のまま',
    subtitle: '気持ちはわかっていても、最後の一歩が踏み出せなかった季節',
    category: 'BITTER END',
    paragraphs: Object.freeze([
      '陽菜（A）が抱えていたIBSの苦しみも、自分自身が経験した静かな教室での不安も、頭では痛いほどわかっていた。けれど、先生に相談したり、周囲の空気を変えたりする最後の一歩を踏み出す勇気が、どうしても出なかった。',
      '教室で誰かが心ない噂話をしていても、気まずそうに目を伏せることしかできない日々。陽菜はあなたを責めることなく優しく微笑んでくれるが、その瞳の奥にはどこか寂しそうな影が残っていた。',
      '「あの時、もう少しだけ勇気を出せていたら」——季節が変わりクラス替えを迎えた春、あなたの胸には小さな後悔がほろ苦く残っていた。',
    ]),
    defaultLetterFromA:
      '私の話を聞いてくれてありがとう。あなたが優しい人だということは、ちゃんとわかっています。ただ、もしいつかまた同じように苦しんでいる誰かを見かけたときは、ほんの少しだけ勇気を出して声をかけてあげてほしいなと思います。私も、もっと強くなれるように頑張るね。——朝霧 陽菜より',
    reflectionNote: '共感はあるものの、行動や相談への一歩が踏み出せなかったビターエンディングです。',
  }),
  bad_assumption: Object.freeze({
    id: 'bad_assumption',
    badge: '🌧️ バッドエンド1（決めつけのすれ違い）',
    title: '「わかるよ」という言葉の刃',
    subtitle: '自分の浅い経験だけで相手の苦しみを測り、心を閉ざさせてしまった結末',
    category: 'BAD END : ASSUMPTION',
    paragraphs: Object.freeze([
      '「私もお腹痛くなったことあるから全部わかるよ！ でも気合いで我慢すれば治るって、考えすぎだよ！」——あなたが良かれと思って口にしたその言葉が、決定的な溝を作った。',
      '陽菜（A）の表情から、スッと感情が消えていくのがわかった。「……そっか。うん、そうだね、ありがとう」。それきり、彼女が自分の体調や本音をあなたに話すことは二度となかった。',
      '一度似た経験をしただけで「相手のすべてがわかった」と決めつけ、相手が何年もかけて涙ながらに戦ってきた深刻さを軽く扱ってしまうこと。それは時に、何も知らない人の無関心よりも深く相手を傷つけるのだと気づいた時には、もう遅かった。',
    ]),
    defaultLetterFromA:
      '……心配して声をかけてくれたのかもしれませんが、「気にしなければ治る」「全部わかる」という言葉は、今の私には少し重すぎました。同じように見える症状でも、抱えている深さや事情は一人ひとり違います。いつかそのことに気づいてもらえたら嬉しいです。——朝霧 陽菜',
    reflectionNote: '自分の経験だけで相手を決めつけたり、根性論・安易な励ましを押しつけてしまった場合のバッドエンディングです。',
  }),
  bad_conformity: Object.freeze({
    id: 'bad_conformity',
    badge: '❄️ バッドエンド2（沈黙と孤立）',
    title: '教室のノイズに消えた声',
    subtitle: '周囲の笑い声と無理解の空気に流され、痛みから目を背けた結末',
    category: 'BAD END : CONFORMITY',
    paragraphs: Object.freeze([
      '「あの子、またトイレ？」「さっきオナラしてたよね笑」——教室に飛び交う無神経な笑い声の中で、あなたは自分が浮いてしまうことを恐れ、周りに合わせて愛想笑いを浮かべる道を選んだ。',
      '自分の内側にある不安も、陽菜（A）が抱えていた静かなSOSも、すべて「見なかったこと」にして蓋をした。その結果、教室は表面上いつも通り賑やかだったが、誰も本当の弱みを見せられない息苦しい場所のままだった。',
      'ある日、陽菜が教室の後ろの扉から出ていく背中を見送りながら、あなたは自分自身の心もまた、冷たい教室の中で孤立していることに気づいていた。',
    ]),
    defaultLetterFromA:
      '教室の中で、周りと違うことを言ったり、誰かの痛みに寄り添ったりするのは勇気がいることだと思います。でも、何気ない噂話や笑い声が、誰かにとっては教室にいられなくなるほどの傷になることもあります。どうかそのことを、心の片隅に覚えていてください。——朝霧 陽菜',
    reflectionNote: '周囲の同調圧力や偏見に流され、対話や理解を諦めてしまった場合のバッドエンディングです。',
  }),
});
