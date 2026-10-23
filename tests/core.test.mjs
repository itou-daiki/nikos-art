// @ts-check
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyChoiceEffect,
  buildFallbackReaction,
  buildPersonalLetterPrompt,
  buildPersonalizedChapterAiPrompt,
  buildPersonalizedChapters,
  buildPreDiagnosisAiPrompt,
  calculateDynamicBpm,
  callGeminiWithFallback,
  createInitialMetrics,
  createStoryBlueprint,
  determineEnding,
  errorStatus,
  evaluateFreeTextAction,
  extractTextFromGeminiPayload,
  formatApiErrors,
  formatFileTimestamp,
  parsePersonalizedChapterRewrite,
  tokenizeHorrorText,
} from '../core.js';

/**
 * テスト用の標準診断回答を生成するヘルパー
 * @param {Partial<import('../scenarios.js').PreDiagnosisAnswers>} [overrides]
 * @returns {import('../scenarios.js').PreDiagnosisAnswers}
 */
const createSampleAnswers = (overrides = {}) =>
  Object.freeze({
    playerName: '結城 蓮',
    experience: 'empathic_observer',
    triggerScene: 'japanese_class',
    fearFocus: 'sound_shame',
    relationship: 'best_friend',
    copingStyle: 'endure_alone',
    freeComment: '静かな場所でお腹が鳴るのが昔から少し怖いです',
    ...overrides,
  });

/**
 * テスト用のモックfetchを生成するヘルパー
 * @param {readonly (string | Error | { status: number; body?: unknown })[]} outcomes
 * @returns {typeof fetch}
 */
const createMockFetch = (outcomes) => {
  let index = 0;
  return async () => {
    const current = outcomes[index];
    index += 1;
    if (current instanceof Error) {
      throw current;
    }
    if (typeof current === 'string') {
      return /** @type {Response} */ (
        /** @type {unknown} */ ({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: current }] } }],
          }),
        })
      );
    }
    if (typeof current === 'object' && current !== null && 'status' in current) {
      const isOk = current.status >= 200 && current.status < 300;
      return /** @type {Response} */ (
        /** @type {unknown} */ ({
          ok: isOk,
          status: current.status,
          json: async () => current.body ?? {},
        })
      );
    }
    throw new Error('Unexpected mock outcome');
  };
};

test('pre-diagnosis selects distinct routes for IBS patient, best friend (v1), and classmate (v2)', () => {
  const patientBp = createStoryBlueprint(
    createSampleAnswers({
      experience: 'ibs_patient',
      relationship: 'self_protagonist',
    })
  );
  assert.equal(patientBp.routeId, 'route_a_healing');
  assert.equal(patientBp.isPatientRoute, true);

  const v1Bp = createStoryBlueprint(
    createSampleAnswers({
      experience: 'empathic_observer',
      relationship: 'best_friend',
    })
  );
  assert.equal(v1Bp.routeId, 'route_v1_bestfriend');
  assert.equal(v1Bp.isPatientRoute, false);

  const v2Bp = createStoryBlueprint(
    createSampleAnswers({
      experience: 'unaware_healthy',
      relationship: 'distant_classmate',
    })
  );
  assert.equal(v2Bp.routeId, 'route_v2_classmate');
  assert.equal(v2Bp.isPatientRoute, false);
});

test('story chapters dynamically change stage, crisis text, monologue, and horror HUD parameters', () => {
  const answersClass = createSampleAnswers({
    triggerScene: 'japanese_class',
    copingStyle: 'endure_alone',
    fearFocus: 'sound_shame',
  });
  const bpClass = createStoryBlueprint(answersClass);
  const chaptersClass = buildPersonalizedChapters(answersClass, bpClass);

  const answersTrain = createSampleAnswers({
    triggerScene: 'commuter_train',
    copingStyle: 'pretend_normal',
    fearFocus: 'sudden_wave',
  });
  const bpTrain = createStoryBlueprint(answersTrain);
  const chaptersTrain = buildPersonalizedChapters(answersTrain, bpTrain);

  assert.equal(chaptersClass.length, 5);
  assert.equal(chaptersTrain.length, 5);

  // 第1幕（伏線）、第2幕（舞台・危機描写）、第3幕（相談のきっかけ）、第4幕（Aの過去編）が事前診断で変化していることを検証
  assert.notEqual(chaptersClass[0].paragraphs[1], chaptersTrain[0].paragraphs[1]);
  assert.match(chaptersClass[1].locationLabel, /5限目・現代文の密室教室/);
  assert.match(chaptersTrain[1].locationLabel, /急行電車・開かない扉の前/);
  assert.notEqual(chaptersClass[1].paragraphs[0], chaptersTrain[1].paragraphs[0]);
  assert.notEqual(chaptersClass[2].paragraphs[0], chaptersTrain[2].paragraphs[0]);
  assert.notEqual(chaptersClass[3].paragraphs[1], chaptersTrain[3].paragraphs[1]);

  // 第2幕（クライシス）は心拍数・静寂度・視線の目が急上昇し、第5幕（解決）では落ち着くことを検証
  assert.ok(chaptersClass[1].baseBpm >= 135);
  assert.ok(chaptersClass[1].silenceLevel >= 90);
  assert.ok(chaptersClass[1].gazeEyesCount >= 12);
  assert.equal(chaptersClass[4].gazeEyesCount, 0);

  // 心のクセ（copingStyle）によってモノローグが変化していることを検証
  assert.notEqual(chaptersClass[1].innerMonologue, chaptersTrain[1].innerMonologue);
});

