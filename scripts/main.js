    const toTopButton = document.getElementById('toTop');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const galleryTrack = document.getElementById('galleryTrack');
    const spaceGalleryCount = document.getElementById('spaceGalleryCount');
    const spaceGalleryDots = document.getElementById('spaceGalleryDots');
    const spaceGalleryOverlay = document.getElementById('spaceGalleryOverlay');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    const navSectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const navSubmenuToggles = document.querySelectorAll('.nav-submenu-toggle');
    const useCasesGrid = document.getElementById('useCasesGrid');
    const naverBlogFallbackData = document.getElementById('naverBlogFallbackData');
    const rssStatus = document.getElementById('rssStatus');
    const useCaseControls = document.getElementById('useCaseControls');
    const useCaseLoadMore = document.getElementById('useCaseLoadMore');
    const useCaseFilters = document.getElementById('useCaseFilters');
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
    const dateAnniversaryToggle = document.getElementById('dateAnniversaryToggle');
    const dateAnniversaryPanel = document.getElementById('dateAnniversaryPanel');
    const popupExhibitToggle = document.getElementById('popupExhibitToggle');
    const popupExhibitPanel = document.getElementById('popupExhibitPanel');
    const featureDetailStack = document.getElementById('featureDetailStack');
    const spaceSectionInner = document.querySelector('#space .section-inner');
    const featureCardsGrid = document.querySelector('#space .features-grid');
    const mobileStickyCta = document.getElementById('mobileStickyCta');
    const promoCountdown = document.getElementById('promoCountdown');
    const promoInlineCountdown = document.getElementById('promoInlineCountdown');
    const blogGuideFilters = document.getElementById('blogGuideFilters');
    const blogGuideGrid = document.querySelector('#blog-onsite .blog-guide-grid');
    const blogGuideLoadMore = document.getElementById('blogGuideLoadMore');
    const homeGuideFilters = document.getElementById('homeGuideFilters');
    const homeGuideGrid = document.getElementById('homeGuideGrid');
    const homeGuideLoadMore = document.getElementById('homeGuideLoadMore');
    const blogFieldFilters = document.getElementById('blogFieldFilters');
    const blogFieldGrid = document.querySelector('#blog-latest .blog-field-grid');
    const blogFieldLoadMore = document.getElementById('blogFieldLoadMore');
    const blogTopicCards = Array.from(document.querySelectorAll('.blog-topic-card'));
    const postShareRoot = document.querySelector('[data-post-share]');
    const postReactionsRoot = document.querySelector('[data-post-reaction]');
    const relatedCarousels = Array.from(document.querySelectorAll('[data-related-carousel]'));
    const postMediaCarousels = Array.from(document.querySelectorAll('[data-post-media-carousel]'));
    const FEATURE_PANEL_ANIM_MS = 150;
    const BLOG_GUIDE_INITIAL_VISIBLE = 3;
    const BLOG_GUIDE_LOAD_STEP = 3;
    const HOME_GUIDE_INITIAL_VISIBLE = 3;
    const HOME_GUIDE_LOAD_STEP = 3;
    const BLOG_FIELD_INITIAL_VISIBLE = 3;
    const BLOG_FIELD_LOAD_STEP = 3;
    const USECASE_INITIAL_VISIBLE = 3;
    const USECASE_LOAD_STEP = 3;
    let scrollLockTop = 0;
    let currentGalleryIndex = -1;
    let lightboxTouchStartX = 0;
    let lightboxTouchStartY = 0;
    let useCaseItems = [];
    let useCaseVisibleCount = USECASE_INITIAL_VISIBLE;
    let useCaseActiveCategory = 'all';
    let featurePanelCleanupTimer = 0;

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

    const parsePostReactionConfig = () => {
      const configNode = document.getElementById('postReactionConfig');
      if (!configNode) {
        return {};
      }

      try {
        return JSON.parse(configNode.textContent || '{}');
      } catch (error) {
        return {};
      }
    };

    const createVisitorToken = () => {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }

      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        const bytes = window.crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
        return [
          hex.slice(0, 4).join(''),
          hex.slice(4, 6).join(''),
          hex.slice(6, 8).join(''),
          hex.slice(8, 10).join(''),
          hex.slice(10, 16).join('')
        ].join('-');
      }

      const seed = `${Date.now()}-${Math.random().toString(16).slice(2).padEnd(16, '0')}`;
      const compact = seed.replace(/[^a-f0-9]/gi, '').toLowerCase().padEnd(32, '0').slice(0, 32);
      return [
        compact.slice(0, 8),
        compact.slice(8, 12),
        `4${compact.slice(13, 16)}`,
        `8${compact.slice(17, 20)}`,
        compact.slice(20, 32)
      ].join('-');
    };

    const setupPostReactions = () => {
      if (!postReactionsRoot) {
        return;
      }

      const buttons = Array.from(postReactionsRoot.querySelectorAll('[data-reaction-value]'));
      const feedback = postReactionsRoot.querySelector('[data-reaction-feedback]');
      const countNodes = Array.from(postReactionsRoot.querySelectorAll('[data-reaction-count]'));
      const postKey = postReactionsRoot.dataset.postKey || window.location.pathname;
      const postTitle = (postReactionsRoot.dataset.postTitle || document.title || '').trim();
      const storageKey = `bareunjari-post-reaction:${postKey}`;
      const visitorTokenStorageKey = 'bareunjari-post-reaction-visitor-token';
      const reactionConfig = parsePostReactionConfig();
      const supabaseUrl = (reactionConfig.supabaseUrl || '').trim();
      const supabaseAnonKey = (reactionConfig.supabaseAnonKey || '').trim();
      const hasSupabaseClient = Boolean(window.supabase && typeof window.supabase.createClient === 'function');
      const canUseSupabase = hasSupabaseClient && Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

      const readSelectedReaction = () => {
        try {
          return localStorage.getItem(storageKey) || '';
        } catch (error) {
          return '';
        }
      };

      const saveSelectedReaction = (reactionValue) => {
        try {
          if (!reactionValue) {
            localStorage.removeItem(storageKey);
            return;
          }
          localStorage.setItem(storageKey, reactionValue);
        } catch (error) {
          // localStorage may be blocked in private mode; fail silently.
        }
      };

      const readVisitorToken = () => {
        try {
          const savedToken = localStorage.getItem(visitorTokenStorageKey);
          if (savedToken) {
            return savedToken;
          }

          const nextToken = createVisitorToken();
          localStorage.setItem(visitorTokenStorageKey, nextToken);
          return nextToken;
        } catch (error) {
          return createVisitorToken();
        }
      };

      const getReactionLabel = (reactionValue) => {
        const target = buttons.find((button) => button.dataset.reactionValue === reactionValue);
        return target ? (target.dataset.reactionLabel || '').trim() : '';
      };

      const setFeedback = (message, kind = 'success') => {
        if (!feedback) {
          return;
        }

        feedback.textContent = message || '';
        feedback.classList.toggle('is-error', kind === 'error');
        feedback.classList.toggle('is-visible', Boolean(message) && kind === 'error');
      };

      const renderSelectedReaction = (reactionValue, message = '') => {
        buttons.forEach((button) => {
          const isActive = button.dataset.reactionValue === reactionValue;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        if (message) {
          setFeedback(message);
          return;
        }

        const label = getReactionLabel(reactionValue);
        setFeedback(label ? `${label} 반응이 저장됐어요.` : '');
      };

      const renderCounts = (summary = {}) => {
        const countsByValue = {
          helpful: Number(summary.helpful_count || 0),
          like: Number(summary.like_count || 0),
          new: Number(summary.new_count || 0)
        };

        countNodes.forEach((node) => {
          const reactionValue = node.dataset.reactionCount || '';
          node.textContent = String(countsByValue[reactionValue] || 0);
        });

      };

      const setSubmitting = (isSubmitting) => {
        postReactionsRoot.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
        buttons.forEach((button) => {
          button.disabled = isSubmitting;
        });
      };

      let selectedReaction = readSelectedReaction();
      const visitorToken = readVisitorToken();
      const fallbackClient = canUseSupabase ? window.supabase.createClient(supabaseUrl, supabaseAnonKey) : null;
      renderSelectedReaction(selectedReaction);
      renderCounts();

      const syncReactionState = async () => {
        if (!fallbackClient) {
          return;
        }

        const { data, error } = await fallbackClient.rpc('get_post_reaction_state', {
          p_post_key: postKey,
          p_visitor_token: visitorToken
        });

        if (error) {
          return;
        }

        const summary = Array.isArray(data) ? data[0] : data;
        selectedReaction = (summary?.selected_reaction || '').trim();
        saveSelectedReaction(selectedReaction);
        renderSelectedReaction(selectedReaction);
        renderCounts(summary || {});
      };

      syncReactionState().catch(() => {
      });

      buttons.forEach((button) => {
        button.addEventListener('click', async () => {
          const nextReaction = button.dataset.reactionValue || '';
          const isCancelAction = selectedReaction === nextReaction;
          const targetReaction = isCancelAction ? '' : nextReaction;

          if (!fallbackClient) {
            selectedReaction = targetReaction;
            saveSelectedReaction(selectedReaction);
            renderSelectedReaction(selectedReaction);

            trackEvent('select_post_reaction', withBranchContext({
              page_path: window.location.pathname,
              reaction: nextReaction,
              action: isCancelAction ? 'remove' : 'select'
            }));
            trackMetaEvent('select_post_reaction', withBranchContext({
              page_path: window.location.pathname,
              reaction: nextReaction,
              action: isCancelAction ? 'remove' : 'select'
            }));
            return;
          }

          const previousReaction = selectedReaction;
          const pendingLabel = isCancelAction ? '반응을 취소하는 중이에요.' : `${getReactionLabel(targetReaction)} 반응을 저장하는 중이에요.`;

          selectedReaction = targetReaction;
          renderSelectedReaction(selectedReaction, pendingLabel);
          saveSelectedReaction(selectedReaction);
          setSubmitting(true);

          try {
            const { data, error } = await fallbackClient.rpc('submit_post_reaction', {
              p_post_key: postKey,
              p_reaction_value: targetReaction || null,
              p_visitor_token: visitorToken,
              p_page_path: window.location.pathname,
              p_page_title: postTitle,
              p_branch_slug: branchContext.slug
            });

            if (error) {
              throw error;
            }

            const summary = Array.isArray(data) ? data[0] : data;
            selectedReaction = (summary?.selected_reaction || '').trim();
            saveSelectedReaction(selectedReaction);
            renderSelectedReaction(
              selectedReaction,
              selectedReaction ? `${getReactionLabel(selectedReaction)} 반응이 저장됐어요.` : '반응이 취소됐어요.'
            );
            renderCounts(summary || {});

            trackEvent('select_post_reaction', withBranchContext({
              page_path: window.location.pathname,
              reaction: nextReaction,
              action: isCancelAction ? 'remove' : 'select'
            }));
            trackMetaEvent('select_post_reaction', withBranchContext({
              page_path: window.location.pathname,
              reaction: nextReaction,
              action: isCancelAction ? 'remove' : 'select'
            }));
          } catch (error) {
            selectedReaction = previousReaction;
            saveSelectedReaction(selectedReaction);
            renderSelectedReaction(selectedReaction);
            setFeedback('반응 저장에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error');
          } finally {
            setSubmitting(false);
          }
        });
      });
    };

    const setupPostShare = () => {
      if (!postShareRoot) {
        return;
      }

      const shareButton = postShareRoot.querySelector('[data-share-trigger]');
      const feedback = postShareRoot.querySelector('[data-share-feedback]')
        || postShareRoot.closest('.post-reactions')?.querySelector('[data-share-feedback]');
      const countNode = postShareRoot.querySelector('[data-share-count]');
      const postKey = postShareRoot.dataset.postKey || window.location.pathname;
      const shareUrl = (postShareRoot.dataset.shareUrl || window.location.href || '').trim();
      const shareTitle = (postShareRoot.dataset.shareTitle || document.title || '').trim();
      const shareText = (postShareRoot.dataset.shareText || shareTitle || '').trim();
      const reactionConfig = parsePostReactionConfig();
      const supabaseUrl = (reactionConfig.supabaseUrl || '').trim();
      const supabaseAnonKey = (reactionConfig.supabaseAnonKey || '').trim();
      const hasSupabaseClient = Boolean(window.supabase && typeof window.supabase.createClient === 'function');
      const canUseSupabase = hasSupabaseClient && Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
      const shareClient = canUseSupabase ? window.supabase.createClient(supabaseUrl, supabaseAnonKey) : null;
      const visitorToken = createVisitorToken();

      if (!shareButton || !shareUrl) {
        return;
      }

      const setShareFeedback = (message, kind = 'success') => {
        if (!feedback) {
          return;
        }

        feedback.textContent = message || '';
        feedback.classList.toggle('is-error', kind === 'error');
        feedback.classList.toggle('is-visible', Boolean(message));
      };

      const copyShareUrl = async () => {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          return;
        }

        const helper = document.createElement('textarea');
        helper.value = shareUrl;
        helper.setAttribute('readonly', '');
        helper.style.position = 'absolute';
        helper.style.left = '-9999px';
        document.body.appendChild(helper);
        helper.select();
        helper.setSelectionRange(0, helper.value.length);

        const copied = document.execCommand('copy');
        document.body.removeChild(helper);

        if (!copied) {
          throw new Error('copy_failed');
        }
      };

      const renderShareCount = (summary = {}) => {
        if (!countNode) {
          return;
        }

        countNode.textContent = String(Number(summary.share_count || 0));
      };

      const syncShareState = async () => {
        if (!shareClient) {
          return;
        }

        const { data, error } = await shareClient.rpc('get_post_share_state', {
          p_post_key: postKey
        });

        if (error) {
          return;
        }

        const summary = Array.isArray(data) ? data[0] : data;
        renderShareCount(summary || {});
      };

      const submitShareCount = async (shareMethod) => {
        if (!shareClient) {
          return;
        }

        const { data, error } = await shareClient.rpc('submit_post_share', {
          p_post_key: postKey,
          p_share_method: shareMethod,
          p_visitor_token: visitorToken,
          p_page_path: window.location.pathname,
          p_page_title: shareTitle,
          p_branch_slug: branchContext.slug
        });

        if (error) {
          return;
        }

        const summary = Array.isArray(data) ? data[0] : data;
        renderShareCount(summary || {});
      };

      const trackShare = (shareMethod) => {
        submitShareCount(shareMethod).catch(() => {});
        trackEvent('share_post', withBranchContext({
          page_path: window.location.pathname,
          method: shareMethod
        }));
        trackMetaEvent('share_post', withBranchContext({
          page_path: window.location.pathname,
          method: shareMethod
        }));
      };

      const getNativeShareVariants = () => {
        const candidates = [
          { title: shareTitle, text: shareText, url: shareUrl },
          { text: shareText, url: shareUrl },
          { title: shareTitle, url: shareUrl },
          { url: shareUrl }
        ];

        const seen = new Set();
        return candidates.filter((candidate) => {
          const normalized = Object.fromEntries(
            Object.entries(candidate).filter(([, value]) => Boolean(value))
          );

          if (!Object.keys(normalized).length) {
            return false;
          }

          const signature = JSON.stringify(normalized);
          if (seen.has(signature)) {
            return false;
          }

          seen.add(signature);
          return true;
        });
      };

      const tryNativeShare = async () => {
        if (typeof navigator.share !== 'function') {
          return false;
        }

        let deferredVariant = null;
        let lastError = null;

        for (const shareData of getNativeShareVariants()) {
          let canShareCurrent = true;
          if (typeof navigator.canShare === 'function') {
            try {
              canShareCurrent = navigator.canShare(shareData);
            } catch (error) {
              canShareCurrent = false;
            }
          }

          if (!canShareCurrent) {
            deferredVariant = deferredVariant || shareData;
            continue;
          }

          try {
            await navigator.share(shareData);
            return true;
          } catch (error) {
            if (error && error.name === 'AbortError') {
              throw error;
            }
            lastError = error;
          }
        }

        if (deferredVariant) {
          try {
            await navigator.share(deferredVariant);
            return true;
          } catch (error) {
            if (error && error.name === 'AbortError') {
              throw error;
            }
            lastError = error;
          }
        }

        if (lastError) {
          throw lastError;
        }

        return false;
      };

      renderShareCount();
      syncShareState().catch(() => {});

      shareButton.addEventListener('click', async () => {
        shareButton.disabled = true;
        setShareFeedback('');

        try {
          if (await tryNativeShare()) {
            setShareFeedback('공유 메뉴를 통해 글을 보냈어요.');
            trackShare('native_share');
            return;
          }

          await copyShareUrl();
          setShareFeedback('이 글 링크를 복사했어요.');
          trackShare('copy_link');
        } catch (error) {
          if (error && error.name === 'AbortError') {
            setShareFeedback('');
            return;
          }

          try {
            await copyShareUrl();
            setShareFeedback('공유 창을 열지 못해 링크를 복사했어요.');
            trackShare('fallback_copy');
          } catch (copyError) {
            setShareFeedback('공유 링크를 복사하지 못했어요. 잠시 후 다시 시도해 주세요.', 'error');
          }
        } finally {
          shareButton.disabled = false;
        }
      });
    };

    const setupRelatedCarousels = () => {
      if (!relatedCarousels.length) {
        return;
      }

      relatedCarousels.forEach((carousel) => {
        const track = carousel.querySelector('[data-related-track]');
        const prevButton = carousel.querySelector('[data-related-prev]');
        const nextButton = carousel.querySelector('[data-related-next]');
        if (!track || !prevButton || !nextButton) {
          return;
        }

        const getScrollAmount = () => {
          const firstCard = track.querySelector('.post-related-card');
          if (!firstCard) {
            return Math.max(280, track.clientWidth * 0.8);
          }
          const styles = window.getComputedStyle(track);
          const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
          return firstCard.getBoundingClientRect().width + gap;
        };

        const updateButtons = () => {
          const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth - 2);
          prevButton.disabled = track.scrollLeft <= 2;
          nextButton.disabled = track.scrollLeft >= maxScrollLeft;
        };

        prevButton.addEventListener('click', () => {
          track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
        nextButton.addEventListener('click', () => {
          track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });
        track.addEventListener('scroll', updateButtons, { passive: true });
        window.addEventListener('resize', updateButtons);
        updateButtons();
      });
    };

    const setupBlogGuideCategoryCarousels = () => {
      const groups = Array.from(document.querySelectorAll('.blog-guide-category-group'));
      if (!groups.length) {
        return;
      }

      groups.forEach((group) => {
        const track = group.querySelector('[data-blog-guide-track]');
        const prevButton = group.querySelector('[data-blog-guide-prev]');
        const nextButton = group.querySelector('[data-blog-guide-next]');
        if (!track || !prevButton || !nextButton) {
          return;
        }

        const cards = Array.from(track.querySelectorAll('.blog-guide-card'));
        if (!cards.length) {
          prevButton.hidden = true;
          nextButton.hidden = true;
          return;
        }

        const getStepWidth = () => {
          const firstCard = cards[0];
          const styles = window.getComputedStyle(track);
          const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
          return firstCard.getBoundingClientRect().width + gap;
        };

        const getVisibleCardCount = () => {
          const stepWidth = Math.max(1, getStepWidth());
          const availableWidth = Math.max(1, track.clientWidth);
          const visibleCount = Math.floor((availableWidth + 1) / stepWidth);
          return Math.max(1, Math.min(3, visibleCount));
        };

        const getNearestIndex = () => {
          const stepWidth = Math.max(1, getStepWidth());
          const rawIndex = Math.round(track.scrollLeft / stepWidth);
          return Math.min(Math.max(0, rawIndex), cards.length - 1);
        };

        const scrollToIndex = (index) => {
          const clampedIndex = Math.min(Math.max(0, index), cards.length - 1);
          const targetCard = cards[clampedIndex];
          if (!targetCard) {
            return;
          }
          targetCard.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        };

        const updateButtons = () => {
          const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth - 1);
          const canScroll = track.scrollWidth > track.clientWidth + 2;
          const nearestIndex = getNearestIndex();
          prevButton.hidden = !canScroll;
          nextButton.hidden = !canScroll;
          prevButton.disabled = !canScroll || nearestIndex <= 0 || track.scrollLeft <= 1;
          nextButton.disabled = !canScroll || nearestIndex >= cards.length - 1 || track.scrollLeft >= maxScrollLeft;
        };

        prevButton.addEventListener('click', () => {
          const currentIndex = getNearestIndex();
          scrollToIndex(currentIndex - getVisibleCardCount());
        });
        nextButton.addEventListener('click', () => {
          const currentIndex = getNearestIndex();
          scrollToIndex(currentIndex + getVisibleCardCount());
        });

        track.addEventListener('scroll', updateButtons, { passive: true });
        window.addEventListener('resize', updateButtons);
        updateButtons();
      });
    };

    const setupPostMediaCarousels = () => {
      if (!postMediaCarousels.length) {
        return;
      }

      postMediaCarousels.forEach((carousel) => {
        const track = carousel.querySelector('[data-post-media-track]');
        const prevButton = carousel.querySelector('[data-post-media-prev]');
        const nextButton = carousel.querySelector('[data-post-media-next]');
        const status = carousel.querySelector('[data-post-media-status]');
        const slides = Array.from(carousel.querySelectorAll('[data-post-media-slide]'));

        if (!track || !prevButton || !nextButton || !slides.length) {
          return;
        }

        let activeIndex = 0;
        const lastIndex = slides.length - 1;

        const updateUi = () => {
          track.style.transform = `translateX(-${activeIndex * 100}%)`;
          prevButton.disabled = activeIndex === 0;
          nextButton.disabled = activeIndex === lastIndex;
          if (status) {
            status.textContent = `${activeIndex + 1} / ${slides.length}`;
          }
        };

        prevButton.addEventListener('click', () => {
          activeIndex = Math.max(0, activeIndex - 1);
          updateUi();
        });

        nextButton.addEventListener('click', () => {
          activeIndex = Math.min(lastIndex, activeIndex + 1);
          updateUi();
        });

        updateUi();
      });
    };

    const setupPostMediaVideoPlayers = () => {
      const videoLinks = Array.from(document.querySelectorAll('[data-post-media-video-link]'));

      videoLinks.forEach((link) => {
        if (link.dataset.mediaVideoBound === 'true') {
          return;
        }

        link.dataset.mediaVideoBound = 'true';
      });
    };

    const updatePromoCountdown = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const promoStart = new Date(2026, 6, 27);
      const diffDays = Math.floor((promoStart - today) / (1000 * 60 * 60 * 24));

      let ddayText = '적용중';
      if (diffDays > 0) {
        ddayText = `7월 27일부터 적용 · D-${diffDays}`;
      } else if (diffDays === 0) {
        ddayText = '오늘부터 적용';
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
        A: '지금 예약하기 · 1시간 1만원',
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
      if (lightboxCounter) {
        lightboxCounter.textContent = `${normalizedIndex + 1} / ${galleryItems.length}`;
      }
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
      if (lightboxCounter) {
        lightboxCounter.textContent = '1 / 1';
      }
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

    const setupSpaceGalleryCarousel = () => {
      if (!galleryTrack || !spaceGalleryCount || !spaceGalleryDots) {
        return;
      }

      const items = Array.from(galleryTrack.querySelectorAll('.space-gallery-item'));
      if (!items.length) {
        return;
      }

      if (spaceGalleryOverlay) {
        spaceGalleryOverlay.textContent = `사진 ${items.length}장 모두 보기`;
      }
      spaceGalleryDots.innerHTML = '';
      const dots = items.map((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'space-gallery-dot';
        dot.setAttribute('aria-hidden', 'true');
        spaceGalleryDots.appendChild(dot);
        dot.addEventListener('click', () => {
          items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
        return dot;
      });

      const setActiveIndex = (index) => {
        const normalizedIndex = Math.max(0, Math.min(index, items.length - 1));
        spaceGalleryCount.textContent = `${normalizedIndex + 1} / ${items.length}`;
        dots.forEach((dot, dotIndex) => {
          dot.classList.toggle('is-active', dotIndex === normalizedIndex);
        });
      };

      const updateFromScroll = () => {
        const trackRect = galleryTrack.getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;
        let activeIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        items.forEach((item, index) => {
          const itemRect = item.getBoundingClientRect();
          const itemCenter = itemRect.left + itemRect.width / 2;
          const distance = Math.abs(trackCenter - itemCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            activeIndex = index;
          }
        });

        setActiveIndex(activeIndex);
      };

      galleryTrack.addEventListener('scroll', () => {
        window.requestAnimationFrame(updateFromScroll);
      }, { passive: true });
      window.addEventListener('resize', updateFromScroll);
      setActiveIndex(0);
    };

    const setupLightboxSwipe = () => {
      if (!lightboxImage) {
        return;
      }

      lightboxImage.addEventListener('touchstart', (event) => {
        const touch = event.changedTouches[0];
        lightboxTouchStartX = touch.clientX;
        lightboxTouchStartY = touch.clientY;
      }, { passive: true });

      lightboxImage.addEventListener('touchend', (event) => {
        if (!lightbox.classList.contains('open')) {
          return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - lightboxTouchStartX;
        const deltaY = touch.clientY - lightboxTouchStartY;

        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
          return;
        }

        if (deltaX > 0) {
          showPrevImage();
        } else {
          showNextImage();
        }
      }, { passive: true });
    };

    const setupBlogGuideMediaCarousels = () => {
      const carousels = Array.from(document.querySelectorAll('[data-blog-guide-media-carousel]'));

      carousels.forEach((carousel) => {
        if (carousel.dataset.blogGuideMediaBound === 'true') {
          return;
        }

        carousel.dataset.blogGuideMediaBound = 'true';
        const track = carousel.querySelector('[data-blog-guide-media-track]');
        const slides = Array.from(track ? track.querySelectorAll('.blog-guide-media-slide') : []);
        const dots = Array.from(carousel.querySelectorAll('.blog-guide-media-dot'));
        const prevButton = carousel.querySelector('[data-blog-guide-media-prev]');
        const nextButton = carousel.querySelector('[data-blog-guide-media-next]');

        if (!track || slides.length < 2) {
          return;
        }

        let activeIndex = 0;
        let rotationTimer = null;

        const render = () => {
          track.style.transform = `translateX(-${activeIndex * 100}%)`;
          dots.forEach((dot, index) => {
            dot.classList.toggle('is-active', index === activeIndex);
          });
        };

        const setActiveIndex = (index) => {
          activeIndex = (index + slides.length) % slides.length;
          render();
        };

        const startRotation = () => {
          if (rotationTimer) {
            window.clearInterval(rotationTimer);
          }
          rotationTimer = window.setInterval(() => {
            setActiveIndex(activeIndex + 1);
          }, 3600);
        };

        prevButton?.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          setActiveIndex(activeIndex - 1);
          startRotation();
        });

        nextButton?.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          setActiveIndex(activeIndex + 1);
          startRotation();
        });

        dots.forEach((dot) => {
          dot.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const nextIndex = Number.parseInt(dot.dataset.blogGuideMediaDot || '0', 10);
            setActiveIndex(nextIndex);
            startRotation();
          });
        });

        carousel.addEventListener('mouseenter', () => {
          if (rotationTimer) {
            window.clearInterval(rotationTimer);
            rotationTimer = null;
          }
        });
        carousel.addEventListener('mouseleave', () => {
          startRotation();
        });

        render();
        startRotation();
      });
    };

    const setupBlogGuideLoadMore = () => {
      if (!blogGuideGrid || !blogGuideLoadMore) {
        return;
      }

      const guideItems = Array.from(blogGuideGrid.querySelectorAll('.blog-guide-card'));
      if (!guideItems.length) {
        blogGuideLoadMore.hidden = true;
        return;
      }

      const filterButtons = blogGuideFilters
        ? Array.from(blogGuideFilters.querySelectorAll('.blog-guide-filter'))
        : [];

      let activeCategory = 'all';
      let visibleCount = Math.min(BLOG_GUIDE_INITIAL_VISIBLE, guideItems.length);

      const renderGuideItems = () => {
        const filteredItems = guideItems.filter((item) => {
          if (activeCategory === 'all') {
            return true;
          }
          return item.dataset.category === activeCategory;
        });

        guideItems.forEach((item) => {
          const inFilter = filteredItems.includes(item);
          item.classList.toggle('is-hidden', !inFilter);
        });

        filteredItems.forEach((item, index) => {
          item.classList.toggle('is-hidden', index >= visibleCount);
        });

        const isDone = visibleCount >= filteredItems.length;
        blogGuideLoadMore.hidden = isDone;
        blogGuideLoadMore.disabled = isDone;
      };

      const setActiveFilter = (nextCategory) => {
        activeCategory = nextCategory;
        const filteredCount = guideItems.filter((item) => {
          return activeCategory === 'all' || item.dataset.category === activeCategory;
        }).length;
        visibleCount = Math.min(BLOG_GUIDE_INITIAL_VISIBLE, filteredCount);

        filterButtons.forEach((button) => {
          const isActive = button.dataset.category === activeCategory;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });

        renderGuideItems();
      };

      filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
          setActiveFilter(button.dataset.category || 'all');
        });
      });

      blogGuideLoadMore.addEventListener('click', () => {
        const filteredCount = guideItems.filter((item) => {
          return activeCategory === 'all' || item.dataset.category === activeCategory;
        }).length;
        visibleCount = Math.min(filteredCount, visibleCount + BLOG_GUIDE_LOAD_STEP);
        renderGuideItems();
      });

      setActiveFilter(activeCategory);
    };

    const setupHomeGuideLoadMore = () => {
      if (!homeGuideGrid || !homeGuideLoadMore) {
        return;
      }

      const guideItems = Array.from(homeGuideGrid.querySelectorAll('[data-home-guide-item]'));
      if (!guideItems.length) {
        homeGuideLoadMore.hidden = true;
        return;
      }

      const filterButtons = homeGuideFilters
        ? Array.from(homeGuideFilters.querySelectorAll('.blog-guide-filter'))
        : [];

      let activeCategory = 'all';
      let visibleCount = Math.min(HOME_GUIDE_INITIAL_VISIBLE, guideItems.length);

      const renderHomeGuideItems = () => {
        const filteredItems = guideItems.filter((item) => {
          if (activeCategory === 'all') {
            return true;
          }
          return item.dataset.category === activeCategory;
        });

        guideItems.forEach((item) => {
          const inFilter = filteredItems.includes(item);
          item.classList.toggle('is-hidden', !inFilter);
        });

        filteredItems.forEach((item, index) => {
          item.classList.toggle('is-hidden', index >= visibleCount);
        });

        const isDone = visibleCount >= filteredItems.length;
        homeGuideLoadMore.hidden = isDone;
        homeGuideLoadMore.disabled = isDone;
      };

      const setActiveFilter = (nextCategory) => {
        activeCategory = nextCategory;
        const filteredCount = guideItems.filter((item) => {
          return activeCategory === 'all' || item.dataset.category === activeCategory;
        }).length;
        visibleCount = Math.min(HOME_GUIDE_INITIAL_VISIBLE, filteredCount);

        filterButtons.forEach((button) => {
          const isActive = button.dataset.category === activeCategory;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });

        renderHomeGuideItems();
      };

      filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
          setActiveFilter(button.dataset.category || 'all');
        });
      });

      homeGuideLoadMore.addEventListener('click', () => {
        const filteredCount = guideItems.filter((item) => {
          return activeCategory === 'all' || item.dataset.category === activeCategory;
        }).length;
        visibleCount = Math.min(filteredCount, visibleCount + HOME_GUIDE_LOAD_STEP);
        renderHomeGuideItems();
      });

      setActiveFilter(activeCategory);
    };

    const setupBlogFieldFilters = () => {
      if (!blogFieldGrid || !blogFieldFilters) {
        return;
      }

      const fieldItems = Array.from(blogFieldGrid.querySelectorAll('.blog-field-card'));
      const filterButtons = Array.from(blogFieldFilters.querySelectorAll('.blog-guide-filter'));

      if (!fieldItems.length || !filterButtons.length) {
        if (blogFieldLoadMore) {
          blogFieldLoadMore.hidden = true;
          blogFieldLoadMore.disabled = true;
        }
        return;
      }

      let activeCategory = 'all';
      let visibleCount = Math.min(BLOG_FIELD_INITIAL_VISIBLE, fieldItems.length);

      const renderFieldItems = () => {
        const filteredItems = fieldItems.filter((item) => {
          return activeCategory === 'all' || item.dataset.category === activeCategory;
        });

        fieldItems.forEach((item) => {
          const inFilter = filteredItems.includes(item);
          item.classList.toggle('is-hidden', !inFilter);
        });

        filteredItems.forEach((item, index) => {
          item.classList.toggle('is-hidden', index >= visibleCount);
        });

        if (blogFieldLoadMore) {
          const isDone = visibleCount >= filteredItems.length;
          blogFieldLoadMore.hidden = isDone;
          blogFieldLoadMore.disabled = isDone;
        }
      };

      const setActiveFilter = (nextCategory) => {
        activeCategory = nextCategory;

        const filteredCount = fieldItems.filter((item) => {
          return activeCategory === 'all' || item.dataset.category === activeCategory;
        }).length;
        visibleCount = Math.min(BLOG_FIELD_INITIAL_VISIBLE, filteredCount);

        filterButtons.forEach((button) => {
          const isActive = button.dataset.category === nextCategory;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });

        renderFieldItems();
      };

      filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
          setActiveFilter(button.dataset.category || 'all');
        });
      });

      if (blogFieldLoadMore) {
        blogFieldLoadMore.addEventListener('click', () => {
          const filteredCount = fieldItems.filter((item) => {
            return activeCategory === 'all' || item.dataset.category === activeCategory;
          }).length;
          visibleCount = Math.min(filteredCount, visibleCount + BLOG_FIELD_LOAD_STEP);
          renderFieldItems();
        });
      }

      setActiveFilter('all');
    };

    const setupBlogTopicCards = () => {
      if (!blogTopicCards.length) {
        return;
      }

      blogTopicCards.forEach((card) => {
        card.addEventListener('click', (event) => {
          const href = card.getAttribute('href') || '';
          if (!href.startsWith('#')) {
            return;
          }

          const targetSection = document.querySelector(href);
          if (!targetSection) {
            return;
          }

          event.preventDefault();

          const filterGroup = card.dataset.filterGroup;
          const filterTarget = card.dataset.filterTarget;

          if (filterGroup === 'guide' && filterTarget && blogGuideFilters) {
            const button = blogGuideFilters.querySelector(`.blog-guide-filter[data-category="${filterTarget}"]`);
            button?.click();
          }

          if (filterGroup === 'field' && filterTarget && blogFieldFilters) {
            const button = blogFieldFilters.querySelector(`.blog-guide-filter[data-category="${filterTarget}"]`);
            button?.click();
          }

          blogTopicCards.forEach((topicCard) => {
            topicCard.classList.toggle('is-active', topicCard === card);
          });

          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    };

    const closeMobileMenu = () => {
      if (!navLinks || !navToggle) {
        return;
      }
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', '메뉴 열기');
      navSubmenuToggles.forEach((toggle) => {
        toggle.closest('.nav-item-has-children')?.classList.remove('submenu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', `${toggle.dataset.menuLabel || '하위'} 하위 메뉴 열기`);
      });
    };

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
      });
    }

    navSubmenuToggles.forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const parentItem = toggle.closest('.nav-item-has-children');
        if (!parentItem) {
          return;
        }
        const isOpen = parentItem.classList.toggle('submenu-open');
        if (isOpen) {
          toggle.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
          toggle.setAttribute('aria-label', `${toggle.dataset.menuLabel || '하위'} 하위 메뉴 닫기`);
        } else {
          toggle.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', `${toggle.dataset.menuLabel || '하위'} 하위 메뉴 열기`);
        }
      });
    });

    navSectionLinks.forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    document.querySelectorAll('a[href*="booking.naver.com/booking/10/bizes/1663159"], a[href*="pcmap.place.naver.com/place/2041312316"]').forEach((link) => {
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
      { toggle: dateAnniversaryToggle, panel: dateAnniversaryPanel, eventName: 'toggle_date_anniversary_panel' },
      { toggle: popupExhibitToggle, panel: popupExhibitPanel, eventName: 'toggle_popup_exhibit_panel' }
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

      toggleEl.addEventListener('click', (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest('.feature-card-link')) {
          return;
        }
        togglePanel();
      });
      toggleEl.addEventListener('keydown', (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest('.feature-card-link')) {
          return;
        }
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
      return '이용안내';
    };

    const getFilteredUseCaseItems = () => {
      return useCaseItems.filter((item) => {
        const contentType = item.contentType || classifyUseCaseType(item);
        return useCaseActiveCategory === 'all' || contentType === useCaseActiveCategory;
      });
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
            <span class="author">— ${escapeHtml(contentType)}</span>
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

    const updateUseCaseControls = (filteredItems = getFilteredUseCaseItems()) => {
      if (!useCaseControls || !useCaseLoadMore) {
        return;
      }

      const isDone = useCaseVisibleCount >= filteredItems.length;
      useCaseControls.hidden = isDone;
      useCaseLoadMore.hidden = isDone;
      useCaseLoadMore.disabled = isDone;
    };

    const renderUseCasePage = () => {
      if (!useCaseItems.length) {
        return;
      }

      const filteredItems = getFilteredUseCaseItems();
      if (!filteredItems.length) {
        useCasesGrid.innerHTML = '';
        if (rssStatus) {
          rssStatus.textContent = '선택한 카테고리의 글이 없습니다.';
          rssStatus.hidden = false;
        }
        updateUseCaseControls(filteredItems);
        return;
      }

      const visibleItems = filteredItems.slice(0, Math.min(useCaseVisibleCount, filteredItems.length));
      renderUseCases(visibleItems);
      updateUseCaseControls(filteredItems);
    };

    const setupUseCaseFilters = () => {
      if (!useCaseFilters) {
        return;
      }

      const filterButtons = Array.from(useCaseFilters.querySelectorAll('.blog-guide-filter'));
      if (!filterButtons.length) {
        return;
      }

      const setActiveFilter = (nextCategory) => {
        useCaseActiveCategory = nextCategory;
        useCaseVisibleCount = USECASE_INITIAL_VISIBLE;

        filterButtons.forEach((button) => {
          const isActive = button.dataset.category === nextCategory;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });

        renderUseCasePage();
      };

      filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
          setActiveFilter(button.dataset.category || 'all');
        });
      });
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

    const normalizeUseCaseLink = (rawLink) => {
      if (!rawLink) {
        return '';
      }

      try {
        const url = new URL(rawLink, window.location.origin);
        if (/(^|\.)blog\.naver\.com$/i.test(url.hostname)) {
          url.search = '';
          url.hash = '';
        }
        return url.href.replace(/\/$/, '');
      } catch (error) {
        return rawLink.trim();
      }
    };

    const mergeUseCaseItems = (...groups) => {
      const merged = new Map();

      groups.flat().forEach((item) => {
        const normalizedLink = normalizeUseCaseLink(item?.link || '');
        if (!item || !normalizedLink) {
          return;
        }

        const normalizedItem = {
          ...item,
          link: normalizedLink
        };

        const existing = merged.get(normalizedLink);
        if (!existing) {
          merged.set(normalizedLink, normalizedItem);
          return;
        }

        const candidateTime = getItemTimestamp(normalizedItem);
        const existingTime = getItemTimestamp(existing);

        if (candidateTime > existingTime) {
          merged.set(normalizedLink, {
            ...existing,
            ...normalizedItem
          });
          return;
        }

        merged.set(normalizedLink, {
          ...normalizedItem,
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

    const getUseCaseSourceSignature = (items) => {
      if (!Array.isArray(items) || !items.length) {
        return 'empty';
      }

      return items
        .slice(0, 5)
        .map((item) => `${normalizeUseCaseLink(item.link || '')}::${item.pubDate || item.date || ''}::${item.title || ''}`)
        .join('|');
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
      const embeddedSignature = getUseCaseSourceSignature(embeddedItems);

      if (embeddedItems.length > 0) {
        useCaseItems = embeddedItems.slice(0, 18);
        useCaseVisibleCount = USECASE_INITIAL_VISIBLE;
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
          const sourceSignature = parsed?.sourceSignature || '';
          if (!ts || !items.length) {
            return [];
          }
          if (embeddedSignature && sourceSignature && embeddedSignature !== sourceSignature) {
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
            sourceSignature: embeddedSignature,
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
          useCaseVisibleCount = USECASE_INITIAL_VISIBLE;
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
          useCaseVisibleCount = USECASE_INITIAL_VISIBLE;
          renderUseCasePage();
          return;
        }

        const cachedItems = readUseCaseCache();
        if (cachedItems.length > 0) {
          useCaseItems = cachedItems.slice(0, 18);
          useCaseVisibleCount = USECASE_INITIAL_VISIBLE;
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

    if (useCaseLoadMore) {
      useCaseLoadMore.addEventListener('click', () => {
        const filteredItems = getFilteredUseCaseItems();
        useCaseVisibleCount = Math.min(filteredItems.length, useCaseVisibleCount + USECASE_LOAD_STEP);
        renderUseCasePage();
      });
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth > 640) {
        closeMobileMenu();
      }
      if (useCaseItems.length > 0) {
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
    setupSpaceGalleryCarousel();
    setupLightboxSwipe();
    setupBlogGuideMediaCarousels();
    setupBlogGuideCategoryCarousels();
    setupBlogGuideLoadMore();
    setupHomeGuideLoadMore();
    setupBlogFieldFilters();
    setupBlogTopicCards();
    setupUseCaseFilters();
    setupPostShare();
    setupPostReactions();
    setupRelatedCarousels();
    setupPostMediaCarousels();
    loadUseCasesFromRss();
