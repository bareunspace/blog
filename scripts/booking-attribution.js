(function () {
  'use strict';

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
    var params = new URLSearchParams();
    params.set('purpose', purpose);
    params.set('source', window.location.pathname || '/');
    return '/booking/?' + params.toString();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var path = window.location.pathname || '/';
    var naverUrl = 'https://m.place.naver.com/place/2041312316/ticket';

    if (path.indexOf('/booking') === 0) {
      var query = new URLSearchParams(window.location.search);
      var bookingPurpose = query.get('purpose') || 'unspecified';
      var bookingSource = query.get('source') || document.referrer || 'direct';

      document.querySelectorAll('a[href]').forEach(function (link) {
        var href = (link.getAttribute('href') || '').trim();
        if (href !== naverUrl && href !== naverUrl + '/') return;
        link.addEventListener('click', function (event) {
          var target = link.href;
          event.preventDefault();
          track('naver_booking_click', {
            purpose: bookingPurpose,
            source_path: bookingSource,
            cta_position: link.getAttribute('data-cta') || 'unknown',
            page_path: path
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
      var isNaverBooking = href === naverUrl || href === naverUrl + '/';
      var isBookingPage = href === '/booking/' || href === '/booking';
      if (!isNaverBooking && !isBookingPage) return;

      var target = bookingUrl(purpose);
      link.setAttribute('href', target);
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.addEventListener('click', function (event) {
        event.preventDefault();
        track('booking_intent', {
          purpose: purpose,
          source_path: path,
          link_text: (link.textContent || '').trim().slice(0, 80)
        }, function () {
          window.location.href = target;
        });
      });
    });
  });
})();
