(function () {
  'use strict';

  var NAVER_PLACE_ID = '2041312316';
  var NAVER_BIZ_ID = '1663159';
  var ATTR_KEYS = {
    first: 'bareunjari_first_touch_path',
    assist: 'bareunjari_assist_path',
    last: 'bareunjari_last_touch_path'
  };

  function sessionGet(key) {
    try {
      return window.sessionStorage.getItem(key) || '';
    } catch (e) {
      return '';
    }
  }

  function sessionSet(key, value) {
    if (!value) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      // Analytics attribution must never block the booking flow.
    }
  }

  function sessionRemove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      // Analytics attribution must never block the booking flow.
    }
  }

  function localPath(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.charAt(0) === '/') return raw.split(/[?#]/)[0] || '/';
    try {
      var url = new URL(raw, window.location.origin);
      if (url.origin === window.location.origin) return url.pathname || '/';
    } catch (e) {
      return '';
    }
    return '';
  }

  function isExcludedAttributionValue(value) {
    var path = localPath(value);
    return !!path && /^\/admin(?:[-\/.]|$)/.test(path);
  }

  function cleanAttributionValue(value) {
    return isExcludedAttributionValue(value) ? '' : String(value || '').trim();
  }

  function attributionSessionGet(key) {
    var value = sessionGet(key);
    if (isExcludedAttributionValue(value)) {
      sessionRemove(key);
      return '';
    }
    return value;
  }

  function isDebugMode() {
    try {
      var query = new URLSearchParams(window.location.search || '');
      return query.get('ga_debug') === '1' || query.get('debug_mode') === '1';
    } catch (e) {
      return false;
    }
  }

  function initAttribution(path) {
    if (isExcludedAttributionValue(path)) return;

    var firstTouch = attributionSessionGet(ATTR_KEYS.first);
    if (!firstTouch) {
      sessionSet(ATTR_KEYS.first, path);
      return;
    }

    if (path.indexOf('/booking') !== 0 && path !== firstTouch) {
      sessionSet(ATTR_KEYS.assist, path);
    }
  }

  function attributionParams(fallbackLastTouch) {
    var fallback = cleanAttributionValue(fallbackLastTouch);
    return {
      first_touch_path: attributionSessionGet(ATTR_KEYS.first) || fallback || '',
      assist_path: attributionSessionGet(ATTR_KEYS.assist) || '',
      last_touch_path: attributionSessionGet(ATTR_KEYS.last) || fallback || ''
    };
  }

  function interviewAuthParams() {
    return {
      interview_login_status: sessionGet('bareunjari_interview_login_status') || 'unknown',
      interview_auth_provider: sessionGet('bareunjari_interview_auth_provider') || sessionGet('bareunjari_interview_selected_provider') || 'unknown',
      interview_completed_count: Number(sessionGet('bareunjari_interview_completed_count') || 0),
      interview_resume_seen: sessionGet('bareunjari_interview_resume_seen') === '1'
    };
  }

  function inferPurpose() {
    var path = window.location.pathname || '/';
    var body = document.body;
    var pageId = body && body.getAttribute('data-page-id');
    if (pageId === 'study' || /(^|\/)study(\/|\.|$)/.test(path)) return 'study_group';
    if (pageId === 'interview' || pageId === 'ai_ready_check' || /(^|\/)interview(\/|\.|$)/.test(path) || /ai-interview/.test(path) || /ai-ready-check/.test(path)) return 'interview';
    if (pageId === 'meeting' || /(^|\/)meeting(\/|\.|$)/.test(path)) return 'meeting_work';
    if (pageId === 'private' || /(^|\/)private(\/|\.|$)/.test(path)) return 'private_time';

    var category = document.querySelector('meta[property="article:section"]');
    var value = category ? category.getAttribute('content') || '' : '';
    if (/스터디|소모임/.test(value)) return 'study_group';
    if (/면접/.test(value)) return 'interview';
    if (/미팅|업무|상담/.test(value)) return 'meeting_work';
    if (/프라이빗/.test(value)) return 'private_time';
    return 'unspecified';
  }

  function inferPurposeFromLink(link) {
    var explicit = (link.getAttribute('data-booking-purpose') || '').trim();
    if (explicit) return explicit;

    var text = (link.textContent || '').replace(/\s+/g, ' ').trim();
    if (/면접|발표/.test(text)) return 'interview';
    if (/스터디|팀\s*프로젝트|팀플|소모임/.test(text)) return 'study_group';
    if (/미팅|업무|상담|회의/.test(text)) return 'meeting_work';
    if (/개인\s*작업|집중|프라이빗|개인시간/.test(text)) return 'private_time';
    return '';
  }

  function track(eventName, params, callback) {
    if (typeof window.gtag !== 'function') {
      if (callback) callback();
      return;
    }
    var finished = false;
    var done = function () {
      if (finished) return;
      finished = true;
      if (callback) callback();
    };
    var payload = Object.assign({}, params || {});
    if (isDebugMode()) payload.debug_mode = true;
    if (callback) {
      payload.event_callback = done;
      payload.event_timeout = 800;
    }
    window.gtag('event', eventName, payload);
    if (callback) window.setTimeout(done, 900);
  }

  function bookingUrl(purpose) {
    var currentPath = cleanAttributionValue(window.location.pathname || '/') || '/';
    var attribution = attributionParams(currentPath);
    var params = new URLSearchParams();
    params.set('purpose', purpose || 'unspecified');
    params.set('source', currentPath);
    if (attribution.first_touch_path) params.set('first', attribution.first_touch_path);
    if (attribution.assist_path) params.set('assist', attribution.assist_path);
    if (attribution.last_touch_path) params.set('last', attribution.last_touch_path);
    return '/booking/?' + params.toString();
  }

  function getBookingPageMeta(href) {
    if (!href) return null;
    try {
      var url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return null;
      if (url.pathname.replace(/\/+$/, '') !== '/booking') return null;
      return {
        purpose: (url.searchParams.get('purpose') || '').trim()
      };
    } catch (e) {
      return null;
    }
  }

  function getNaverBookingMeta(href) {
    if (!href) return null;

    var url;
    try {
      url = new URL(href, window.location.origin);
    } catch (e) {
      return null;
    }

    var host = url.hostname.toLowerCase();
    var path = url.pathname.replace(/\/+$/, '');

    if (host === 'm.place.naver.com' && path === '/place/' + NAVER_PLACE_ID + '/ticket') {
      return {
        destination: 'naver_place_ticket',
        item_id: 'place_ticket'
      };
    }

    if (host === 'booking.naver.com') {
      var itemMatch = path.match(new RegExp('^/booking/10/bizes/' + NAVER_BIZ_ID + '/items/(\\d+)$'));
      if (itemMatch) {
        return {
          destination: 'naver_booking_item',
          item_id: itemMatch[1]
        };
      }
    }

    return null;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var path = window.location.pathname || '/';
    initAttribution(path);

    if (isExcludedAttributionValue(path)) return;

    if (path.indexOf('/booking') === 0) {
      var query = new URLSearchParams(window.location.search);
      var bookingPurpose = query.get('purpose') || 'unspecified';
      var bookingSource = cleanAttributionValue(query.get('source') || document.referrer || '') || 'direct';
      var queryFirst = cleanAttributionValue(query.get('first') || '');
      var queryAssist = cleanAttributionValue(query.get('assist') || '');
      var queryLast = cleanAttributionValue(query.get('last') || '');

      if (queryFirst) sessionSet(ATTR_KEYS.first, queryFirst);
      if (queryAssist) sessionSet(ATTR_KEYS.assist, queryAssist);
      if (queryLast) sessionSet(ATTR_KEYS.last, queryLast);
      if (!attributionSessionGet(ATTR_KEYS.last) && bookingSource !== 'direct') {
        sessionSet(ATTR_KEYS.last, bookingSource);
      }

      document.querySelectorAll('a[href]').forEach(function (link) {
        var href = (link.getAttribute('href') || '').trim();
        var bookingMeta = getNaverBookingMeta(href);
        if (!bookingMeta) return;

        link.addEventListener('click', function (event) {
          var target = link.href;
          var attribution = attributionParams(bookingSource);
          event.preventDefault();
          track('naver_booking_click', {
            purpose: bookingPurpose,
            source_path: bookingSource,
            first_touch_path: attribution.first_touch_path,
            assist_path: attribution.assist_path,
            last_touch_path: attribution.last_touch_path,
            cta_position: link.getAttribute('data-cta') || 'unknown',
            page_path: path,
            item_id: bookingMeta.item_id,
            booking_destination: bookingMeta.destination,
            ...interviewAuthParams()
          }, function () {
            window.location.href = target;
          });
        });
      });
      return;
    }

    var pagePurpose = inferPurpose();
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = (link.getAttribute('href') || '').trim();
      var naverBookingMeta = getNaverBookingMeta(href);
      var bookingPageMeta = getBookingPageMeta(href);
      if (!naverBookingMeta && !bookingPageMeta) return;

      var linkPurpose = (bookingPageMeta && bookingPageMeta.purpose) || inferPurposeFromLink(link) || pagePurpose;

      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.addEventListener('click', function (event) {
        var attribution;
        var target;
        sessionSet(ATTR_KEYS.last, path);
        attribution = attributionParams(path);
        target = bookingUrl(linkPurpose);
        link.setAttribute('href', target);
        event.preventDefault();
        track('booking_intent', {
          purpose: linkPurpose,
          source_path: path,
          first_touch_path: attribution.first_touch_path,
          assist_path: attribution.assist_path,
          last_touch_path: attribution.last_touch_path,
          link_text: (link.textContent || '').trim().slice(0, 80),
          ...interviewAuthParams()
        }, function () {
          window.location.href = target;
        });
      });
    });
  });
})();
