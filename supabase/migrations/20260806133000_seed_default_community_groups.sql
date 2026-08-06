insert into public.community_groups (
    group_key,
    title,
    description,
    status,
    schedule_text,
    capacity
)
select
    seed.group_key,
    seed.title,
    seed.description,
    'draft' as status,
    null as schedule_text,
    null as capacity
from (
    values
        (
            'interview',
            '면접 준비 모임',
            '자기소개와 답변을 같이 다듬고, 서로 피드백받으며 실전 감각을 키우는 모임입니다.'
        ),
        (
            'reading',
            '책 읽고 이야기 나누는 모임',
            '책을 읽고 핵심 문장과 느낀 점을 나누며, 부담 없이 꾸준히 이어가는 모임입니다.'
        ),
        (
            'ai',
            'AI 같이 써보는 모임',
            '업무, 공부, 글쓰기처럼 각자 필요한 상황에서 AI를 써보고, 실용적인 방법을 함께 나누는 모임입니다.'
        )
) as seed(group_key, title, description)
where not exists (
    select 1
    from public.community_groups existing
    where existing.group_key = seed.group_key
      and existing.title = seed.title
);