test('calculateDynamicBpm and tokenizeHorrorText work accurately for horror UI', () => {
  const calmMetrics = {
    empathy: 10,
    assumption: 0,
    courage: 5,
    trust: 8,
    freeTalkCount: 1,
  };
  const panicMetrics = {
    empathy: 0,
    assumption: 5,
    courage: 0,
    trust: -2,
    freeTalkCount: 0,
  };

  const bpmCalm = calculateDynamicBpm(100, calmMetrics);
  const bpmPanic = calculateDynamicBpm(100, panicMetrics);
  assert.ok(bpmCalm < 100);
  assert.ok(bpmPanic >= 130);

  const tokens = tokenizeHorrorText(
    '教室でお腹が痛い時に「さっきさ、あの子オナラしてたよね？笑」と言われたが、「——私も。」で救われた'
  );
  const crimsonTokens = tokens.filter((t) => t.kind === 'crimson');
  const salvageTokens = tokens.filter((t) => t.kind === 'salvage');
  assert.ok(crimsonTokens.length >= 2);
  assert.equal(salvageTokens.length, 1);
  assert.equal(salvageTokens[0].text, '「——私も。」');
});

test('IBS patient route always reaches a salvation ending and never a horror bad ending', () => {
  const patientBp = createStoryBlueprint(
    createSampleAnswers({
      experience: 'ibs_patient',
      relationship: 'self_protagonist',
    })
  );

  const highMetrics = {
    empathy: 18,
    assumption: 0,
    courage: 12,
    trust: 16,
    freeTalkCount: 1,
  };
  const trueSalvation = determineEnding(patientBp, highMetrics);
  assert.equal(trueSalvation.id, 'healing_true');
  assert.equal(trueSalvation.isHorrorBadEnd, false);

  const lowMetrics = {
    empathy: 4,
    assumption: 10,
    courage: 2,
    trust: 2,
    freeTalkCount: 0,
  };
  const gentleSalvation = determineEnding(patientBp, lowMetrics);
  assert.equal(gentleSalvation.id, 'healing_gentle');
  assert.equal(gentleSalvation.isHorrorBadEnd, false);
});

test('non-patient routes branch into true, happy, AI co-creation, bitter, and horror bad endings', () => {
  const v2Bp = createStoryBlueprint(
    createSampleAnswers({
      relationship: 'distant_classmate',
    })
  );

  // 1. 決めつけホラーバッドエンド
  const badAssume = determineEnding(v2Bp, {
    empathy: 5,
    assumption: 7,
    courage: 2,
    trust: -1,
    freeTalkCount: 0,
  });
  assert.equal(badAssume.id, 'bad_assumption');
  assert.equal(badAssume.isHorrorBadEnd, true);

  // 2. 同調圧力・視線の牢獄ホラーバッドエンド
  const badConform = determineEnding(v2Bp, {
    empathy: 1,
    assumption: 2,
    courage: -3,
    trust: -3,
    freeTalkCount: 0,
  });
  assert.equal(badConform.id, 'bad_conformity');
  assert.equal(badConform.isHorrorBadEnd, true);

  // 3. AI共創スペシャルエンド
  const aiCoCreation = determineEnding(v2Bp, {
    empathy: 13,
    assumption: 0,
    courage: 8,
    trust: 11,
    freeTalkCount: 3,
  });
  assert.equal(aiCoCreation.id, 'ai_cocreation');
  assert.equal(aiCoCreation.isHorrorBadEnd, false);

  // 4. トゥルーエンド
  const trueEnd = determineEnding(v2Bp, {
    empathy: 16,
    assumption: 0,
    courage: 12,
    trust: 14,
    freeTalkCount: 0,
  });
  assert.equal(trueEnd.id, 'true_bond');

  // 5. ハッピーエンド
  const happyEnd = determineEnding(v2Bp, {
    empathy: 10,
    assumption: 1,
    courage: 5,
    trust: 8,
    freeTalkCount: 0,
  });
  assert.equal(happyEnd.id, 'happy_ally');

  // 6. ビターエンド
  const bitterEnd = determineEnding(v2Bp, {
    empathy: 5,
    assumption: 1,
    courage: 0,
    trust: 3,
    freeTalkCount: 0,
  });
  assert.equal(bitterEnd.id, 'bitter_distance');
});

