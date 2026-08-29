---
# BARUNJARI BLOG MASTER TEMPLATE
# Production guide + reusable skeleton. Do not treat this as a rigid page mold.
layout: default
title: "[검색어를 자연스럽게 포함한 사용자 문제 중심 제목]"
description: "[검색 사용자의 문제 + 글에서 얻는 답을 1~2문장으로]"
category: "[기존 taxonomy 확인 후 선택]"
# hub_* is optional: add only when this post belongs on a purpose hub.
hub_series: "[study|interview|meeting|private-time]"
hub_section: "[core|related]"
hub_order: 1
hub_label: "[허브 카드 라벨]"
hub_kicker: "[사용 상황 한 줄]"
hub_title: "[허브용 제목]"
hub_description: "[허브 카드 설명]"
hub_tags:
  - "[핵심 용도]"
  - "[세부 용도]"
  - "[상황/지역]"
hub_footer: "[가이드 라벨]"
keywords: "[핵심 검색어],[연관 검색어],[지역 검색어],[상황 검색어]"
tags:
  - "[핵심 주제]"
  - "[사용 상황]"
  - "[연관 주제]"
  - "부천"
  - "신중동"
canonical: "https://bareunjari.com/posts/[slug]/"
permalink: "/posts/[slug]/"
date: YYYY-MM-DD HH:MM:SS +0900
og_image: "https://bareunjari.com/images/[slug].webp"
og_image_alt: "[실제 바른자리 공간 + 글의 사용 상황 ALT]"
og_image_width: 1536
og_image_height: 1024
preload_image: "images/[slug].webp"
script_version: 20260711-4
---

<!--
BARUNJARI EDITORIAL STANDARD

1. COPY가 아니라 MERGE
- 먼저 같은 검색 의도의 기존 글, 연결 허브, 현재 예약 운영 기준을 확인한다.
- 기존 글의 좋은 구조/톤을 유지하면서 새 검색 의도에 필요한 모듈만 합친다.
- 검색 의도가 겹치면 새 글을 찍어내지 말고 기존 글 강화 또는 역할 분리를 우선한다.

2. 공통 원칙
- 사용자 문제와 검색 의도로 시작한다. 바른자리를 먼저 광고하지 않는다.
- Hero는 제목 + 짧은 문제 정의 + 핵심 이동/예약 CTA로 간결하게.
- 대표 이미지는 도입 초반 한 번. 가능한 실제 바른자리 공간을 배경으로 하고, 사용 상황에 도움이 되면 사람을 자연스럽게 포함한다. WEBP 사용.
- OG / preload / 본문 이미지 / ALT를 함께 설정한다.
- 기존 공통 UI를 우선 재사용하고 글마다 새 CSS를 만들지 않는다.
- Related Guides는 키워드 나열이 아니라 독자의 다음 검색 의도로 연결한다.
- Blog <-> Hub -> /booking/ 흐름을 기본으로 하되 억지 링크는 넣지 않는다.
- 허브 썸네일은 cover 기본. 카드 순번으로 contain/padding을 강제하지 않는다.
- 가격/시간/인원/상품명은 현재 운영 기준을 확인한다. 가짜 booking_url 금지.
- 근거 없는 통계·후기·효과, 제공하지 않는 코칭/교육/중개 서비스 금지.
- 공간보다 목적 있는 시간, 방해받지 않는 개인시간의 가치를 자연스럽게 연결한다.

3. 공통 골격 vs 선택 모듈
권장 공통 골격:
Hero -> 대표 이미지 -> 핵심 답/도입 -> 문제 해결 본문 -> Related/FAQ(필요 시) -> 바른자리/예약 CTA

선택 모듈은 검색 의도에 맞을 때만 사용:
- Quick Answer 3 cards: 판단 기준이 3개로 명확할 때
- TOC: 긴 글에서 섹션 이동 가치가 있을 때
- Situation cards: 실제 사용 상황이 여러 개일 때
- 3-way comparison: 장소/상품 비교가 검색 의도일 때
- Timeline / 2~3 hour plan: 시간 사용법이 독자에게 실제 도움이 될 때
- Price/product block: 상품 선택이 핵심일 때
- Location: 지역 검색 의도가 강할 때
- Checklist: 예약 전 판단 항목이 있을 때
- FAQ: 실제 질문을 해결할 때
- Short video: 사용 시 문제 제기와 핵심 메시지 직후 한 번만

