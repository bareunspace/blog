(() => {
  'use strict';

  const init = () => {
    const form = document.querySelector('[data-aii-form]');
    const interviewCard = document.querySelector('[data-aii-card]');
    const modeSelect = form?.querySelector('[data-aii-mode]');
    if (!form || !interviewCard || !modeSelect || document.querySelector('[data-aii-timed-mode]')) return;

    const formActions = form.querySelector(':scope > .aii-actions');
    const questionNode = interviewCard.querySelector('[data-aii-question]');
    const progressNode = interviewCard.querySelector('[data-aii-progress]');
    const answerStart = interviewCard.querySelector('[data-aii-answer-start]');
    const answerStop = interviewCard.querySelector('[data-aii-answer-stop]');
    const nextButton = interviewCard.querySelector('[data-aii-next]');
    const prevButton = interviewCard.querySelector('[data-aii-prev]');
    const restartButton = interviewCard.querySelector('[data-aii-restart]');
    const recordStart = document.querySelector('[data-aii-record-start]');
    const recordStop = document.querySelector('[data-aii-record-stop]');

    const field = document.createElement('label');
    field.dataset.aiiTimedMode = 'true';
    field.innerHTML = `
      <span>면접 진행 방식</span>
      <select data-aii-timed-mode-select>
        <option value="standard">일반 연습</option>
        <option value="jobda">JOBDA형 타이머 연습</option>
      </select>
      <small style="color:#6b756f;line-height:1.5">JOBDA형은 공개된 일반적 영상면접 흐름을 참고한 연습용 모드이며 실제 기업별 문항·시간은 달라질 수 있습니다.</small>
    `;
    if (formActions) form.insertBefore(field, formActions);
    else form.appendChild(field);

    const panel = document.createElement('section');
    panel.dataset.aiiTimedPanel = 'true';
    panel.hidden = true;
    panel.style.cssText = 'margin:0 0 1rem;padding:.9rem 1rem;border:1px solid #dce8e1;border-radius:14px;background:#f7fbf8;text-align:center;';
    panel.innerHTML = `
      <p data-aii-timed-label style="margin:0 0 .2rem;color:#456151;font-size:.82rem;font-weight:700">실전 타이머</p>
      <strong data-aii-timed-clock style="display:block;font-size:2rem;letter-spacing:-.04em;color:#203c2d">00:30</strong>
      <p data-aii-timed-note style="margin:.25rem 0 .7rem;color:#66736b;font-size:.8rem">질문을 확인한 뒤 준비시간을 시작하세요.</p>
      <div style="display:flex;justify-content:center;gap:.45rem;flex-wrap:wrap">
        <button type="button" class="btn-primary" data-aii-timed-start>30초 준비 시작</button>
        <button type="button" class="btn-outline" data-aii-timed-cancel disabled>타이머 중지</button>
      </div>
    `;
    const questionFit = interviewCard.querySelector('[data-aii-question-fit]');
    interviewCard.insertBefore(panel, questionFit || interviewCard.firstChild);

    const timedSelect = field.querySelector('[data-aii-timed-mode-select]');
    const label = panel.querySelector('[data-aii-timed-label]');
    const clock = panel.querySelector('[data-aii-timed-clock]');
    const note = panel.querySelector('[data-aii-timed-note]');
    const startButton = panel.querySelector('[data-aii-timed-start]');
    const cancelButton = panel.querySelector('[data-aii-timed-cancel]');

    let timerId = null;
    let phase = 'idle';
    let remaining = 30;

    const active = () => modeSelect.value === 'interview' && timedSelect.value === 'jobda';
    const format = seconds => `00:${String(Math.max(0, seconds)).padStart(2, '0')}`;
    const clearTimer = () => {
      if (timerId) window.clearInterval(timerId);
      timerId = null;
    };
    const setUi = (nextPhase, seconds, message) => {
      phase = nextPhase;
      remaining = seconds;
      clock.textContent = format(seconds);
      note.textContent = message;
      cancelButton.disabled = nextPhase === 'idle';
      startButton.disabled = nextPhase !== 'idle';
      label.textContent = nextPhase === 'answer' ? '답변 시간' : nextPhase === 'countdown' ? '곧 녹화를 시작합니다' : '준비 시간';
    };
    const safeClick = button => {
      if (button && !button.disabled) button.click();
    };
    const reset = () => {
      clearTimer();
      setUi('idle', 30, '질문을 확인한 뒤 준비시간을 시작하세요.');
      startButton.textContent = '30초 준비 시작';
    };
    const stopAnswer = () => {
      safeClick(answerStop);
      safeClick(recordStop);
      clearTimer();
      phase = 'done';
      clock.textContent = '완료';
      label.textContent = '답변 완료';
      note.textContent = '답변이 종료되었습니다. 내용을 확인한 뒤 다음 질문으로 이동하세요.';
      cancelButton.disabled = true;
      startButton.disabled = false;
      startButton.textContent = '같은 질문 다시 연습';
    };
    const startAnswer = () => {
      setUi('answer', 90, '90초 안에 핵심부터 답변해 보세요. 시간이 끝나면 자동 종료됩니다.');
      safeClick(answerStart);
      safeClick(recordStart);
      timerId = window.setInterval(() => {
        remaining -= 1;
        clock.textContent = format(remaining);
        if (remaining <= 0) stopAnswer();
      }, 1000);
    };
    const startCountdown = () => {
      clearTimer();
      phase = 'countdown';
      let count = 3;
      label.textContent = '곧 답변 시작';
      clock.textContent = String(count);
      note.textContent = '카메라를 보고 첫 문장을 준비하세요.';
      timerId = window.setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearTimer();
          startAnswer();
          return;
        }
        clock.textContent = String(count);
      }, 1000);
    };
    const startPrep = () => {
      if (!active()) return;
      clearTimer();
      setUi('prep', 30, '질문의 핵심과 첫 문장을 정리하세요.');
      timerId = window.setInterval(() => {
        remaining -= 1;
        clock.textContent = format(remaining);
        if (remaining <= 0) startCountdown();
      }, 1000);
    };
    const syncVisibility = () => {
      const isInterview = modeSelect.value === 'interview';
      field.hidden = !isInterview;
      panel.hidden = !(isInterview && timedSelect.value === 'jobda');
      if (panel.hidden) reset();
    };

    startButton.addEventListener('click', startPrep);
    cancelButton.addEventListener('click', () => {
      if (phase === 'answer') {
        safeClick(answerStop);
        safeClick(recordStop);
      }
      reset();
    });
    timedSelect.addEventListener('change', syncVisibility);
    modeSelect.addEventListener('change', syncVisibility);
    nextButton?.addEventListener('click', reset);
    prevButton?.addEventListener('click', reset);
    restartButton?.addEventListener('click', reset);
    form.addEventListener('submit', () => window.setTimeout(() => {
      if (active()) reset();
    }, 0));

    syncVisibility();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
