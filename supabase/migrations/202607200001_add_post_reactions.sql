create table if not exists public.post_reactions (
    id bigint generated always as identity primary key,
    post_key text not null,
    reaction_value text not null check (reaction_value in ('helpful', 'like', 'new')),
    visitor_token uuid not null,
    page_path text,
    page_title text,
    branch_slug text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (post_key, visitor_token)
);

create index if not exists idx_post_reactions_post_key
    on public.post_reactions (post_key);

create index if not exists idx_post_reactions_post_key_reaction_value
    on public.post_reactions (post_key, reaction_value);

drop trigger if exists trg_post_reactions_updated_at on public.post_reactions;
create trigger trg_post_reactions_updated_at
before update on public.post_reactions
for each row
execute function public.set_updated_at();

alter table public.post_reactions enable row level security;

revoke all on public.post_reactions from anon, authenticated;

create or replace function public.get_post_reaction_state(
    p_post_key text,
    p_visitor_token uuid default null
)
returns table (
    selected_reaction text,
    helpful_count bigint,
    like_count bigint,
    new_count bigint,
    total_count bigint
)
language sql
security definer
set search_path = public
as $$
    with summary as (
        select
            count(*) filter (where reaction_value = 'helpful')::bigint as helpful_count,
            count(*) filter (where reaction_value = 'like')::bigint as like_count,
            count(*) filter (where reaction_value = 'new')::bigint as new_count,
            count(*)::bigint as total_count
        from public.post_reactions
        where post_key = p_post_key
    ),
    current_reaction as (
        select reaction_value
        from public.post_reactions
        where post_key = p_post_key
          and visitor_token = p_visitor_token
        limit 1
    )
    select
        coalesce((select reaction_value from current_reaction), '') as selected_reaction,
        summary.helpful_count,
        summary.like_count,
        summary.new_count,
        summary.total_count
    from summary;
$$;

create or replace function public.submit_post_reaction(
    p_post_key text,
    p_reaction_value text,
    p_visitor_token uuid,
    p_page_path text default null,
    p_page_title text default null,
    p_branch_slug text default null
)
returns table (
    selected_reaction text,
    helpful_count bigint,
    like_count bigint,
    new_count bigint,
    total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_reaction_value text;
begin
    if coalesce(trim(p_post_key), '') = '' then
        raise exception 'post_key is required';
    end if;

    if p_visitor_token is null then
        raise exception 'visitor_token is required';
    end if;

    v_reaction_value := nullif(trim(coalesce(p_reaction_value, '')), '');

    if v_reaction_value is not null and v_reaction_value not in ('helpful', 'like', 'new') then
        raise exception 'invalid reaction value: %', v_reaction_value;
    end if;

    if v_reaction_value is null then
        delete from public.post_reactions
        where post_key = p_post_key
          and visitor_token = p_visitor_token;
    else
        insert into public.post_reactions (
            post_key,
            reaction_value,
            visitor_token,
            page_path,
            page_title,
            branch_slug
        )
        values (
            p_post_key,
            v_reaction_value,
            p_visitor_token,
            nullif(trim(coalesce(p_page_path, '')), ''),
            nullif(trim(coalesce(p_page_title, '')), ''),
            nullif(trim(coalesce(p_branch_slug, '')), '')
        )
        on conflict (post_key, visitor_token)
        do update set
            reaction_value = excluded.reaction_value,
            page_path = excluded.page_path,
            page_title = excluded.page_title,
            branch_slug = excluded.branch_slug,
            updated_at = now();
    end if;

    return query
    select *
    from public.get_post_reaction_state(p_post_key, p_visitor_token);
end;
$$;

grant execute on function public.get_post_reaction_state(text, uuid) to anon, authenticated;
grant execute on function public.submit_post_reaction(text, text, uuid, text, text, text) to anon, authenticated;