test('evaluateFreeTextAction distinguishes empathic support from dismissive assumptions', () => {
  const empathicEffect = evaluateFreeTextAction(
    '話してくれてありがとう。ひとりで苦しかったよね、これからは一緒に考えよう',
    false
  );
  assert.ok(empathicEffect.empathyDelta >= 4);
  assert.equal(empathicEffect.assumptionDelta, 0);
  assert.ok(empathicEffect.trustDelta > 0);

  const dismissiveEffect = evaluateFreeTextAction(
    'そんなの気にしすぎだよ、気合いで我慢すればすぐ治るって！',
    false
  );
  assert.ok(dismissiveEffect.assumptionDelta >= 3);
  assert.ok(dismissiveEffect.trustDelta < 0);

  // 否定文脈（「気にしすぎじゃないよ」）は決めつけとしてペナルティを受けない
  const negatedAssumption = evaluateFreeTextAction(
    '全然気にしすぎじゃないよ、無理しないでね',
    false
  );
  assert.equal(negatedAssumption.assumptionDelta, 0);
  assert.ok(negatedAssumption.empathyDelta >= 2);
});

test('parsePersonalizedChapterRewrite parses valid 4-part AI output and falls back safely', () => {
  const answers = createSampleAnswers();
  const bp = createStoryBlueprint(answers);
  const chapter = buildPersonalizedChapters(answers, bp)[0];

  const validRaw = '段落A\n===\n段落B\n===\n段落C\n===\n（新しい心の声）';
  const parsed = parsePersonalizedChapterRewrite(validRaw, chapter);
  assert.deepEqual(parsed.paragraphs, ['段落A', '段落B', '段落C']);
  assert.equal(parsed.innerMonologue, '（新しい心の声）');

  const malformedRaw = '区切りがない短いテキスト';
  const fallback = parsePersonalizedChapterRewrite(malformedRaw, chapter);
  assert.deepEqual(fallback.paragraphs, chapter.paragraphs);
  assert.equal(fallback.innerMonologue, chapter.innerMonologue);
});

test('Gemini API fallback and safe error formatting work without leaking secrets', async () => {
  const fetchSuccessAfterRetry = createMockFetch([
    new Error('503 service unavailable'),
    'AIからの生成テキスト',
  ]);
  const okResult = await callGeminiWithFallback({
    prompt: 'テストプロンプト',
    apiKey: 'secret-api-key-123',
    fetchImpl: fetchSuccessAfterRetry,
  });
  assert.equal(okResult.ok, true);
  if (okResult.ok) {
    assert.equal(okResult.text, 'AIからの生成テキスト');
  }

  const fetchQuotaError = createMockFetch([
    new Error('429 quota secret-api-key-123 private-text'),
    new Error('403 forbidden secret-api-key-123'),
  ]);
  const failResult = await callGeminiWithFallback({
    prompt: 'private-text',
    apiKey: 'secret-api-key-123',
    fetchImpl: fetchQuotaError,
  });
  assert.equal(failResult.ok, false);
  if (!failResult.ok) {
    assert.match(failResult.errorMessage, /429/);
    assert.match(failResult.errorMessage, /403/);
    assert.ok(!failResult.errorMessage.includes('secret-api-key-123'));
    assert.ok(!failResult.errorMessage.includes('private-text'));
  }
});

test('prompt builders and helper utilities produce valid output', () => {
  const answers = createSampleAnswers();
  const bp = createStoryBlueprint(answers);
  const chapters = buildPersonalizedChapters(answers, bp);
  const metrics = applyChoiceEffect(
    createInitialMetrics(),
    chapters[0].choices[0].effect,
    false
  );

  const diagPrompt = buildPreDiagnosisAiPrompt(answers, bp);
  assert.match(diagPrompt, /5限目の静まり返った国語の授業/);

  const chapterPrompt = buildPersonalizedChapterAiPrompt({
    answers,
    blueprint: bp,
    chapterData: chapters[1],
    metrics,
    lastReactionText: '前回の余韻',
  });
  assert.match(chapterPrompt, /第二幕/);

  const ending = determineEnding(bp, metrics);
  const letterPrompt = buildPersonalLetterPrompt({
    answers,
    blueprint: bp,
    ending,
    actionLogs: [
      {
        chapterNumber: 1,
        chapterTitle: '第一幕',
        playerInput: '元気？',
        isFreeTalk: false,
        aiReaction: '笑顔で頷いた',
      },
    ],
  });
  assert.match(letterPrompt, /朝霧 陽菜/);

  const fallbackReaction = buildFallbackReaction(
    bp,
    1,
    chapters[0].choices[0].effect,
    'テスト発言'
  );
  assert.ok(fallbackReaction.length > 10);

  assert.equal(extractTextFromGeminiPayload(null), null);
  assert.equal(errorStatus({ code: 429 }), '429');
  assert.match(formatApiErrors([{ model: 'm1', error: new Error('404') }]), /404/);
  assert.equal(formatFileTimestamp(new Date(2026, 9, 23, 16, 5, 9)), '20261023_160509');
});
