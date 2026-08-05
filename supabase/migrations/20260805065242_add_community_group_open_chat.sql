alter table public.community_groups
add column if not exists open_chat_url text;

grant update (open_chat_url) on public.community_groups to authenticated;
