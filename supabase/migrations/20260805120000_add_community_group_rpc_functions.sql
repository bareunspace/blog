create or replace function public.update_community_group(p_id bigint, p_values jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_title text;
    v_group_key text;
    v_status text;
    v_schedule_text text;
    v_capacity integer;
    v_host_name text;
    v_open_chat_url text;
    v_description text;
begin
    v_title := nullif(trim(coalesce(p_values->> 'title', '')), '');
    v_group_key := nullif(trim(coalesce(p_values->> 'group_key', '')), '');
    v_status := nullif(trim(coalesce(p_values->> 'status', '')), '');
    v_schedule_text := nullif(trim(coalesce(p_values->> 'schedule_text', '')), '');
    v_capacity := nullif(p_values->> 'capacity', '')::integer;
    v_host_name := nullif(trim(coalesce(p_values->> 'host_name', '')), '');
    v_open_chat_url := nullif(trim(coalesce(p_values->> 'open_chat_url', '')), '');
    v_description := nullif(trim(coalesce(p_values->> 'description', '')), '');

    update public.community_groups
    set
        title = coalesce(v_title, title),
        group_key = coalesce(v_group_key, group_key),
        status = coalesce(v_status, status),
        schedule_text = coalesce(v_schedule_text, schedule_text),
        capacity = case when p_values ? 'capacity' then v_capacity else capacity end,
        host_name = coalesce(v_host_name, host_name),
        open_chat_url = coalesce(v_open_chat_url, open_chat_url),
        description = coalesce(v_description, description),
        updated_at = now()
    where id = p_id;

    return found;
end;
$$;

grant execute on function public.update_community_group(bigint, jsonb) to authenticated;

drop function if exists public.insert_community_group(jsonb);
create or replace function public.insert_community_group(p_values jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
    v_title text;
    v_group_key text;
    v_status text;
    v_schedule_text text;
    v_capacity integer;
    v_host_name text;
    v_open_chat_url text;
    v_description text;
    v_source_application_id bigint;
    v_new_id bigint;
begin
    v_title := nullif(trim(coalesce(p_values->> 'title', '')), '');
    if v_title is null then
        raise exception 'title is required';
    end if;

    v_group_key := nullif(trim(coalesce(p_values->> 'group_key', '')), 'other');
    v_status := nullif(trim(coalesce(p_values->> 'status', '')), 'draft');
    v_schedule_text := nullif(trim(coalesce(p_values->> 'schedule_text', '')), '');
    v_capacity := case when nullif(p_values->> 'capacity', '') is null then null else (p_values->> 'capacity')::integer end;
    v_host_name := nullif(trim(coalesce(p_values->> 'host_name', '')), '');
    v_open_chat_url := nullif(trim(coalesce(p_values->> 'open_chat_url', '')), '');
    v_description := nullif(trim(coalesce(p_values->> 'description', '')), '');
    v_source_application_id := case when nullif(p_values->> 'source_application_id', '') is null then null else (p_values->> 'source_application_id')::bigint end;

    insert into public.community_groups (
        title,
        group_key,
        status,
        schedule_text,
        capacity,
        host_name,
        open_chat_url,
        description,
        source_application_id
    ) values (
        v_title,
        coalesce(v_group_key, 'other'),
        coalesce(v_status, 'draft'),
        v_schedule_text,
        v_capacity,
        v_host_name,
        v_open_chat_url,
        v_description,
        v_source_application_id
    ) returning id into v_new_id;

    return v_new_id;
end;
$$;

grant execute on function public.insert_community_group(jsonb) to authenticated;
