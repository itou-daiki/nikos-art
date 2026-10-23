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

test('story chapters dynamically change stage, crisis text, and monologue based on pre-diagnosis', () => {
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

  // 第1部（伏線）、第2部（舞台・危機描写）、第3部（相談のきっかけ）、第4部（Aの過去編）が事前診断で変化していることを検証
  assert.notEqual(chaptersClass[0].paragraphs[1], chaptersTrain[0].paragraphs[1]);
  assert.match(chaptersClass[1].locationLabel, /5限目・現代文の教室/);
  assert.match(chaptersTrain[1].locationLabel, /朝の快速電車/);
  assert.notEqual(chaptersClass[1].paragraphs[0], chaptersTrain[1].paragraphs[0]);
  assert.notEqual(chaptersClass[2].paragraphs[0], chaptersTrain[2].paragraphs[0]);
  assert.notEqual(chaptersClass[3].paragraphs[1], chaptersTrain[3].paragraphs[1]);

  // 心のクセ（copingStyle）によってモノローグが変化していることを検証
  assert.notEqual(chaptersClass[1].innerMonologue, chaptersTrain[1].innerMonologue);
});

test('IBS patient route always reaches a salvation ending and never a bad ending', () => {
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

  const lowMetrics = {
    empathy: 4,
    assumption: 10,
    courage: 2,
    trust: 2,
    freeTalkCount: 0,
  };
  const gentleSalvation = determineEnding(patientBp, lowMetrics);
  assert.equal(gentleSalvation.id, 'healing_gentle');
});

test('non-patient routes branch into true, happy, AI co-creation, bitter, and bad endings', () => {
  const v2Bp = createStoryBlueprint(
    createSampleAnswers({
      relationship: 'distant_classmate',
    })
  );

  // 1. 決めつけバッドエンド
  const badAssume = determineEnding(v2Bp, {
    empathy: 5,
    assumption: 7,
    courage: 2,
    trust: -1,
    freeTalkCount: 0,
  });
  assert.equal(badAssume.id, 'bad_assumption');

  // 2. 同調圧力・孤立バッドエンド
  const badConform = determineEnding(v2Bp, {
    empathy: 1,
    assumption: 2,
    courage: -3,
    trust: -3,
    freeTalkCount: 0,
  });
  assert.equal(badConform.id, 'bad_conformity');

  // 3. AI共創スペシャルエンド
  const aiCoCreation = determineEnding(v2Bp, {
    empathy: 13,
    assumption: 0,
    courage: 8,
    trust: 11,
    freeTalkCount: 3,
  });
  assert.equal(aiCoCreation.id, 'ai_cocreation');

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
  assert.match(chapterPrompt, /第二部/);

  const ending = determineEnding(bp, metrics);
  const letterPrompt = buildPersonalLetterPrompt({
    answers,
    blueprint: bp,
    ending,
    actionLogs: [
      {
        chapterNumber: 1,
        chapterTitle: '第一部',
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
