const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const notifyTo = Deno.env.get('COMMUNITY_NOTIFY_TO') || 'bareunjari@gmail.com';
  const notifyFrom = Deno.env.get('COMMUNITY_NOTIFY_FROM') || 'Barunjari <onboarding@resend.dev>';

  if (!resendApiKey) {
    return new Response(JSON.stringify({ skipped: true, reason: 'RESEND_API_KEY is not configured' }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const body = await req.json().catch(() => ({}));
  const application = body.application || {};
  const adminUrl = body.adminUrl || 'https://bareunjari.com/admin.html';
  const groupLabels: Record<string, string> = {
    interview: '면접 준비',
    reading: '독서모임',
    ai: 'AI 사용',
    other: '기타'
  };
  const groupLabel = groupLabels[String(application.group_key || '')] || application.group_key || '-';

  const subject = `[바른자리 커뮤니티] 새 신청: ${application.group_title || '커뮤니티 신청'}`;
  const text = [
    '[바른자리 커뮤니티] 새 신청이 도착했습니다.',
    '',
    `신청 유형: ${application.application_type_label || application.application_type || '-'}`,
    `모임 분류: ${groupLabel}`,
    `모임: ${application.group_title || '-'}`,
    `대상 모임 ID: ${application.target_group_id || '-'}`,
    `신청자: ${application.applicant_name || '-'}`,
    `이메일: ${application.contact_email || '-'}`,
    `전화: ${application.contact_phone || '-'}`,
    `가능 일정: ${application.availability || '-'}`,
    `기존 모임: ${application.existing_group_summary || '-'}`,
    `메시지: ${application.message || '-'}`,
    '',
    `관리자 페이지: ${adminUrl}`
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: notifyFrom,
      to: [notifyTo],
      subject,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(JSON.stringify({ error: 'Email send failed', detail: errorText }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
