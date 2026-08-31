(() => {
  if (window.__bareunjariLearningVisibilityAttached) return;
  window.__bareunjariLearningVisibilityAttached = true;

  const showStatus = (message, kind = 'info') => {
    const node = document.querySelector('[data-learning-candidates-status]');
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    node.classList.remove('is-error', 'is-success');
    if (kind === 'error') node.classList.add('is-error');
    if (kind === 'success') node.classList.add('is-success');
  };

  const formatDiagnostic = (data, error) => {
    const diagnostic = data?.diagnostic;
    if (!diagnostic) return data?.error || error?.message || '알 수 없는 오류';
    const parts = [diagnostic.stage || 'unknown_stage'];
    if (diagnostic.github_status) parts.push(`GitHub ${diagnostic.github_status}`);
    if (diagnostic.attempt) parts.push(`${diagnostic.attempt}회 시도`);
    const detail = diagnostic.response_message || diagnostic.message;
    return `${parts.join(' / ')}${detail ? `: ${detail}` : ''}`;
  };

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('[data-learning-toggle-execution]');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const card = button.closest('[data-learning-candidate-id]');
    const candidateId = card?.dataset.learningCandidateId;
    const active = button.dataset.learningToggleExecution === 'true';
    if (!candidateId || card?.dataset.learningSaving === 'true') return;

    const message = active
      ? '이 카드를 홈페이지에 다시 노출할까요?'
      : '이 카드의 홈페이지 노출을 중지할까요? KB 내용과 판단 이력은 유지됩니다.';
    if (!window.confirm(message)) return;

    card.dataset.learningSaving = 'true';
    button.disabled = true;
    showStatus(active ? '홈페이지에 다시 노출하는 중입니다.' : '홈페이지 노출을 중지하는 중입니다.', 'success');

    const client = window.barunjariAdmin?.client;
    if (!client) {
      delete card.dataset.learningSaving;
      button.disabled = false;
      showStatus('관리자 연결을 확인하지 못했습니다.', 'error');
      return;
    }

    const { data, error } = await client.functions.invoke('learning-visibility', {
      body: { candidate_id: candidateId, active }
    });

    if (error || !data?.ok) {
      delete card.dataset.learningSaving;
      button.disabled = false;
      showStatus(`홈페이지 노출 상태를 변경하지 못했습니다. (${formatDiagnostic(data, error)})`, 'error');
      return;
    }

    showStatus(active ? '홈페이지에 다시 노출했습니다.' : '홈페이지 노출을 중지했습니다. KB와 판단 이력은 유지됩니다.', 'success');
    window.setTimeout(() => window.location.reload(), 500);
  }, true);
})();
