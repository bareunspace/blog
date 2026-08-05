import { createClient } from 'npm:@supabase/supabase-js@2';

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

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '').trim().toLowerCase();

  if (action === 'delete' || action === 'update' || action === 'sync-group' || action === 'update-group' || action === 'create-group') {
    const applicationId = body.applicationId ?? body.id;
    if (!applicationId) {
      return new Response(JSON.stringify({ error: 'Missing applicationId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://nhiyxgcrjdzdiquutxml.supabase.co';
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!serviceRoleKey) {
        return new Response(JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
      });

      if (action === 'delete') {
        const { error } = await supabase
          .from('community_applications')
          .delete()
          .eq('id', applicationId);

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ ok: true, deleted: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'create-group') {
        const values = body.values || body.payload || {};
        const allowedGroupFields = new Set([
          'title',
          'group_key',
          'status',
          'schedule_text',
          'capacity',
          'host_name',
          'open_chat_url',
          'description',
          'source_application_id'
        ]);
        const fields = Object.entries(values).reduce<Record<string, unknown>>((acc, [key, value]) => {
          if (allowedGroupFields.has(key)) {
            acc[key] = value;
          }
          return acc;
        }, {});

        if (!fields.title) {
          return new Response(JSON.stringify({ error: 'Missing group title' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data, error } = await supabase
          .from('community_groups')
          .insert(fields)
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ ok: true, created: true, groupId: data?.id }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'update-group') {
        const groupId = body.groupId ?? body.id;
        if (!groupId) {
          return new Response(JSON.stringify({ error: 'Missing groupId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const values = body.values || {};
        const allowedGroupFields = new Set([
          'title',
          'group_key',
          'status',
          'schedule_text',
          'capacity',
          'host_name',
          'open_chat_url',
          'description'
        ]);
        const fields = Object.entries(values).reduce<Record<string, unknown>>((acc, [key, value]) => {
          if (allowedGroupFields.has(key)) {
            acc[key] = value;
          }
          return acc;
        }, {});

        if (!Object.keys(fields).length) {
          return new Response(JSON.stringify({ error: 'No editable group fields provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabase
          .from('community_groups')
          .update(fields)
          .eq('id', groupId);

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ ok: true, updated: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'sync-group') {
        const application = body.application || {};
        const statusMap: Record<string, string> = {
          new: 'draft',
          reviewing: 'draft',
          contacted: 'draft',
          matched: 'recruiting',
          closed: 'closed'
        };
        const groupKey = String(application.group_key || 'other').trim() || 'other';
        const sourceApplicationId = Number(applicationId);

        const { data: existingGroups, error: selectError } = await supabase
          .from('community_groups')
          .select('*')
          .eq('source_application_id', sourceApplicationId)
          .limit(1);

        if (selectError) {
          throw selectError;
        }

        const existingGroup = existingGroups?.[0];
        const trimmedTitle = String(application.group_title || '').trim();
        const fallbackDescription = [application.existing_group_summary, application.message]
          .filter((item) => typeof item === 'string' && item.trim())
          .join('\n\n');
        const fallbackHostName = application.application_type === 'host' ? String(application.applicant_name || '').trim() || null : null;
        const nextStatus = statusMap[String(application.status || '')] || existingGroup?.status || 'draft';
        const nextPayload = {
          group_key: groupKey,
          title: trimmedTitle || existingGroup?.title || '모임 초안',
          description: String(application.description || fallbackDescription || existingGroup?.description || '').trim() || null,
          status: nextStatus,
          host_name: String(application.host_name || fallbackHostName || existingGroup?.host_name || '').trim() || null,
          schedule_text: String(application.schedule_text || application.availability || existingGroup?.schedule_text || '').trim() || null,
          capacity: existingGroup?.capacity ?? null,
          open_chat_url: String(application.open_chat_url || existingGroup?.open_chat_url || '').trim() || null,
          source_application_id: sourceApplicationId
        };

        if (existingGroup?.id) {
          const { error } = await supabase
            .from('community_groups')
            .update(nextPayload)
            .eq('id', existingGroup.id);

          if (error) {
            throw error;
          }
        } else {
          const { error } = await supabase
            .from('community_groups')
            .insert(nextPayload);

          if (error) {
            throw error;
          }
        }

        return new Response(JSON.stringify({ ok: true, synced: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const allowedFields = new Set([
        'applicant_name',
        'contact_email',
        'contact_phone',
        'availability',
        'existing_group_summary',
        'message',
        'status',
        'admin_note',
        'group_title',
        'group_key',
        'application_type',
        'description'
      ]);
      const incomingFields = body.fields || {};
      const fields = Object.entries(incomingFields).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (allowedFields.has(key)) {
          acc[key] = value;
        }
        return acc;
      }, {});

      if (!Object.keys(fields).length) {
        return new Response(JSON.stringify({ error: 'No editable fields provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error } = await supabase
        .from('community_applications')
        .update(fields)
        .eq('id', applicationId);

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ ok: true, updated: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const errorMessage = action === 'delete' ? 'Delete failed' : 'Update failed';
      return new Response(JSON.stringify({ error: errorMessage, detail }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
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

  const adminSubject = `[바른자리 커뮤니티] 새 신청: ${application.group_title || '커뮤니티 신청'}`;
  const adminTextLines = [
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
    adminTextLines.push('', `관리자 페이지: ${adminUrl}`);
  }

  const adminText = adminTextLines.join('\n');
  const applicantSubject = `[바른자리 커뮤니티] 신청 접수 확인`;
  const applicantText = [
    `${application.applicant_name || '신청자'}님, 신청이 접수되었습니다.`,
    '',
    '바른자리 커뮤니티 신청이 정상적으로 접수되었습니다.',
    '운영 가능 여부와 연락 방식은 신청 내용 확인 후 개별로 안내드리겠습니다.',
    '',
    `신청 유형: ${application.application_type_label || application.application_type || '-'}`,
    `모임 분류: ${groupLabel}`,
    `모임: ${application.group_title || '-'}`,
    `신청자 이름: ${application.applicant_name || '-'}`,
    `연락 이메일: ${application.contact_email || '-'}`,
    `연락 전화: ${application.contact_phone || '-'}`
  ].join('\n');

  const sendEmail = async (to: string[], subject: string, text: string, replyTo?: string) => {
    const payload: Record<string, unknown> = {
      from: notifyFrom,
      to,
      subject,
      text
    };

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
  };

  try {
    if (notifyRecipients.length > 0) {
      await sendEmail(notifyRecipients, adminSubject, adminText, applicantReplyTo);
    }

    if (applicantReplyTo) {
      await sendEmail([applicantReplyTo], applicantSubject, applicantText, applicantReplyTo);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: 'Email send failed', detail }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
