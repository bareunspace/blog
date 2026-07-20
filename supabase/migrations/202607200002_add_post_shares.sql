create table if not exists public.post_shares (
    id bigint generated always as identity primary key,
    post_key text not null,
    share_method text not null check (share_method in ('native_share', 'copy_link', 'fallback_copy')),
    visitor_token uuid,
    page_path text,
    page_title text,
    branch_slug text,
    created_at timestamptz not null default now()
);

create index if not exists idx_post_shares_post_key
    on public.post_shares (post_key);

create index if not exists idx_post_shares_post_key_created_at
    on public.post_shares (post_key, created_at desc);

alter table public.post_shares enable row level security;

revoke all on public.post_shares from anon, authenticated;

create or replace function public.get_post_share_state(
    p_post_key text
)
returns table (
    share_count bigint
)
language sql
security definer
set search_path = public
as $$
    select count(*)::bigint as share_count
    from public.post_shares
    where post_key = p_post_key;
$$;

create or replace function public.submit_post_share(
    p_post_key text,
    p_share_method text,
    p_visitor_token uuid default null,
    p_page_path text default null,
    p_page_title text default null,
    p_branch_slug text default null
)
returns table (
    share_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_share_method text;
begin
    if coalesce(trim(p_post_key), '') = '' then
        raise exception 'post_key is required';
    end if;

    v_share_method := nullif(trim(coalesce(p_share_method, '')), '');

    if v_share_method is null or v_share_method not in ('native_share', 'copy_link', 'fallback_copy') then
        raise exception 'invalid share method: %', v_share_method;
    end if;

    insert into public.post_shares (
        post_key,
        share_method,
        visitor_token,
        page_path,
        page_title,
        branch_slug
    )
    values (
        p_post_key,
        v_share_method,
        p_visitor_token,
        nullif(trim(coalesce(p_page_path, '')), ''),
        nullif(trim(coalesce(p_page_title, '')), ''),
        nullif(trim(coalesce(p_branch_slug, '')), '')
    );

    return query
    select *
    from public.get_post_share_state(p_post_key);
end;
$$;

grant execute on function public.get_post_share_state(text) to anon, authenticated;
grant execute on function public.submit_post_share(text, text, uuid, text, text, text) to anon, authenticated;
