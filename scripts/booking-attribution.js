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

  function initAttribution(path) {
    var firstTouch = sessionGet(ATTR_KEYS.first);
    if (!firstTouch) {
      sessionSet(ATTR_KEYS.first, path);
      return;
    }

    if (path.indexOf('/booking') !== 0 && path !== firstTouch) {
      sessionSet(ATTR_KEYS.assist, path);
    }
  }

  function attributionParams(fallbackLastTouch) {
    return {
      first_touch_path: sessionGet(ATTR_KEYS.first) || fallbackLastTouch || '',
      assist_path: sessionGet(ATTR_KEYS.assist) || '',
      last_touch_path: sessionGet(ATTR_KEYS.last) || fallbackLastTouch || ''
    };
  }

  function inferPurpose() {
    var path = window.location.pathname || '/';
    var body = document.body;
    var pageId = body && body.getAttribute('data-page-id');
    if (pageId === 'study' || /(^|\/)study(\/|\.|$)/.test(path)) return 'study_group';
    if (pageId === 'interview' || /(^|\/)interview(\/|\.|$)/.test(path) || /ai-interview/.test(path)) return 'interview';
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
    if (callback) {
      payload.event_callback = done;
      payload.event_timeout = 800;
    }
    window.gtag('event', eventName, payload);
    if (callback) window.setTimeout(done, 900);
  }

  function bookingUrl(purpose) {
    var currentPath = window.location.pathname || '/';
    var attribution = attributionParams(currentPath);
    var params = new URLSearchParams();
    params.set('purpose', purpose);
    params.set('source', currentPath);
    if (attribution.first_touch_path) params.set('first', attribution.first_touch_path);
    if (attribution.assist_path) params.set('assist', attribution.assist_path);
    if (attribution.last_touch_path) params.set('last', attribution.last_touch_path);
    return '/booking/?' + params.toString();
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

    if (path.indexOf('/booking') === 0) {
      var query = new URLSearchParams(window.location.search);
      var bookingPurpose = query.get('purpose') || 'unspecified';
      var bookingSource = query.get('source') || document.referrer || 'direct';
      var queryFirst = query.get('first') || '';
      var queryAssist = query.get('assist') || '';
      var queryLast = query.get('last') || '';

      if (queryFirst) sessionSet(ATTR_KEYS.first, queryFirst);
      if (queryAssist) sessionSet(ATTR_KEYS.assist, queryAssist);
      if (queryLast) sessionSet(ATTR_KEYS.last, queryLast);
      if (!sessionGet(ATTR_KEYS.last) && bookingSource && bookingSource !== 'direct') {
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
            booking_destination: bookingMeta.destination
          }, function () {
            window.location.href = target;
          });
        });
      });
      return;
    }

    var purpose = inferPurpose();
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = (link.getAttribute('href') || '').trim();
      var isNaverBooking = !!getNaverBookingMeta(href);
      var isBookingPage = href === '/booking/' || href === '/booking';
      if (!isNaverBooking && !isBookingPage) return;

      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.addEventListener('click', function (event) {
        var attribution;
        var target;
        sessionSet(ATTR_KEYS.last, path);
        attribution = attributionParams(path);
        target = bookingUrl(purpose);
        link.setAttribute('href', target);
        event.preventDefault();
        track('booking_intent', {
          purpose: purpose,
          source_path: path,
          first_touch_path: attribution.first_touch_path,
          assist_path: attribution.assist_path,
          last_touch_path: attribution.last_touch_path,
          link_text: (link.textContent || '').trim().slice(0, 80)
        }, function () {
          window.location.href = target;
        });
      });
    });
  });
})();
