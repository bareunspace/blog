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
  const notifyToRaw = Deno.env.get('COMMUNITY_NOTIFY_TO') || 'bareunjari@gmail.com';
  const notifyRecipients = notifyToRaw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const internalAdminEmailsRaw = Deno.env.get('COMMUNITY_INTERNAL_ADMIN_EMAILS') || 'bareunjari@gmail.com';
  const internalAdminEmails = new Set(
    internalAdminEmailsRaw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
  const notifyFromEmail = Deno.env.get('COMMUNITY_NOTIFY_FROM_EMAIL') || Deno.env.get('COMMUNITY_NOTIFY_FROM') || 'onboarding@resend.dev';
  const notifyFromName = Deno.env.get('COMMUNITY_NOTIFY_FROM_NAME') || 'bareunjari@gmail.com';
  const notifyFrom = `${notifyFromName} <${notifyFromEmail}>`;

  if (!resendApiKey) {
    return new Response(JSON.stringify({ skipped: true, reason: 'RESEND_API_KEY is not configured' }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const body = await req.json().catch(() => ({}));
  const application = body.application || {};
  const applicantReplyTo = String(application.contact_email || '').trim();
  const adminUrl = body.adminUrl || 'https://bareunjari.com/admin.html';
  const includeAdminUrl = notifyRecipients.length > 0 && notifyRecipients.every((email) => internalAdminEmails.has(email));
  const groupLabels: Record<string, string> = {
    interview: '면접 준비',
    reading: '독서모임',
    ai: 'AI 사용',
    other: '기타'
  };
  const groupLabel = groupLabels[String(application.group_key || '')] || application.group_key || '-';

  const subject = `[바른자리 커뮤니티] 새 신청: ${application.group_title || '커뮤니티 신청'}`;
  const textLines = [
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
    `메시지: ${application.message || '-'}`
  ];

  if (includeAdminUrl) {
    textLines.push('', `관리자 페이지: ${adminUrl}`);
  }

  const text = textLines.join('\n');

  const emailPayload: Record<string, unknown> = {
    from: notifyFrom,
    to: notifyRecipients,
    subject,
    text
  };

  if (applicantReplyTo) {
    emailPayload.reply_to = [applicantReplyTo];
    emailPayload.headers = {
      'Reply-To': applicantReplyTo
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailPayload)
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