4. UI
- 카드 섹션을 연속으로 과도하게 반복하지 않는다. 카드/본문/quote/timeline을 섞어 리듬을 만든다.
- 3개 비교는 PC 한 줄 3열, 모바일 1열 우선.
- Quick Answer 카드 문장 길이를 비슷하게 맞춘다.
- TOC는 보통 5~7개 이내.
- CTA는 Hero + 의사결정 지점 + 마지막 중 필요한 곳만 사용한다.
- FAQ 답변은 반드시 .faq-answer로 감싼다.
- 모바일 첫 화면 제목/설명/CTA가 지나치게 길어지지 않게 한다.

5. 이미지 제작·발행 체크
상세 판단 기준은 knowledge-base의 `Bareunjari/Content/image-production-guide.md`를 따른다.
- [ ] 이 글의 검색 의도와 실제 사용 장면을 보여주는 전용 WEBP인가
- [ ] 실제 바른자리의 구조·크기·제공 장비를 왜곡하거나 과장하지 않았는가
- [ ] 파일은 1536×1024, 3:2이며 파일명이 slug와 일치하는가
- [ ] `og_image`, `preload_image`, 본문 대표 이미지가 같은 파일인가
- [ ] ALT가 실제 공간과 사용 상황을 구체적으로 설명하는가
- [ ] 모바일·허브 카드 cover 크롭에서 핵심 장면이 잘리지 않는가
- [ ] 개인정보, AI 문자 오류, 제공하지 않는 서비스 암시가 없는가

6. 발행 전 전체 확인
Search intent / cannibalization / title / description / canonical / tags / hub metadata / mobile UI / internal links / FAQ / current operation / booking CTA / hub thumbnail cover
-->

