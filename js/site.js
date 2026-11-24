/* Delmix Engineering - site behaviour. No dependencies. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, w = window;
  root.classList.remove('no-js');
  root.classList.add('js');

  var mq = function (q) { return w.matchMedia ? w.matchMedia(q).matches : false; };
  var reduced = mq('(prefers-reduced-motion: reduce)');
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var dl = w.dataLayer = w.dataLayer || [];
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---------- Header: solid state + scroll progress ---------- */
  var hdr = $('.hdr'), bar = $('.hdr-bar');
  function onScroll() {
    var y = w.scrollY || w.pageYOffset || 0;
    if (hdr) hdr.classList.toggle('solid', y > 24 || hdr.hasAttribute('data-solid'));
    if (bar) {
      var max = root.scrollHeight - w.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Desktop mega menu ---------- */
  var megaBtn = $('.nav [aria-controls="mega"]'), megaLi = megaBtn && megaBtn.closest('li');
  var canHover = mq('(hover: hover) and (pointer: fine)');
  function setMega(open) {
    if (!hdr || !megaBtn) return;
    hdr.classList.toggle('mega-open', open);
    megaBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (megaBtn) {
    var hoverAt = 0;
    megaBtn.addEventListener('click', function () {
      var open = megaBtn.getAttribute('aria-expanded') === 'true';
      if (open && Date.now() - hoverAt < 500) return; // hover just opened it: keep open
      setMega(!open);
    });
    if (canHover) {
      var t;
      megaLi.addEventListener('mouseenter', function () { clearTimeout(t); if (megaBtn.getAttribute('aria-expanded') !== 'true') hoverAt = Date.now(); setMega(true); });
      megaLi.addEventListener('mouseleave', function () { t = setTimeout(function () { setMega(false); }, 120); });
    }
    megaLi.addEventListener('focusout', function (e) { if (!megaLi.contains(e.relatedTarget)) setMega(false); });
    d.addEventListener('click', function (e) { if (!megaLi.contains(e.target)) setMega(false); });
  }

  /* ---------- Mobile menu with focus trap ---------- */
  var burger = $('.burger'), mnav = $('#mnav'), subBtn = $('#mnav [aria-controls="msub"]');
  function focusables() {
    return [burger].concat($$('a[href], button:not([disabled])', mnav)).filter(function (el) { return el.offsetParent !== null || el === burger; });
  }
  function setMenu(open) {
    if (!hdr || !burger) return;
    hdr.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    d.body.style.overflow = open ? 'hidden' : '';
    if (mnav) mnav.inert = !open;
    if (open) { setTimeout(function () { var f = $('a, button', mnav); if (f) f.focus(); }, 60); } else { burger.focus(); }
  }
  if (burger && mnav) {
    if ('inert' in mnav) mnav.inert = true;
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    mnav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    burger.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && e.shiftKey && hdr.classList.contains('menu-open')) { e.preventDefault(); var f = focusables(); f[f.length - 1].focus(); }
    });
    w.addEventListener('resize', function () { if (w.innerWidth > 960 && hdr.classList.contains('menu-open')) setMenu(false); });
  }
  if (subBtn) {
    subBtn.addEventListener('click', function () {
      var open = subBtn.getAttribute('aria-expanded') !== 'true';
      subBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      hdr.classList.toggle('sub-open', open);
    });
  }
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (hdr && hdr.classList.contains('menu-open')) setMenu(false);
    else if (hdr && hdr.classList.contains('mega-open')) { setMega(false); megaBtn.focus(); }
  });

  /* ---------- Text reveals (photos are never hidden) ---------- */
  var rv = $$('[data-rv]');
  if (reduced || !('IntersectionObserver' in w)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    // Safety net: anything still hidden after load and a short delay is shown.
    w.addEventListener('load', function () {
      setTimeout(function () {
        rv.forEach(function (el) { if (el.getBoundingClientRect().top < w.innerHeight) el.classList.add('in'); });
      }, 1200);
    });
  }

  /* ---------- Background video ---------- */
  var small = w.innerWidth <= 640;
  $$('video[data-bgv]').forEach(function (v) {
    var sec = v.parentElement, btn = $('.mctl', sec), userPaused = false;
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    if (reduced || saveData) { if (btn) btn.hidden = true; return; } // poster image only
    var webm = v.getAttribute('data-webm'), mp4 = small ? v.getAttribute('data-mp4-sm') : v.getAttribute('data-mp4');
    if (webm && !small) { var s1 = d.createElement('source'); s1.src = webm; s1.type = 'video/webm'; v.appendChild(s1); }
    var s2 = d.createElement('source'); s2.src = mp4; s2.type = 'video/mp4'; v.appendChild(s2);
    var play = function () { if (userPaused) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if ('IntersectionObserver' in w) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) play(); else v.pause(); });
      }, { threshold: 0.15 }).observe(v);
    } else { play(); }
    if (btn) btn.addEventListener('click', function () {
      userPaused = !userPaused;
      btn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      btn.querySelector('.lbl').textContent = userPaused ? 'Play video' : 'Pause video';
      if (userPaused) v.pause(); else play();
    });
  });

  /* ---------- Marquee pause ---------- */
  $$('.marq-wrap').forEach(function (wrap) {
    var btn = $('.mctl', wrap), m = $('.marq', wrap);
    if (!btn || !m) return;
    if (reduced) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      var p = !m.classList.contains('paused');
      m.classList.toggle('paused', p);
      btn.setAttribute('aria-pressed', p ? 'true' : 'false');
      btn.querySelector('.lbl').textContent = p ? 'Play' : 'Pause';
    });
  });

  /* ---------- Tabs (WAI-ARIA tabs pattern) ---------- */
  $$('.tabs').forEach(function (box) {
    var tabs = $$('[role="tab"]', box), panels = $$('[role="tabpanel"]', box);
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = null;
        if (e.key === 'ArrowRight') k = (i + 1) % n;
        else if (e.key === 'ArrowLeft') k = (i - 1 + n) % n;
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = n - 1;
        if (k !== null) { e.preventDefault(); select(k, true); }
      });
    });
    select(0);
  });

  /* ---------- Campaign parameters (kept for the visit, sent with enquiries) ---------- */
  var camp = {};
  try {
    camp = JSON.parse(w.sessionStorage.getItem('dx_camp') || '{}');
    var qs = new URLSearchParams(location.search), found = false;
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) {
      var val = qs.get(k); if (val) { camp[k] = val.slice(0, 200); found = true; }
    });
    if (found) w.sessionStorage.setItem('dx_camp', JSON.stringify(camp));
  } catch (e) { /* storage unavailable: carry on without it */ }

  /* ---------- Enquiry forms ---------- */
  $$('form.js-enquiry').forEach(function (form) {
    var err = $('.formerr', form), ok = form.nextElementSibling, submit = $('button[type="submit"]', form);
    var endpoint = form.getAttribute('data-endpoint') || '', formId = form.getAttribute('data-form-id') || 'enquiry';
    var f = form.elements, v = function (k) { return (f[k] && f[k].value || '').trim(); };
    // preselect topic from ?topic=
    try {
      var want = new URLSearchParams(location.search).get('topic');
      if (want && f.topic && f.topic.options) $$('option', f.topic).forEach(function (o) { if (o.textContent.toLowerCase() === want.toLowerCase()) f.topic.value = o.textContent; });
    } catch (e) {}
    function invalid(el, msg) { el.setAttribute('aria-invalid', 'true'); el.focus(); err.textContent = msg; return false; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
      err.textContent = '';
      if (v('website')) return; // honeypot
      var req = $$('[required]', form);
      for (var i = 0; i < req.length; i++) {
        var el = req[i], val = (el.value || '').trim(), lab = (form.querySelector('label[for="' + el.id + '"]') || {}).textContent || 'this field';
        lab = lab.replace('*', '').trim().toLowerCase();
        if (!val) return invalid(el, el.name === 'message' ? 'Please add a short message.' : 'Please enter your ' + lab + '.');
        if (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) return invalid(el, 'Please enter a valid email address.');
      }
      var first = v('name').split(' ')[0], topic = v('topic') || form.getAttribute('data-topic') || 'General enquiry';
      var done = function (mailto) {
        var ev = { event: 'generate_lead', form_id: formId, enquiry_topic: topic };
        Object.keys(camp).forEach(function (k) { ev[k] = camp[k]; });
        dl.push(ev);
        $('.okname', ok).textContent = first;
        var mail = $('.okmail', ok);
        if (mailto) { mail.href = mailto; mail.parentNode.parentNode.hidden = false; $('.oksent', ok).hidden = true; }
        else { mail.parentNode.parentNode.hidden = true; $('.oksent', ok).hidden = false; }
        form.hidden = true; ok.hidden = false; ok.focus();
      };
      if (endpoint) {
        var data = new FormData(form);
        Object.keys(camp).forEach(function (k) { data.append(k, camp[k]); });
        data.append('page', location.pathname);
        submit.disabled = true;
        fetch(endpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(r.status); done(null); })
          .catch(function () { err.textContent = 'Sorry, that didn’t send. Please call 1300 957 772 or email info@delmix.com.au.'; })
          .then(function () { submit.disabled = false; });
      } else {
        var lines = ['Enquiry: ' + topic, 'Name: ' + v('name'), 'Company: ' + v('company'), 'Email: ' + v('email'), 'Phone: ' + v('phone')];
        if (f.fleet) lines.push('Fleet size: ' + v('fleet'));
        lines.push('', v('message'));
        if (camp.utm_campaign || camp.utm_source) lines.push('', 'Source: ' + [camp.utm_source, camp.utm_medium, camp.utm_campaign].filter(Boolean).join(' / '));
        var subject = form.getAttribute('data-subject') || ('Website enquiry: ' + topic);
        done('mailto:info@delmix.com.au?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n')));
      }
    });
    var edit = $('.okedit', ok);
    if (edit) edit.addEventListener('click', function () { ok.hidden = true; form.hidden = false; if (f.name) f.name.focus(); });
  });

  /* ---------- Click-to-play product video ---------- */
  $$('.vid').forEach(function (box) {
    var v = $('video', box), btn = $('.vid-play', box);
    if (!v || !btn) return;
    v.controls = false;
    btn.addEventListener('click', function () {
      box.classList.add('playing'); v.controls = true;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      dl.push({ event: 'video_start', video_title: 'CreteAway+', page_path: location.pathname });
    });
    v.addEventListener('ended', function () { dl.push({ event: 'video_complete', video_title: 'CreteAway+', page_path: location.pathname }); });
  });

  /* ---------- Jump to the form: focus the first field ---------- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#enquiry"]');
    if (!a) return;
    var t = d.getElementById('enquiry'), first = t && $('input:not([type="hidden"]), select, textarea', t);
    dl.push({ event: 'cta_click', cta_text: a.textContent.trim(), page_path: location.pathname });
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 500);
  });

  /* ---------- Contact click tracking ---------- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!a) return;
    var tel = a.getAttribute('href').indexOf('tel:') === 0;
    dl.push({ event: tel ? 'click_phone' : 'click_email', link_url: a.getAttribute('href'), page_path: location.pathname });
  });

  /* ---------- Product sub-nav: keep the current item in view ---------- */
  var pon = $('.pnav a.on'), pul = pon && pon.closest('ul');
  if (pul && pul.scrollWidth > pul.clientWidth) pul.scrollLeft = Math.max(0, pon.offsetLeft - 20);

  /* ---------- Copyright year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
