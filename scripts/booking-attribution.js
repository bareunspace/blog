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

    var category = document.querySelector('meta[name="article:section"]');
    var value = category ? category.getAttribute('content') || '' : '';
    if (/스터디|소모임/.test(value)) return 'study_group';
    if (/면접/.test(value)) return 'interview';
    if (/미팅|업무|상담/.test(value)) return 'meeting_work';
    if (/프라이빗/.test(value)) return 'private_time';
    return 'unspecified';
  }

  function bookingUrl(purpose) {
    var params = new URLSearchParams();
    params.set('purpose', purpose);
    params.set('source', window.location.pathname || '/');
    return '/booking/?' + params.toString();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.indexOf('/booking') === 0) return;

    var purpose = inferPurpose();
    var naverUrl = 'https://m.place.naver.com/place/2041312316/ticket';

    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = (link.getAttribute('href') || '').trim();
      var isNaverBooking = href === naverUrl || href === naverUrl + '/';
      var isBookingPage = href === '/booking/' || href === '/booking';
      if (!isNaverBooking && !isBookingPage) return;

      link.setAttribute('href', bookingUrl(purpose));
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.addEventListener('click', function () {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'booking_intent', {
            purpose: purpose,
            source_path: window.location.pathname || '/',
            link_text: (link.textContent || '').trim().slice(0, 80)
          });
        }
      });
    });
  });
})();
