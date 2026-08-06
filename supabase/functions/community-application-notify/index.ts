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

  if (
    action === 'delete'
    || action === 'update'
    || action === 'sync-group'
    || action === 'update-group'
    || action === 'create-group'
    || action === 'delete-group'
    || action === 'owner-list'
    || action === 'owner-update'
    || action === 'owner-delete'
    || action === 'owner-update-group-status'
    || action === 'report-group'
    || action === 'list-reports'
    || action === 'resolve-report'
  ) {
    const applicationId = body.applicationId ?? body.id;

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

      const normalizePhone = (value: unknown) => {
        const digits = String(value || '').replace(/[^0-9]/g, '');
        if (!digits) {
          return '';
        }
        if (digits.startsWith('82')) {
          return `0${digits.slice(2)}`;
        }
        return digits;
      };
      const isSamePhone = (left: unknown, right: unknown) => {
        const a = normalizePhone(left);
        const b = normalizePhone(right);
        if (!a || !b) {
          return false;
        }
        if (a === b) {
          return true;
        }
        const aLast8 = a.slice(-8);
        const bLast8 = b.slice(-8);
        if (aLast8.length === 8 && bLast8.length === 8 && aLast8 === bLast8) {
          return true;
        }
        if (a.length >= 8 && b.length >= 8 && (a.endsWith(b) || b.endsWith(a))) {
          return true;
        }
        return false;
      };
      const adminEmailsRaw = Deno.env.get('COMMUNITY_ADMIN_EMAILS') || 'keunyong@gmail.com,bareunjari@gmail.com';
      const adminEmails = new Set(
        adminEmailsRaw
          .split(',')
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      );
      const adminActions = new Set([
        'delete',
        'update',
        'update-group',
        'create-group',
        'delete-group',
        'list-reports',
        'resolve-report'
      ]);

      const assertAdmin = async () => {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

        if (!token) {
          return {
            ok: false,
            response: new Response(JSON.stringify({ error: 'Admin auth required' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          };
        }

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData?.user?.email) {
          return {
            ok: false,
            response: new Response(JSON.stringify({ error: 'Invalid admin token' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          };
        }

        const email = String(userData.user.email).trim().toLowerCase();
        if (!adminEmails.has(email)) {
          return {
            ok: false,
            response: new Response(JSON.stringify({ error: 'Admin permission denied' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          };
        }

        return { ok: true, email };
      };

      const syncGroupFromApplication = async (sourceApplicationId: number, application: Record<string, unknown>) => {
        const statusMap: Record<string, string> = {
          new: 'draft',
          reviewing: 'draft',
          contacted: 'draft',
          matched: 'recruiting',
          closed: 'closed'
        };
        const groupKey = String(application.group_key || 'other').trim() || 'other';

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
          image_path: String(application.image_path || existingGroup?.image_path || '').trim() || null,
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
      };

      const getOwnedApplication = async (id: number, contactEmail: string, contactPhone: string) => {
        const { data: row, error } = await supabase
          .from('community_applications')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !row) {
          throw new Error('신청 내역을 찾지 못했습니다.');
        }

        const rowEmail = String(row.contact_email || '').trim().toLowerCase();
        const hasStoredPhone = Boolean(normalizePhone(row.contact_phone));
        if (rowEmail !== contactEmail || (hasStoredPhone && !isSamePhone(row.contact_phone, contactPhone))) {
          throw new Error('본인 확인에 실패했습니다. 이메일과 전화번호를 확인해 주세요.');
        }

        return row;
      };

      if (adminActions.has(action)) {
        const adminCheck = await assertAdmin();
        if (!adminCheck.ok) {
          return adminCheck.response;
        }
      }

      if (action === 'owner-list') {
        const contactEmail = String(body.contactEmail || '').trim().toLowerCase();
        const contactPhone = normalizePhone(body.contactPhone);
        if (!contactEmail || !contactPhone) {
          return new Response(JSON.stringify({ error: 'Missing owner contact' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: rows, error } = await supabase
          .from('community_applications')
          .select('*')
          .ilike('contact_email', contactEmail)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) {
          throw error;
        }

        const emailRows = rows || [];
        let ownedRows = emailRows.filter((row) => {
          const hasStoredPhone = Boolean(normalizePhone(row.contact_phone));
          return hasStoredPhone ? isSamePhone(row.contact_phone, contactPhone) : true;
        });

        if (!ownedRows.length && emailRows.length === 1) {
          ownedRows = emailRows;
        }
        const sourceIds = ownedRows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id));
        const { data: groups, error: groupError } = sourceIds.length
          ? await supabase
            .from('community_groups')
            .select('id, source_application_id, status, title')
            .in('source_application_id', sourceIds)
          : { data: [], error: null };

        if (groupError) {
          throw groupError;
        }

        const groupBySourceId = new Map<number, Record<string, unknown>>();
        (groups || []).forEach((group) => {
          groupBySourceId.set(Number(group.source_application_id), group);
        });

        const withGroup = ownedRows.map((row) => ({
          ...row,
          linked_group: groupBySourceId.get(Number(row.id)) || null
        }));

        return new Response(JSON.stringify({ ok: true, applications: withGroup }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'owner-update') {
        const id = Number(applicationId);
        const contactEmail = String(body.contactEmail || '').trim().toLowerCase();
        const contactPhone = normalizePhone(body.contactPhone);
        if (!id || !contactEmail || !contactPhone) {
          return new Response(JSON.stringify({ error: 'Missing owner update parameters' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        await getOwnedApplication(id, contactEmail, contactPhone);

        const allowedFields = new Set(['group_title', 'availability', 'message', 'image_path']);
        const incomingFields = body.fields || {};
        const fields = Object.entries(incomingFields).reduce<Record<string, unknown>>((acc, [key, value]) => {
          if (allowedFields.has(key)) {
            acc[key] = typeof value === 'string' ? value.trim() : value;
          }
          return acc;
        }, {});

        if (!Object.keys(fields).length) {
          return new Response(JSON.stringify({ error: 'No editable owner fields provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: updatedRows, error } = await supabase
          .from('community_applications')
          .update(fields)
          .eq('id', id)
          .select('*')
          .limit(1);

        if (error) {
          throw error;
        }

        const updated = updatedRows?.[0];
        if (updated) {
          await syncGroupFromApplication(id, updated);
        }

        return new Response(JSON.stringify({ ok: true, updated: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'owner-delete') {
        const id = Number(applicationId);
        const contactEmail = String(body.contactEmail || '').trim().toLowerCase();
        const contactPhone = normalizePhone(body.contactPhone);
        if (!id || !contactEmail || !contactPhone) {
          return new Response(JSON.stringify({ error: 'Missing owner delete parameters' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        await getOwnedApplication(id, contactEmail, contactPhone);

        const { error } = await supabase
          .from('community_applications')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ ok: true, deleted: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'owner-update-group-status') {
        const id = Number(applicationId);
        const groupId = Number(body.groupId);
        const contactEmail = String(body.contactEmail || '').trim().toLowerCase();
        const contactPhone = normalizePhone(body.contactPhone);
        const nextStatus = String(body.status || '').trim();
        const allowedStatuses = new Set(['recruiting', 'closed']);

        if (!id || !groupId || !contactEmail || !contactPhone || !allowedStatuses.has(nextStatus)) {
          return new Response(JSON.stringify({ error: 'Invalid owner group status request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const ownedApplication = await getOwnedApplication(id, contactEmail, contactPhone);
        if (String(ownedApplication.application_type || '') !== 'host') {
          return new Response(JSON.stringify({ error: 'Only host applications can change group status' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: group, error: groupError } = await supabase
          .from('community_groups')
          .select('id, source_application_id')
          .eq('id', groupId)
          .single();

        if (groupError || !group || Number(group.source_application_id) !== id) {
          return new Response(JSON.stringify({ error: '이 신청과 연결된 모임만 변경할 수 있습니다.' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabase
          .from('community_groups')
          .update({ status: nextStatus })
          .eq('id', groupId);

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ ok: true, updated: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'report-group') {
        const groupId = Number(body.groupId);
        const reason = String(body.reason || '').trim();
        const groupTitle = String(body.groupTitle || '').trim();
        if (!groupId || reason.length < 5) {
          return new Response(JSON.stringify({ error: 'Invalid report payload' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const payload = {
          group_id: groupId,
          group_title: groupTitle || null,
          reason,
          source_path: String(body.sourcePath || '').trim() || null,
          reporter_email: String(body.reporterEmail || '').trim().toLowerCase() || null,
          reporter_phone: normalizePhone(body.reporterPhone) || null,
          status: 'open'
        };

        const { error } = await supabase
          .from('community_group_reports')
          .insert(payload);

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ ok: true, reported: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'list-reports') {
        const { data: reports, error } = await supabase
          .from('community_group_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          throw error;
        }

        const groupIds = (reports || [])
          .map((report) => Number(report.group_id))
          .filter((id) => Number.isFinite(id));
        const { data: groups } = groupIds.length
          ? await supabase
            .from('community_groups')
            .select('id')
            .in('id', groupIds)
          : { data: [] };

        const existingGroupIds = new Set((groups || []).map((group) => Number(group.id)));
        const normalizedReports = (reports || []).map((report) => ({
          ...report,
          group_exists: existingGroupIds.has(Number(report.group_id))
        }));

        return new Response(JSON.stringify({ ok: true, reports: normalizedReports }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'resolve-report') {
        const reportId = Number(body.reportId);
        const status = String(body.status || '').trim();
        const note = String(body.note || '').trim() || null;
        const adminCheck = await assertAdmin();
        const adminEmail = adminCheck.ok ? adminCheck.email : null;
        const allowedStatuses = new Set(['resolved', 'dismissed', 'open']);

        if (!reportId || !allowedStatuses.has(status)) {
          return new Response(JSON.stringify({ error: 'Invalid report resolve payload' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabase
          .from('community_group_reports')
          .update({
            status,
            resolved_note: note,
            resolved_at: status === 'open' ? null : new Date().toISOString(),
            resolved_by: status === 'open' ? null : (adminEmail || null)
          })
          .eq('id', reportId);

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ ok: true, resolved: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'delete') {
        if (!applicationId) {
          return new Response(JSON.stringify({ error: 'Missing applicationId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

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
          'image_path',
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
          'image_path',
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

      if (action === 'delete-group') {
        const groupId = body.groupId ?? body.id;
        if (!groupId) {
          return new Response(JSON.stringify({ error: 'Missing groupId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabase
          .from('community_groups')
          .delete()
          .eq('id', groupId);

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ ok: true, deleted: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'sync-group') {
        if (!applicationId) {
          return new Response(JSON.stringify({ error: 'Missing applicationId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const application = body.application || {};
        await syncGroupFromApplication(Number(applicationId), application);

        return new Response(JSON.stringify({ ok: true, synced: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'update') {
        if (!applicationId) {
          return new Response(JSON.stringify({ error: 'Missing applicationId' }), {
            status: 400,
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
          'image_path',
          'status',
          'admin_note',
          'group_title',
          'group_key',
          'application_type'
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

        const { data: updatedRows, error } = await supabase
          .from('community_applications')
          .update(fields)
          .eq('id', applicationId)
          .select('*')
          .limit(1);

        if (error) {
          throw error;
        }

        const updated = updatedRows?.[0];
        if (updated) {
          await syncGroupFromApplication(Number(applicationId), updated);
        }

        return new Response(JSON.stringify({ ok: true, updated: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const errorMessage = action === 'delete' || action === 'owner-delete' || action === 'delete-group' ? 'Delete failed' : 'Update failed';
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