<main class="about-page">
  <!-- REQUIRED: HERO -->
  <section id="home"><div class="section-inner">
    <p class="section-label">[English Label]</p>
    <h1 class="section-title">[사용자 문제 중심 제목]</h1>
    <p class="section-desc">[왜 이 글을 읽어야 하는지 1~2문장]</p>
    <div class="hero-btns"><a href="#[first-section]" class="btn-primary">[핵심 답 보기]</a><a href="/booking/" class="btn-outline">이용시간·요금 확인하기</a></div>
  </div></section>

  {% include breadcrumb.html %}

  <!-- REQUIRED: TITLE IMAGE -->
  {% include post-media-carousel.html image_section_id='guide-visual' image_src='/images/[slug].webp' image_alt='[ALT]' image_width='1536' image_height='1024' image_loading='eager' image_caption='[실제 사용 장면 중심 캡션]' %}

  <!-- OPTIONAL: QUICK ANSWER -->
  <section id="quick-answer" class="guide-summary-section"><div class="section-inner">
    <p class="section-label">Quick Answer</p><h2 class="section-title">[검색 질문에 대한 빠른 답]</h2><p class="section-desc"><strong>[핵심 결론]</strong></p>
    <div class="guide-summary-grid"><article class="guide-summary-card"><span>01</span><h3>[기준 1]</h3><p>[설명]</p></article><article class="guide-summary-card"><span>02</span><h3>[기준 2]</h3><p>[설명]</p></article><article class="guide-summary-card"><span>03</span><h3>[기준 3]</h3><p>[설명]</p></article></div>
  </div></section>

  <!-- OPTIONAL: TOC. Include only sections that exist. -->
  <nav class="guide-toc" aria-label="글 목차"><div class="guide-toc-inner"><span class="guide-toc-label">이 글에서 확인할 내용</span><a href="#[id]">[목차]</a><a href="#[id]">[목차]</a><a href="#[id]">[목차]</a></div></nav>

  <!-- REQUIRED: PROBLEM / SEARCH INTENT -->
  <section id="problem"><div class="section-inner"><p class="section-label">The Problem</p><h2 class="section-title">[독자가 실제로 하는 질문]</h2><p class="section-desc">[현재 선택지와 불편]</p><p>[현실적인 판단 정보]</p><div class="about-quote"><p><strong>[핵심 메시지]</strong></p></div></div></section>

  <!-- OPTIONAL: SITUATIONS -->
  <section id="situations"><div class="section-inner"><p class="section-label">When You Need It</p><h2 class="section-title">[필요한 순간]</h2><div class="about-highlight-grid"><article class="about-highlight-card"><h3>[상황 1]</h3><p>[장면]</p></article><article class="about-highlight-card"><h3>[상황 2]</h3><p>[장면]</p></article><article class="about-highlight-card"><h3>[상황 3]</h3><p>[장면]</p></article></div></div></section>

  <!-- OPTIONAL: 3-WAY COMPARISON. Prefer shared CSS. -->
  <section id="compare"><div class="section-inner"><p class="section-label">Compare</p><h2 class="section-title">[선택 기준]</h2><div class="guide-compare-grid" aria-label="선택지 비교"><article class="guide-compare-card"><p class="guide-compare-label">Option A</p><h3>[A]</h3><ul class="guide-compare-list"><li>[적합]</li><li>[확인]</li></ul></article><article class="guide-compare-card"><p class="guide-compare-label">Option B</p><h3>[B]</h3><ul class="guide-compare-list"><li>[적합]</li><li>[확인]</li></ul></article><article class="guide-compare-card"><p class="guide-compare-label">Option C</p><h3>[C]</h3><ul class="guide-compare-list"><li>[적합]</li><li>[확인]</li></ul></article></div><div class="about-quote"><p><strong>[비교 결론]</strong></p></div></div></section>

  <!-- OPTIONAL: HOW TO USE / TIMELINE. Choose the UI that fits the content. -->
  <section id="use-cases"><div class="section-inner"><p class="section-label">How to Use</p><h2 class="section-title">[구체적 사용법]</h2><div class="about-principle-grid"><article class="about-principle-item" data-step="01"><h3>[단계/상황]</h3><p>[행동]</p></article><article class="about-principle-item" data-step="02"><h3>[단계/상황]</h3><p>[행동]</p></article><article class="about-principle-item" data-step="03"><h3>[단계/상황]</h3><p>[행동]</p></article></div></div></section>

  <!-- OPTIONAL: TIME / PRODUCT. Verify current operation. -->
  <section id="time-guide"><div class="section-inner"><p class="section-label">Time Guide</p><h2 class="section-title">[시간 선택 이유]</h2><p class="section-desc">[실제 시간 흐름]</p><div class="about-highlight-grid"><article class="about-highlight-card"><h3>[시간/상품 1]</h3><p>[추천 상황]</p></article><article class="about-highlight-card"><h3>[시간/상품 2]</h3><p>[추천 상황]</p></article></div><div class="hero-btns"><a href="/booking/" class="btn-primary">이용시간·요금 확인하기</a></div></div></section>

  <!-- OPTIONAL: LOCATION -->
  <section id="location"><div class="section-inner"><p class="section-label">Location</p><h2 class="section-title">[지역 의도 제목]</h2><p class="section-desc">[접근성이 중요한 이유]</p><p>[확인된 위치 정보 + 상황]</p></div></section>

  <!-- OPTIONAL: CHECKLIST -->
  <section id="checklist"><div class="section-inner"><p class="section-label">Checklist</p><h2 class="section-title">[선택 전 확인]</h2><div class="about-highlight-grid"><article class="about-highlight-card"><h3>[체크 1]</h3><p>[설명]</p></article><article class="about-highlight-card"><h3>[체크 2]</h3><p>[설명]</p></article><article class="about-highlight-card"><h3>[체크 3]</h3><p>[설명]</p></article></div></div></section>

  <!-- RECOMMENDED: RELATED GUIDES. Link by next intent. -->
  <section id="related-guides"><div class="section-inner"><p class="section-label">Related Guides</p><h2 class="section-title">상황에 따라 이어서 보세요</h2><div class="about-highlight-grid"><article class="about-highlight-card"><h3>[다음 의도 1]</h3><p>[연결 이유]</p><p><a href="/posts/[related-1]/">관련 글 보기 →</a></p></article><article class="about-highlight-card"><h3>[다음 의도 2]</h3><p>[연결 이유]</p><p><a href="/posts/[related-2]/">관련 글 보기 →</a></p></article><article class="about-highlight-card"><h3>[목적 허브]</h3><p>[다음 단계]</p><p><a href="/[hub]/">가이드 모아보기 →</a></p></article></div></div></section>

  <!-- OPTIONAL/RECOMMENDED: FAQ -->
  <section id="faq"><div class="section-inner"><p class="section-label">FAQ</p><h2 class="section-title">[주제] FAQ</h2><div class="faq-list"><details class="faq-item"><summary>[질문 1]</summary><div class="faq-answer"><p>[답변]</p></div></details><details class="faq-item"><summary>[질문 2]</summary><div class="faq-answer"><p>[답변]</p></div></details><details class="faq-item"><summary>[질문 3]</summary><div class="faq-answer"><p>[답변]</p></div></details></div></div></section>

  <!-- REQUIRED: BRAND / CONVERSION CLOSE -->
  <section id="bareunjari" class="about-cta-section"><div class="section-inner"><p class="section-label">Bareunjari</p><h2 class="section-title">[본문 문제와 연결된 예약 이유]</h2><p class="section-desc">[공간보다 목적 있는 시간을 확보하는 선택지로 설명]</p><div class="about-quote"><p><strong>[개인시간/집중/함께 준비하는 시간 메시지]</strong></p></div><div class="hero-btns"><a href="/[hub]/" class="btn-outline">관련 가이드 더 보기</a><a href="/booking/" class="btn-primary">이용시간·요금 확인하기</a></div></div></section>
</main>
