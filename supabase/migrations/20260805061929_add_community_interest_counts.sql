create or replace function public.get_community_interest_counts()
returns table (
    count_scope text,
    group_key text,
    target_group_id bigint,
    interest_count bigint
)
language sql
security definer
set search_path = public
as $$
    select
        'topic'::text as count_scope,
        ca.group_key,
        null::bigint as target_group_id,
        count(*)::bigint as interest_count
    from public.community_applications ca
    where ca.application_type = 'interest'
      and ca.target_group_id is null
    group by ca.group_key

    union all

    select
        'group'::text as count_scope,
        ca.group_key,
        ca.target_group_id,
        count(*)::bigint as interest_count
    from public.community_applications ca
    where ca.application_type = 'interest'
      and ca.target_group_id is not null
    group by ca.group_key, ca.target_group_id;
$$;

revoke all on function public.get_community_interest_counts() from public;
grant execute on function public.get_community_interest_counts() to anon, authenticated;
