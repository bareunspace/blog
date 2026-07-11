    const toTopButton = document.getElementById('toTop');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const galleryTrack = document.getElementById('galleryTrack');
    const galleryLoadMore = document.getElementById('galleryLoadMore');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    const navSectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const useCasesGrid = document.getElementById('useCasesGrid');
    const naverBlogFallbackData = document.getElementById('naverBlogFallbackData');
    const rssStatus = document.getElementById('rssStatus');
    const useCaseControls = document.getElementById('useCaseControls');
    const useCasePrev = document.getElementById('useCasePrev');
    const useCaseNext = document.getElementById('useCaseNext');
    const useCasePageInfo = document.getElementById('useCasePageInfo');
    const contactForm = document.getElementById('contactForm');
    const contactRateNote = document.getElementById('contactRateNote');
    const contactSubmitStatus = document.getElementById('contactSubmitStatus');
    const contactInquiryType = document.getElementById('contactInquiryType');
    const contactBranchInput = document.getElementById('contactBranch');
    const contactBranchSlugInput = document.getElementById('contactBranchSlug');
    const policyDisclosure = document.querySelector('.policy-disclosure');
    const contactFaqItems = document.querySelectorAll('.contact-faq details');
    const videoInterviewToggle = document.getElementById('videoInterviewToggle');
    const videoInterviewPanel = document.getElementById('videoInterviewPanel');
    const onlineExamToggle = document.getElementById('onlineExamToggle');
    const onlineExamPanel = document.getElementById('onlineExamPanel');
    const privateOfficeToggle = document.getElementById('privateOfficeToggle');
    const privateOfficePanel = document.getElementById('privateOfficePanel');
    const consultingMeetupToggle = document.getElementById('consultingMeetupToggle');
    const consultingMeetupPanel = document.getElementById('consultingMeetupPanel');
    const popupExhibitToggle = document.getElementById('popupExhibitToggle');
    const popupExhibitPanel = document.getElementById('popupExhibitPanel');
    const soloRestToggle = document.getElementById('soloRestToggle');
    const soloRestPanel = document.getElementById('soloRestPanel');
    const featureDetailStack = document.getElementById('featureDetailStack');
    const spaceSectionInner = document.querySelector('#space .section-inner');
    const featureCardsGrid = document.querySelector('#space .features-grid');
    const mobileStickyCta = document.getElementById('mobileStickyCta');
    const promoCountdown = document.getElementById('promoCountdown');
    const promoInlineCountdown = document.getElementById('promoInlineCountdown');
    const FEATURE_PANEL_ANIM_MS = 150;
    const GALLERY_INITIAL_VISIBLE = 6;
    const GALLERY_LOAD_STEP = 6;
    let scrollLockTop = 0;
    let currentGalleryIndex = -1;
    let useCaseItems = [];
    let useCasePage = 0;
    let featurePanelCleanupTimer = 0;
    let galleryVisibleCount = GALLERY_INITIAL_VISIBLE;
    let refreshGalleryItemsVisibility = () => {};

    const getGalleryItems = () => {
      return Array.from(document.querySelectorAll('.gallery-open'));
    };

    const readBranchContext = () => {
      const fallback = { slug: 'bucheon-sinjungdong', name: '바른자리 신중동점' };
      const configNode = document.getElementById('branchSiteConfig');
      if (!configNode) {
        return fallback;
      }

      try {
        const parsed = JSON.parse(configNode.textContent || '{}');
        const active = parsed?.activeBranch || {};
        return {
          slug: active.slug || fallback.slug,
          name: active.name || fallback.name
        };
      } catch (error) {
        return fallback;
      }
    };

    const branchContext = readBranchContext();
    const withBranchContext = (params = {}) => {
      return {
        ...params,
        branch_slug: branchContext.slug
      };
    };

    if (contactBranchInput) {
      contactBranchInput.value = branchContext.name;
    }
    if (contactBranchSlugInput) {
      contactBranchSlugInput.value = branchContext.slug;
    }

    const toggleToTopButton = () => {
      const shouldShow = window.scrollY > 260;
      toTopButton.classList.toggle('show', shouldShow);
    };

    const trackEvent = (eventName, params = {}) => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
      }
    };

    const trackMetaEvent = (eventName, params = {}) => {
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', eventName, params);
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
      trackEvent('assign_mobile_cta_variant', withBranchContext({ variant }));
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
      const galleryItems = getGalleryItems();
      if (!galleryItems.length) {
        return;
      }
      const normalizedIndex = (index + galleryItems.length) % galleryItems.length;
      currentGalleryIndex = normalizedIndex;
      const button = galleryItems[normalizedIndex];
      openLightbox(button.dataset.src, button.dataset.alt);
    };

    const showPrevImage = () => {
      const galleryItems = getGalleryItems();
      if (!galleryItems.length || !lightbox.classList.contains('open')) {
        return;
      }
      openLightboxByIndex(currentGalleryIndex - 1);
    };

    const showNextImage = () => {
      const galleryItems = getGalleryItems();
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

    const bindGalleryOpenButtons = (scope) => {
      const root = scope || document;
      const buttons = Array.from(root.querySelectorAll('.gallery-open'));
      buttons.forEach((button) => {
        if (button.dataset.galleryBound === 'true') {
          return;
        }

        button.dataset.galleryBound = 'true';
        button.addEventListener('click', () => {
          const galleryItems = getGalleryItems();
          const index = galleryItems.indexOf(button);
          if (index >= 0) {
            openLightboxByIndex(index);
          }
        });
      });
    };

    const attachGalleryImageFallback = (scope) => {
      const root = scope || document;
      const images = Array.from(root.querySelectorAll('.gallery-item img'));

      images.forEach((img) => {
        if (img.dataset.galleryFallbackBound === 'true') {
          return;
        }

        img.dataset.galleryFallbackBound = 'true';
        img.addEventListener('error', () => {
          const originalSrc = img.dataset.originalSrc || '';
          const proxySrc = img.dataset.proxySrc || '';

          if (img.dataset.proxyAttempted !== 'true' && proxySrc && img.src !== proxySrc) {
            img.dataset.proxyAttempted = 'true';
            img.src = proxySrc;
            return;
          }

          if (img.dataset.originalAttempted !== 'true' && originalSrc && img.src !== originalSrc) {
            img.dataset.originalAttempted = 'true';
            img.src = originalSrc;
            return;
          }

          if (img.dataset.fallbackApplied === 'true') {
            return;
          }

          img.dataset.fallbackApplied = 'true';
          img.src = 'images/main.webp';
        });
      });
    };

    bindGalleryOpenButtons();
    attachGalleryImageFallback();

    const setupGalleryLoadMore = () => {
      if (!galleryTrack || !galleryLoadMore) {
        return;
      }

      const initialItems = Array.from(galleryTrack.querySelectorAll('.gallery-item'));
      if (!initialItems.length) {
        galleryLoadMore.hidden = true;
        return;
      }

      galleryVisibleCount = Math.min(GALLERY_INITIAL_VISIBLE, initialItems.length);

      const renderGalleryItems = () => {
        const items = Array.from(galleryTrack.querySelectorAll('.gallery-item'));
        if (!items.length) {
          galleryLoadMore.hidden = true;
          galleryLoadMore.disabled = true;
          return;
        }

        galleryVisibleCount = Math.min(galleryVisibleCount, items.length);

        items.forEach((item, index) => {
          item.classList.toggle('is-hidden', index >= galleryVisibleCount);
        });

        const isDone = galleryVisibleCount >= items.length;
        galleryLoadMore.hidden = isDone;
        galleryLoadMore.disabled = isDone;
      };

      refreshGalleryItemsVisibility = renderGalleryItems;

      galleryLoadMore.addEventListener('click', () => {
        const totalItems = galleryTrack.querySelectorAll('.gallery-item').length;
        galleryVisibleCount = Math.min(totalItems, galleryVisibleCount + GALLERY_LOAD_STEP);
        renderGalleryItems();
        trackEvent('click_gallery_load_more', withBranchContext({
          placement: 'gallery',
          visible_count: galleryVisibleCount,
          total_count: totalItems
        }));
      });

      renderGalleryItems();
    };

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
        const payload = withBranchContext({
          cta_label: ctaLabel,
          cta_variant: link.dataset.ctaVariant || 'default',
          placement: section,
          destination: 'naver_booking'
        });
        trackEvent('click_booking_cta', payload);
        trackMetaEvent('click_booking_cta', payload);
      });
    });

    document.querySelectorAll('a[href*="talk.naver.com/profile/"]').forEach((link) => {
      link.addEventListener('click', () => {
        const payload = withBranchContext({
          cta_label: link.dataset.cta || (link.textContent || '').trim(),
          placement: link.closest('section')?.id || 'global'
        });
        trackEvent('click_talk_cta', payload);
        trackMetaEvent('click_talk_cta', payload);
      });
    });

    if (policyDisclosure) {
      policyDisclosure.addEventListener('toggle', () => {
        trackEvent('toggle_policy_disclosure', withBranchContext({
          placement: 'about',
          state: policyDisclosure.open ? 'open' : 'close'
        }));
      });
    }

    contactFaqItems.forEach((faqItem) => {
      faqItem.addEventListener('toggle', () => {
        const question = faqItem.querySelector('summary')?.textContent?.trim() || 'faq';
        trackEvent('toggle_contact_faq', withBranchContext({
          placement: 'contact',
          question,
          state: faqItem.open ? 'open' : 'close'
        }));
      });
    });

    const setFeaturePanelState = (toggleEl, panelEl, isOpen, options = {}) => {
      if (!toggleEl || !panelEl) {
        return;
      }

      const { immediate = false } = options;
      toggleEl.setAttribute('aria-expanded', String(isOpen));

      if (isOpen) {
        panelEl.hidden = false;
        panelEl.classList.remove('is-closing');
        requestAnimationFrame(() => {
          panelEl.classList.add('is-open');
        });
        return;
      }

      panelEl.classList.remove('is-open');
      panelEl.classList.add('is-closing');

      if (immediate) {
        panelEl.hidden = true;
        panelEl.classList.remove('is-closing');
        return;
      }

      window.setTimeout(() => {
        if (toggleEl.getAttribute('aria-expanded') === 'true') {
          return;
        }
        panelEl.hidden = true;
        panelEl.classList.remove('is-closing');
      }, FEATURE_PANEL_ANIM_MS);
    };

    const featurePanelPairs = [
      { toggle: videoInterviewToggle, panel: videoInterviewPanel, eventName: 'toggle_video_interview_panel' },
      { toggle: onlineExamToggle, panel: onlineExamPanel, eventName: 'toggle_online_exam_panel' },
      { toggle: privateOfficeToggle, panel: privateOfficePanel, eventName: 'toggle_private_office_panel' },
      { toggle: consultingMeetupToggle, panel: consultingMeetupPanel, eventName: 'toggle_consulting_meetup_panel' },
      { toggle: popupExhibitToggle, panel: popupExhibitPanel, eventName: 'toggle_popup_exhibit_panel' },
      { toggle: soloRestToggle, panel: soloRestPanel, eventName: 'toggle_solo_rest_panel' }
    ];

    const mountFeaturePanels = () => {
      if (!featureDetailStack) {
        return;
      }

      if (spaceSectionInner && !spaceSectionInner.dataset.basePaddingBottom) {
        const currentPadding = window.getComputedStyle(spaceSectionInner).paddingBottom || '0';
        spaceSectionInner.dataset.basePaddingBottom = String(parseFloat(currentPadding) || 0);
      }

      featureDetailStack.style.display = 'none';

      featurePanelPairs.forEach(({ panel }) => {
        if (panel) {
          panel.classList.remove('is-open', 'is-closing');
          featureDetailStack.appendChild(panel);
        }
      });
    };

    const reserveFeaturePanelSpace = (panelTop, panelEl) => {
      if (!spaceSectionInner || !featureCardsGrid || !panelEl) {
        return;
      }

      const basePadding = Number(spaceSectionInner.dataset.basePaddingBottom || 0);
      const gridBottom = featureCardsGrid.offsetTop + featureCardsGrid.offsetHeight;
      const panelBottom = panelTop + panelEl.offsetHeight;
      const extra = Math.max(0, panelBottom - gridBottom + 16);
      spaceSectionInner.style.paddingBottom = `${basePadding + extra}px`;
    };

    const resetFeaturePanelSpace = () => {
      if (!spaceSectionInner) {
        return;
      }

      const basePadding = Number(spaceSectionInner.dataset.basePaddingBottom || 0);
      spaceSectionInner.style.paddingBottom = `${basePadding}px`;
    };

    const positionFeaturePanel = (toggleEl, panelEl) => {
      if (!featureDetailStack || !spaceSectionInner || !toggleEl || !panelEl) {
        return;
      }

      const innerRect = spaceSectionInner.getBoundingClientRect();
      const toggleRect = toggleEl.getBoundingClientRect();
      const panelTop = Math.max(0, toggleRect.bottom - innerRect.top + 10);

      featureDetailStack.style.top = `${panelTop}px`;
      featureDetailStack.style.display = 'block';

      requestAnimationFrame(() => {
        reserveFeaturePanelSpace(panelTop, panelEl);
      });
    };

    const isAnyFeaturePanelOpen = () => {
      return featurePanelPairs.some(({ toggle, panel }) => {
        return Boolean(toggle && panel && toggle.getAttribute('aria-expanded') === 'true' && !panel.hidden);
      });
    };

    const closeFeaturePanels = (options = {}) => {
      const { immediate = false } = options;

      window.clearTimeout(featurePanelCleanupTimer);

      featurePanelPairs.forEach(({ toggle, panel }) => {
        setFeaturePanelState(toggle, panel, false, { immediate });
      });

      const finalizeClose = () => {
        if (isAnyFeaturePanelOpen()) {
          return;
        }
        if (featureDetailStack) {
          featureDetailStack.style.display = 'none';
        }
        resetFeaturePanelSpace();
      };

      if (immediate) {
        finalizeClose();
        return;
      }

      featurePanelCleanupTimer = window.setTimeout(finalizeClose, FEATURE_PANEL_ANIM_MS);
    };

    const focusFeaturePanelHeading = (panelEl) => {
      if (!panelEl) {
        return;
      }

      const firstHeading = panelEl.querySelector('h3');
      if (!firstHeading) {
        return;
      }

      if (!firstHeading.hasAttribute('tabindex')) {
        firstHeading.setAttribute('tabindex', '-1');
      }

      firstHeading.focus({ preventScroll: true });
    };

    const scrollFeaturePanelIntoView = (toggleEl) => {
      if (!toggleEl) {
        return;
      }

      const headerOffset = 76;
      const top = window.scrollY + toggleEl.getBoundingClientRect().top - headerOffset;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    };

    const openFeaturePanel = (toggleEl, panelEl) => {
      closeFeaturePanels({ immediate: true });

      setFeaturePanelState(toggleEl, panelEl, true);
      positionFeaturePanel(toggleEl, panelEl);
      focusFeaturePanelHeading(panelEl);

      requestAnimationFrame(() => {
        scrollFeaturePanelIntoView(toggleEl);
      });
    };

    const setupFeatureToggle = (toggleEl, panelEl, eventName, allPairs) => {
      if (!toggleEl || !panelEl) {
        return;
      }

      const togglePanel = () => {
        const isOpen = toggleEl.getAttribute('aria-expanded') === 'true';
        const nextState = !isOpen;

        if (nextState) {
          openFeaturePanel(toggleEl, panelEl);
        } else {
          closeFeaturePanels();
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

    mountFeaturePanels();
    featurePanelPairs.forEach(({ toggle, panel, eventName }) => {
      setupFeatureToggle(toggle, panel, eventName, featurePanelPairs);
    });

    document.addEventListener('click', (event) => {
      if (!isAnyFeaturePanelOpen()) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest('.feature-toggle') || target.closest('.private-office-panel')) {
        return;
      }

      closeFeaturePanels();
    });

    lightboxBackdrop.addEventListener('click', closeLightbox);
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevImage);
    lightboxNext.addEventListener('click', showNextImage);
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (lightbox.classList.contains('open')) {
          closeLightbox();
          return;
        }
        if (isAnyFeaturePanelOpen()) {
          closeFeaturePanels();
        }
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

    const getItemTimestamp = (item) => {
      const dateValue = item?.pubDate || item?.date || '';
      const time = new Date(dateValue).getTime();
      return Number.isNaN(time) ? 0 : time;
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

    const extractImageCandidatesFromHtml = (html) => {
      if (!html) {
        return [];
      }

      const getImageCanonicalKey = (rawUrl) => {
        if (!rawUrl) {
          return '';
        }

        try {
          const url = new URL(rawUrl, window.location.origin);
          const host = url.hostname.toLowerCase();
          const path = url.pathname.replace(/\/+$/, '');
          const isNaverPstatic = /(^|\.)pstatic\.net$/.test(host);

          if (!isNaverPstatic) {
            return `${host}${path}${url.search}`;
          }

          // Naver image CDN variants (postfiles/blogthumb/blogfiles) often point to the same image.
          // Treat them as one candidate by host-agnostic path key and ignoring resize params.
          return path.toLowerCase();
        } catch (error) {
          return rawUrl.trim();
        }
      };

      const temp = document.createElement('div');
      temp.innerHTML = html;
      const images = Array.from(temp.querySelectorAll('img'));
      const candidates = [];
      const seenKeys = new Set();

      images.forEach((image) => {
        const candidate = image.getAttribute('src')
          || image.getAttribute('data-src')
          || image.getAttribute('data-lazy-src')
          || image.getAttribute('data-original');
        if (candidate && candidate.trim()) {
          const normalized = candidate.trim();
          const canonicalKey = getImageCanonicalKey(normalized);
          if (!seenKeys.has(canonicalKey)) {
            seenKeys.add(canonicalKey);
            candidates.push(normalized);
          }
        }
      });

      return candidates;
    };

    const extractImageFromHtml = (html) => {
      const candidates = extractImageCandidatesFromHtml(html);
      if (!candidates.length) {
        return '';
      }

      const preferred = candidates.find((url) => {
        return /blogthumb\.pstatic\.net|postfiles\.pstatic\.net|blogfiles\.pstatic\.net/i.test(url);
      });

      return preferred || candidates[0];
    };

    const sanitizeImageUrl = (rawUrl) => {
      if (!rawUrl) {
        return '';
      }

      try {
        const normalizedUrl = rawUrl
          .replaceAll('&amp;', '&')
          .replace(/\s+/g, '');
        const url = new URL(normalizedUrl, window.location.origin);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return '';
        }
        return url.href;
      } catch (error) {
        return '';
      }
    };

    const toPreferredNaverRepresentativeImageUrl = (rawUrl) => {
      const safeUrl = sanitizeImageUrl(rawUrl);
      if (!safeUrl) {
        return '';
      }

      try {
        const url = new URL(safeUrl);
        const host = url.hostname.toLowerCase();
        const isNaverPstatic = /(^|\.)pstatic\.net$/.test(host);
        const isNaverImageHost = /(^|\.)(blogthumb|blogfiles|postfiles)\.pstatic\.net$/.test(host);

        if (!isNaverPstatic || !isNaverImageHost) {
          return safeUrl;
        }

        url.hostname = 'postfiles.pstatic.net';
        url.search = '?type=w773';
        return url.href;
      } catch (error) {
        return safeUrl;
      }
    };

    const toProxyImageUrl = (rawUrl) => {
      const safeUrl = sanitizeImageUrl(rawUrl);
      if (!safeUrl) {
        return '';
      }
      return `https://images.weserv.nl/?url=${encodeURIComponent(safeUrl)}&w=960&output=webp`;
    };

    const toProxyImageSrcSet = (rawUrl) => {
      const safeUrl = sanitizeImageUrl(rawUrl);
      if (!safeUrl) {
        return '';
      }

      const encoded = encodeURIComponent(safeUrl);
      return [480, 960, 1280]
        .map((width) => `https://images.weserv.nl/?url=${encoded}&w=${width}&output=webp ${width}w`)
        .join(', ');
    };

    const USECASE_FALLBACK_IMAGES = [
      'images/01.webp',
      'images/03.webp',
      'images/06.webp',
      'images/10.webp',
      'images/12.webp'
    ];

    const getSeedHash = (seedText) => {
      return Array.from(seedText || '').reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
      }, 0);
    };

    const getFallbackImageBySeed = (seedText) => {
      if (!USECASE_FALLBACK_IMAGES.length) {
        return 'images/main.webp';
      }
      const hash = getSeedHash(seedText);
      const index = Math.abs(hash) % USECASE_FALLBACK_IMAGES.length;
      return USECASE_FALLBACK_IMAGES[index];
    };

    const attachUseCaseImageFallback = () => {
      const thumbs = document.querySelectorAll('.testimonial-thumb');
      thumbs.forEach((img) => {
        img.addEventListener('error', () => {
          const proxySrc = img.dataset.proxySrc || '';
          if (img.dataset.proxyAttempted !== 'true' && proxySrc && img.src !== proxySrc) {
            img.dataset.proxyAttempted = 'true';
            img.src = proxySrc;
            return;
          }

          if (img.dataset.fallbackApplied === 'true') {
            return;
          }

          img.dataset.fallbackApplied = 'true';
          img.src = getFallbackImageBySeed(img.dataset.fallbackSeed || 'main');
        });
      });
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
        const summary = truncate(stripHtml(item.description), 130) || '내용 요약이 없습니다.';
        const date = formatDate(item.pubDate);
        const link = item.link || '#';
        const imageUrl = toPreferredNaverRepresentativeImageUrl(item.imageUrl || extractImageFromHtml(item.description));
        const proxyImageUrl = toProxyImageUrl(imageUrl);
        const contentType = item.contentType || classifyUseCaseType(item);
        const badgeLabel = contentType === '이용안내' ? 'Guide' : 'Case';
        const fallbackSeed = `${title}::${link}`;

        return `
          <article class="testimonial-card">
            ${imageUrl ? `<a href="${escapeHtml(link)}" class="testimonial-thumb-link" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(title)} 이미지 포함 글 보기"><img class="testimonial-thumb" src="${escapeHtml(imageUrl)}" width="960" height="540" data-original-src="${escapeHtml(imageUrl)}" data-proxy-src="${escapeHtml(proxyImageUrl)}" data-fallback-seed="${escapeHtml(fallbackSeed)}" alt="${escapeHtml(title)} 대표 이미지" loading="lazy" decoding="async"></a>` : ''}
            <div class="stars">${escapeHtml(badgeLabel)}</div>
            <h3 class="testimonial-title"><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>
            <p class="testimonial-summary">${escapeHtml(summary)}</p>
            <span class="author">— 네이버 블로그 ${escapeHtml(contentType)}</span>
            <p class="testimonial-meta">${escapeHtml(date)}</p>
          </article>
        `;
      }).join('');

      useCasesGrid.innerHTML = cardsHtml;
      attachUseCaseImageFallback();
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
      return nodeList.map((item) => {
        const description = item.querySelector('description')?.textContent || '';
        const contentImage = extractImageFromHtml(description);
        return {
          title: item.querySelector('title')?.textContent?.trim() || '',
          description,
          link: item.querySelector('link')?.textContent?.trim() || '',
          pubDate: item.querySelector('pubDate')?.textContent?.trim() || '',
          imageUrl: contentImage
            || item.querySelector('enclosure')?.getAttribute('url')?.trim()
            || item.querySelector('media\\:thumbnail')?.getAttribute('url')?.trim()
            || item.querySelector('media\\:content')?.getAttribute('url')?.trim()
        };
      });
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
            ? payload.items.map((item) => {
                const description = item?.description || '';
                const contentImage = extractImageFromHtml(description);
                return {
                  title: item?.title || '',
                  description,
                  link: item?.link || '',
                  pubDate: item?.pubDate || '',
                  imageUrl: contentImage || item?.thumbnail || item?.enclosure?.link || ''
                };
              })
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

    const readEmbeddedUseCaseItems = () => {
      if (!naverBlogFallbackData) {
        return [];
      }

      try {
        const parsed = JSON.parse(naverBlogFallbackData.textContent || '[]');
        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.map((item) => ({
          title: typeof item?.title === 'string' ? item.title : '',
          description: typeof item?.summary === 'string' ? item.summary : '',
          link: typeof item?.url === 'string' ? item.url : '',
          pubDate: typeof item?.date === 'string' ? item.date : '',
          imageUrl: typeof item?.image_url === 'string' ? item.image_url : '',
          contentType: classifyUseCaseType({
            title: typeof item?.title === 'string' ? item.title : '',
            description: typeof item?.summary === 'string' ? item.summary : ''
          })
        })).filter((item) => item.title && item.link);
      } catch (error) {
        return [];
      }
    };

    const mergeUseCaseItems = (...groups) => {
      const merged = new Map();

      groups.flat().forEach((item) => {
        if (!item || !item.link) {
          return;
        }

        const existing = merged.get(item.link);
        if (!existing) {
          merged.set(item.link, item);
          return;
        }

        const candidateTime = getItemTimestamp(item);
        const existingTime = getItemTimestamp(existing);

        if (candidateTime > existingTime) {
          merged.set(item.link, {
            ...existing,
            ...item
          });
          return;
        }

        merged.set(item.link, {
          ...item,
          ...existing
        });
      });

      return Array.from(merged.values()).sort((a, b) => {
        const timeGap = getItemTimestamp(b) - getItemTimestamp(a);
        if (timeGap !== 0) {
          return timeGap;
        }
        return (b.score || 0) - (a.score || 0);
      });
    };

    const extractOgImageFromHtml = (htmlText) => {
      if (!htmlText) {
        return '';
      }

      try {
        const html = new DOMParser().parseFromString(htmlText, 'text/html');
        const ogImage = html.querySelector('meta[property="og:image"], meta[name="og:image"], meta[property="twitter:image"], meta[name="twitter:image"]')
          ?.getAttribute('content')
          ?.trim();
        if (ogImage) {
          return ogImage;
        }

        const thumbnailMatch = htmlText.match(/var\s+thumbnail\s*=\s*["']([^"']+)["']/i);
        if (thumbnailMatch?.[1]) {
          return thumbnailMatch[1].trim();
        }
      } catch (error) {
        return '';
      }

      return '';
    };

    const resolveRepresentativeImageFromPost = async (postLink) => {
      if (!postLink) {
        return '';
      }

      const fetchViaProxy = async (targetUrl) => {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetchWithTimeout(proxyUrl, 8000);
        if (!response.ok) {
          return '';
        }
        const payload = await response.json();
        return payload?.contents || '';
      };

      try {
        const firstHtml = await fetchViaProxy(postLink);
        if (!firstHtml) {
          return '';
        }

        const directOgImage = extractOgImageFromHtml(firstHtml);
        if (directOgImage) {
          return directOgImage;
        }

        const firstDoc = new DOMParser().parseFromString(firstHtml, 'text/html');
        const mainFrameSrc = firstDoc.querySelector('#mainFrame')?.getAttribute('src')?.trim() || '';
        if (!mainFrameSrc) {
          return '';
        }

        const absoluteMainFrameUrl = new URL(mainFrameSrc, postLink).href;
        const postHtml = await fetchViaProxy(absoluteMainFrameUrl);
        if (!postHtml) {
          return '';
        }

        return extractOgImageFromHtml(postHtml);
      } catch (error) {
        return '';
      }
    };

    const enrichItemsWithRepresentativeImage = async (items, limit = 6) => {
      if (!Array.isArray(items) || !items.length) {
        return [];
      }

      const boundedLimit = Math.max(0, Math.min(limit, items.length));
      if (boundedLimit === 0) {
        return items;
      }

      const head = items.slice(0, boundedLimit);
      const representativeImages = await Promise.all(head.map(async (item) => {
        return resolveRepresentativeImageFromPost(item.link || '');
      }));

      return items.map((item, index) => {
        if (index >= boundedLimit) {
          return item;
        }

        const representativeImage = sanitizeImageUrl(representativeImages[index]);
        if (!representativeImage) {
          return item;
        }

        return {
          ...item,
          imageUrl: representativeImage
        };
      });
    };

    const loadUseCasesFromRss = async () => {
      if (!useCasesGrid) {
        return;
      }

      const rssUrl = 'https://rss.blog.naver.com/bareunjari114.xml';
      const USECASE_CACHE_KEY = 'bareunjari-usecases-cache-v6';
      const LEGACY_USECASE_CACHE_KEYS = ['bareunjari-usecases-cache-v1', 'bareunjari-usecases-cache-v2', 'bareunjari-usecases-cache-v3', 'bareunjari-usecases-cache-v4', 'bareunjari-usecases-cache-v5'];
      const USECASE_CACHE_TTL = 24 * 60 * 60 * 1000;
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
      const embeddedItems = readEmbeddedUseCaseItems();

      if (embeddedItems.length > 0) {
        useCaseItems = embeddedItems.slice(0, 18);
        useCasePage = 0;
        renderUseCasePage();
      }

      try {
        LEGACY_USECASE_CACHE_KEYS.forEach((legacyKey) => {
          localStorage.removeItem(legacyKey);
        });
      } catch (error) {
        // Ignore cache cleanup errors.
      }

      const readUseCaseCache = () => {
        try {
          const raw = localStorage.getItem(USECASE_CACHE_KEY);
          if (!raw) {
            return [];
          }
          const parsed = JSON.parse(raw);
          const ts = Number(parsed?.ts || 0);
          const items = Array.isArray(parsed?.items) ? parsed.items : [];
          if (!ts || !items.length) {
            return [];
          }
          if (Date.now() - ts > USECASE_CACHE_TTL) {
            return [];
          }
          return items;
        } catch (error) {
          return [];
        }
      };

      const writeUseCaseCache = (items) => {
        try {
          if (!Array.isArray(items) || !items.length) {
            return;
          }
          localStorage.setItem(USECASE_CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            items
          }));
        } catch (error) {
          // Ignore cache write errors.
        }
      };

      try {
        if (rssStatus && embeddedItems.length === 0) {
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

        const resolvedItems = mergeUseCaseItems(embeddedItems, filtered);

        const selected = resolvedItems.slice(0, 3);
        if (selected.length > 0) {
          writeUseCaseCache(resolvedItems);
          useCaseItems = resolvedItems.slice(0, 18);
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
        if (embeddedItems.length > 0) {
          useCaseItems = embeddedItems.slice(0, 18);
          useCasePage = 0;
          renderUseCasePage();
          return;
        }

        const cachedItems = readUseCaseCache();
        if (cachedItems.length > 0) {
          useCaseItems = cachedItems.slice(0, 18);
          useCasePage = 0;
          renderUseCasePage();
          if (rssStatus) {
            rssStatus.textContent = '최신 데이터를 불러오지 못해 최근 캐시 데이터를 표시합니다.';
            rssStatus.hidden = false;
          }
          return;
        }

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
      const contactNameInput = document.getElementById('contactName');
      const contactEmailInput = document.getElementById('contactEmail');
      const contactSubjectInput = document.getElementById('contactSubject');
      const contactReplyToInput = document.getElementById('contactReplyTo');

      if (contactBranchInput) {
        contactBranchInput.value = branchContext.name;
      }
      if (contactBranchSlugInput) {
        contactBranchSlugInput.value = branchContext.slug;
      }

      if (contactParams.get('contact') === 'sent' && contactSubmitStatus) {
        contactSubmitStatus.hidden = false;
        contactSubmitStatus.classList.add('success');
        contactSubmitStatus.textContent = '문의가 정상 접수되었습니다. 확인 후 빠르게 연락드릴게요.';
        contactForm.reset();
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash || '#contact'}`);
      }

      contactForm.addEventListener('submit', (event) => {
        if (contactSubjectInput) {
          const nameValue = (contactNameInput && typeof contactNameInput.value === 'string')
            ? contactNameInput.value.trim()
            : '';
          const inquiryTypeValue = (contactInquiryType && typeof contactInquiryType.value === 'string')
            ? contactInquiryType.value.trim()
            : '일반 문의';
          const subjectBase = `[${branchContext.name}] ${inquiryTypeValue} 문의 접수`;
          contactSubjectInput.value = nameValue
            ? `${subjectBase} | ${nameValue}`
            : subjectBase;
        }

        if (contactReplyToInput) {
          contactReplyToInput.value = (contactEmailInput && typeof contactEmailInput.value === 'string')
            ? contactEmailInput.value.trim()
            : '';
        }

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
        const payload = withBranchContext({
          form_name: 'contact_form',
          inquiry_type: (contactInquiryType && typeof contactInquiryType.value === 'string')
            ? contactInquiryType.value.trim()
            : '일반 문의'
        });
        trackEvent('submit_contact_form', payload);
        trackMetaEvent('submit_contact_form', payload);
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
    setupGalleryLoadMore();
    loadUseCasesFromRss();
