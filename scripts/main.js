    const toTopButton = document.getElementById('toTop');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const galleryOpenButtons = document.querySelectorAll('.gallery-open');
    const galleryItems = Array.from(galleryOpenButtons);
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    const navSectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const useCasesGrid = document.getElementById('useCasesGrid');
    const rssStatus = document.getElementById('rssStatus');
    const useCaseControls = document.getElementById('useCaseControls');
    const useCasePrev = document.getElementById('useCasePrev');
    const useCaseNext = document.getElementById('useCaseNext');
    const useCasePageInfo = document.getElementById('useCasePageInfo');
    const contactForm = document.getElementById('contactForm');
    const contactRateNote = document.getElementById('contactRateNote');
    const contactSubmitStatus = document.getElementById('contactSubmitStatus');
    const policyDisclosure = document.querySelector('.policy-disclosure');
    const videoInterviewToggle = document.getElementById('videoInterviewToggle');
    const videoInterviewPanel = document.getElementById('videoInterviewPanel');
    const privateOfficeToggle = document.getElementById('privateOfficeToggle');
    const privateOfficePanel = document.getElementById('privateOfficePanel');
    const popupExhibitToggle = document.getElementById('popupExhibitToggle');
    const popupExhibitPanel = document.getElementById('popupExhibitPanel');
    const mobileStickyCta = document.getElementById('mobileStickyCta');
    const promoCountdown = document.getElementById('promoCountdown');
    const promoInlineCountdown = document.getElementById('promoInlineCountdown');
    let scrollLockTop = 0;
    let currentGalleryIndex = -1;
    let useCaseItems = [];
    let useCasePage = 0;

    const toggleToTopButton = () => {
      const shouldShow = window.scrollY > 260;
      toTopButton.classList.toggle('show', shouldShow);
    };

    const trackEvent = (eventName, params = {}) => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
      }
    };

    const updatePromoCountdown = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const promoEnd = new Date(2026, 6, 20);
      const diffDays = Math.floor((promoEnd - today) / (1000 * 60 * 60 * 24));

      let ddayText = '특가 종료';
      if (diffDays > 0) {
        ddayText = `D-${diffDays}`;
      } else if (diffDays === 0) {
        ddayText = 'D-Day';
      }

      if (promoCountdown) {
        promoCountdown.textContent = ddayText;
      }
      if (promoInlineCountdown) {
        promoInlineCountdown.textContent = ddayText;
      }
    };

    const setupMobileCtaVariant = () => {
      if (!mobileStickyCta) {
        return;
      }

      const STORAGE_KEY = 'bareunjari-mobile-cta-variant';
      const variants = {
        A: '지금 예약하기 · 2시간 1만원',
        B: '오늘 가능한 시간 바로 예약'
      };

      let variant = localStorage.getItem(STORAGE_KEY);
      if (!variant || !variants[variant]) {
        variant = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem(STORAGE_KEY, variant);
      }

      mobileStickyCta.textContent = variants[variant];
      mobileStickyCta.dataset.ctaVariant = variant;
      trackEvent('assign_mobile_cta_variant', { variant });
    };

    const openLightbox = (src, alt) => {
      if (!lightbox.classList.contains('open')) {
        scrollLockTop = window.scrollY;
        document.body.style.top = `-${scrollLockTop}px`;
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      }
      lightboxImage.src = src;
      lightboxImage.alt = alt || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      lightboxClose.focus();
    };

    const openLightboxByIndex = (index) => {
      if (!galleryItems.length) {
        return;
      }
      const normalizedIndex = (index + galleryItems.length) % galleryItems.length;
      currentGalleryIndex = normalizedIndex;
      const button = galleryItems[normalizedIndex];
      openLightbox(button.dataset.src, button.dataset.alt);
    };

    const showPrevImage = () => {
      if (!galleryItems.length || !lightbox.classList.contains('open')) {
        return;
      }
      openLightboxByIndex(currentGalleryIndex - 1);
    };

    const showNextImage = () => {
      if (!galleryItems.length || !lightbox.classList.contains('open')) {
        return;
      }
      openLightboxByIndex(currentGalleryIndex + 1);
    };

    const closeLightbox = () => {
      if (!lightbox.classList.contains('open')) {
        return;
      }
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImage.src = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollLockTop);
    };

    galleryOpenButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        openLightboxByIndex(index);
      });
    });

    const closeMobileMenu = () => {
      if (!navLinks || !navToggle) {
        return;
      }
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', '메뉴 열기');
    };

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
      });
    }

    navSectionLinks.forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    document.querySelectorAll('a[href*="booking.naver.com/booking/10/bizes/1663159"]').forEach((link) => {
      link.addEventListener('click', () => {
        const section = link.closest('section')?.id || (link.closest('header') ? 'header' : 'global');
        const ctaLabel = link.dataset.cta || (link.textContent || '').trim();
        trackEvent('click_booking_cta', {
          cta_label: ctaLabel,
          cta_variant: link.dataset.ctaVariant || 'default',
          placement: section,
          destination: 'naver_booking'
        });
      });
    });

    document.querySelectorAll('a[href*="talk.naver.com/profile/"]').forEach((link) => {
      link.addEventListener('click', () => {
        trackEvent('click_talk_cta', {
          cta_label: link.dataset.cta || (link.textContent || '').trim(),
          placement: link.closest('section')?.id || 'global'
        });
      });
    });

    if (policyDisclosure) {
      policyDisclosure.addEventListener('toggle', () => {
        trackEvent('toggle_policy_disclosure', {
          placement: 'about',
          state: policyDisclosure.open ? 'open' : 'close'
        });
      });
    }

    const setupFeatureToggle = (toggleEl, panelEl, eventName) => {
      if (!toggleEl || !panelEl) {
        return;
      }

      const togglePanel = () => {
        const isOpen = toggleEl.getAttribute('aria-expanded') === 'true';
        const nextState = !isOpen;
        toggleEl.setAttribute('aria-expanded', String(nextState));
        panelEl.hidden = !nextState;

        if (nextState) {
          panelEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        trackEvent(eventName, {
          placement: 'space',
          state: nextState ? 'open' : 'close'
        });
      };

      toggleEl.addEventListener('click', togglePanel);
      toggleEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          togglePanel();
        }
      });
    };

    setupFeatureToggle(videoInterviewToggle, videoInterviewPanel, 'toggle_video_interview_panel');
    setupFeatureToggle(privateOfficeToggle, privateOfficePanel, 'toggle_private_office_panel');
    setupFeatureToggle(popupExhibitToggle, popupExhibitPanel, 'toggle_popup_exhibit_panel');

    lightboxBackdrop.addEventListener('click', closeLightbox);
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevImage);
    lightboxNext.addEventListener('click', showNextImage);
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeLightbox();
        return;
      }
      if (!lightbox.classList.contains('open')) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrevImage();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNextImage();
      }
    });

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return '발행일 정보 없음';
      }
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(date);
    };

    const stripHtml = (html) => {
      const temp = document.createElement('div');
      temp.innerHTML = html || '';
      return (temp.textContent || temp.innerText || '').replace(/\s+/g, ' ').trim();
    };

    const truncate = (text, maxLength) => {
      if (!text || text.length <= maxLength) {
        return text;
      }
      return `${text.slice(0, maxLength).trim()}...`;
    };

    const escapeHtml = (text) => {
      return (text || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    };

    const classifyUseCaseType = (item) => {
      const title = item.title || '';
      const desc = stripHtml(item.description);

      const isGuide = /이용\s*안내|이용\s*방법|사용\s*방법|활용\s*방법|가이드/i.test(title)
        || /이용\s*안내|이용\s*방법|사용\s*방법|가이드/i.test(desc);
      const isCase = /이용\s*사례|공간\s*이용\s*사례/i.test(title)
        || /이용\s*사례/i.test(desc);

      if (isGuide && !isCase) {
        return '이용안내';
      }
      if (isCase) {
        return '이용사례';
      }
      return '이용정보';
    };

    const renderUseCases = (items) => {
      const cardsHtml = items.map((item) => {
        const title = item.title || '제목 없음';
        const summary = truncate(stripHtml(item.description), 150) || '내용 요약이 없습니다.';
        const date = formatDate(item.pubDate);
        const link = item.link || '#';
        const contentType = item.contentType || classifyUseCaseType(item);
        const badgeLabel = contentType === '이용안내' ? 'Guide' : 'Case';

        return `
          <article class="testimonial-card">
            <div class="stars">${escapeHtml(badgeLabel)}</div>
            <h3 class="testimonial-title"><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>
            <p>${escapeHtml(summary)}</p>
            <span class="author">— 네이버 블로그 ${escapeHtml(contentType)}</span>
            <p class="testimonial-meta">${escapeHtml(date)}</p>
          </article>
        `;
      }).join('');

      useCasesGrid.innerHTML = cardsHtml;
      if (rssStatus) {
        rssStatus.hidden = true;
      }
    };

    const getUseCasePageSize = () => {
      if (window.innerWidth < 760) {
        return 1;
      }
      if (window.innerWidth < 1040) {
        return 2;
      }
      return 3;
    };

    const updateUseCaseControls = () => {
      if (!useCaseControls || !useCasePrev || !useCaseNext || !useCasePageInfo) {
        return;
      }

      const pageSize = getUseCasePageSize();
      const totalPages = Math.max(1, Math.ceil(useCaseItems.length / pageSize));

      if (useCaseItems.length <= pageSize) {
        useCaseControls.hidden = true;
        return;
      }

      useCaseControls.hidden = false;
      useCasePrev.disabled = useCasePage <= 0;
      useCaseNext.disabled = useCasePage >= totalPages - 1;
      useCasePageInfo.textContent = `${useCasePage + 1} / ${totalPages}`;
    };

    const renderUseCasePage = () => {
      if (!useCaseItems.length) {
        return;
      }

      const pageSize = getUseCasePageSize();
      const totalPages = Math.max(1, Math.ceil(useCaseItems.length / pageSize));
      if (useCasePage >= totalPages) {
        useCasePage = totalPages - 1;
      }

      const start = useCasePage * pageSize;
      const end = start + pageSize;
      renderUseCases(useCaseItems.slice(start, end));
      updateUseCaseControls();
    };

    const fetchWithTimeout = async (url, timeoutMs = 12000) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
        return response;
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    const parseXmlItems = (xmlText) => {
      const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
      const nodeList = Array.from(xml.querySelectorAll('item'));
      return nodeList.map((item) => ({
        title: item.querySelector('title')?.textContent?.trim() || '',
        description: item.querySelector('description')?.textContent || '',
        link: item.querySelector('link')?.textContent?.trim() || '',
        pubDate: item.querySelector('pubDate')?.textContent?.trim() || ''
      }));
    };

    const fetchRssItems = async (rssUrl) => {
      const sources = [
        {
          type: 'rss2json',
          url: `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
        },
        {
          type: 'json-xml',
          url: `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`
        }
      ];

      for (const source of sources) {
        try {
          const response = await fetchWithTimeout(source.url);
          if (!response.ok) {
            continue;
          }

          if (source.type === 'json-xml') {
            const payload = await response.json();
            const xmlText = payload?.contents || '';
            if (!xmlText) {
              continue;
            }
            const items = parseXmlItems(xmlText);
            if (items.length > 0) {
              return items;
            }
            continue;
          }

          const payload = await response.json();
          const items = Array.isArray(payload?.items)
            ? payload.items.map((item) => ({
                title: item?.title || '',
                description: item?.description || '',
                link: item?.link || '',
                pubDate: item?.pubDate || ''
              }))
            : [];

          if (items.length > 0) {
            return items;
          }
        } catch (error) {
          // Try the next source.
        }
      }

      return [];
    };

    const loadUseCasesFromRss = async () => {
      if (!useCasesGrid) {
        return;
      }

      const rssUrl = 'https://rss.blog.naver.com/bareunjari114.xml';
      const titlePatterns = [
        /이용\s*사례/i,
        /공간\s*이용\s*사례/i,
        /이용\s*안내/i,
        /이용\s*방법/i,
        /사용\s*방법/i,
        /활용\s*방법/i,
        /가이드/i
      ];
      const bodyPatterns = [
        /이용\s*사례/i,
        /이용\s*안내/i,
        /이용\s*방법/i,
        /공간\s*활용/i,
        /준비\s*방법/i,
        /가이드/i
      ];

      try {
        if (rssStatus) {
          rssStatus.textContent = '최신 이용사례를 불러오는 중입니다.';
          rssStatus.hidden = false;
        }

        const parsed = await fetchRssItems(rssUrl);
        if (parsed.length === 0) {
          throw new Error('RSS 데이터 없음');
        }

        const filtered = parsed
          .map((item) => {
            const cleanDesc = stripHtml(item.description);
            const titleScore = titlePatterns.some((pattern) => pattern.test(item.title)) ? 2 : 0;
            const bodyScore = bodyPatterns.some((pattern) => pattern.test(cleanDesc)) ? 1 : 0;
            return {
              ...item,
              contentType: classifyUseCaseType(item),
              score: titleScore + bodyScore
            };
          })
          .filter((item) => item.score > 0)
          .sort((a, b) => {
            const aTime = new Date(a.pubDate).getTime() || 0;
            const bTime = new Date(b.pubDate).getTime() || 0;
            if (bTime !== aTime) {
              return bTime - aTime;
            }
            return b.score - a.score;
          });

        const selected = filtered.slice(0, 3);
        if (selected.length > 0) {
          useCaseItems = filtered.slice(0, 18);
          useCasePage = 0;
          renderUseCasePage();
        } else if (rssStatus) {
          rssStatus.textContent = '이용사례 · 이용안내 글을 준비 중입니다.';
          rssStatus.hidden = false;
          if (useCaseControls) {
            useCaseControls.hidden = true;
          }
        }
      } catch (error) {
        if (rssStatus) {
          rssStatus.textContent = '최신 이용사례를 준비 중입니다.';
          rssStatus.hidden = false;
        }
        if (useCaseControls) {
          useCaseControls.hidden = true;
        }
      }
    };

    if (useCasePrev && useCaseNext) {
      useCasePrev.addEventListener('click', () => {
        if (useCasePage > 0) {
          useCasePage -= 1;
          renderUseCasePage();
        }
      });

      useCaseNext.addEventListener('click', () => {
        const pageSize = getUseCasePageSize();
        const totalPages = Math.max(1, Math.ceil(useCaseItems.length / pageSize));
        if (useCasePage < totalPages - 1) {
          useCasePage += 1;
          renderUseCasePage();
        }
      });
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth > 640) {
        closeMobileMenu();
      }
      if (useCaseItems.length > 0) {
        useCasePage = 0;
        renderUseCasePage();
      }
    });

    const updateActiveNavLink = () => {
      if (!navSectionLinks.length) {
        return;
      }

      const offsetTop = window.scrollY + 130;
      let activeId = '';

      navSectionLinks.forEach((link) => {
        const sectionId = link.getAttribute('href');
        const section = sectionId ? document.querySelector(sectionId) : null;
        if (!section) {
          return;
        }
        if (section.offsetTop <= offsetTop) {
          activeId = sectionId;
        }
      });

      navSectionLinks.forEach((link) => {
        if (link.getAttribute('href') === activeId) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    if (contactForm) {
      const CONTACT_LIMIT_MS = 90 * 1000;
      const CONTACT_LAST_SUBMIT_KEY = 'bareunjari-contact-last-submit';
      const contactParams = new URLSearchParams(window.location.search);

      if (contactParams.get('contact') === 'sent' && contactSubmitStatus) {
        contactSubmitStatus.hidden = false;
        contactSubmitStatus.classList.add('success');
        contactSubmitStatus.textContent = '문의가 정상 접수되었습니다. 확인 후 빠르게 연락드릴게요.';
        contactForm.reset();
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash || '#contact'}`);
      }

      contactForm.addEventListener('submit', (event) => {
        const lastSubmit = Number(localStorage.getItem(CONTACT_LAST_SUBMIT_KEY) || 0);
        const now = Date.now();
        const remaining = CONTACT_LIMIT_MS - (now - lastSubmit);

        if (contactSubmitStatus) {
          contactSubmitStatus.hidden = true;
          contactSubmitStatus.classList.remove('success');
          contactSubmitStatus.textContent = '';
        }

        if (remaining > 0) {
          event.preventDefault();
          const seconds = Math.ceil(remaining / 1000);
          if (contactRateNote) {
            contactRateNote.textContent = `잠시 후 다시 시도해 주세요. 약 ${seconds}초 후 제출 가능합니다.`;
          }
          if (contactSubmitStatus) {
            contactSubmitStatus.hidden = false;
            contactSubmitStatus.textContent = '연속 전송을 방지하고 있어요. 잠시 후 다시 시도해 주세요.';
          }
          return;
        }

        localStorage.setItem(CONTACT_LAST_SUBMIT_KEY, String(now));
        trackEvent('submit_contact_form', { form_name: 'contact_form' });
        if (contactRateNote) {
          contactRateNote.textContent = '문의를 전송 중입니다.';
        }
        if (contactSubmitStatus) {
          contactSubmitStatus.hidden = false;
          contactSubmitStatus.textContent = '전송 중입니다. 완료 후 이 영역에 접수 결과가 표시됩니다.';
        }
      });
    }

    window.addEventListener('scroll', toggleToTopButton, { passive: true });
    window.addEventListener('scroll', updateActiveNavLink, { passive: true });
    toTopButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    toggleToTopButton();
    updateActiveNavLink();
    updatePromoCountdown();
    setupMobileCtaVariant();
    loadUseCasesFromRss();
