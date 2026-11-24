/* Jennifer Otayza Nail Studio — luxe v4. Mejora progresiva: todo el contenido existe sin JavaScript. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get: (k, s = localStorage) => { try { return s.getItem(k); } catch (e) { return null; } },
    set: (k, v, s = localStorage) => { try { s.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };
  root.classList.add('has-js', 'js-ready');

  /* ---------- Paletas ---------- */
  const THEME_BG = { cerezo: '#FFF8F5', salvia: '#F7F6EE', champan: '#FFF9EF', malva: '#FBF6FA', noche: '#1D1119' };
  const themeButtons = $$('[data-theme-set]');
  const applyTheme = (name, save) => {
    if (!THEME_BG[name]) name = 'cerezo';
    if (save) { root.classList.add('theme-fade'); setTimeout(() => root.classList.remove('theme-fade'), 800); }
    root.setAttribute('data-theme', name);
    $('meta[name="theme-color"]')?.setAttribute('content', THEME_BG[name]);
    themeButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === name)));
    if (save) store.set('jo-theme', name);
    window.dispatchEvent(new CustomEvent('themechange', { detail: name }));
  };
  applyTheme(store.get('jo-theme') || 'cerezo', false);
  const themeBtn = $('.theme-btn'), themePop = $('.theme-pop');
  const toggleThemePop = open => {
    if (!themePop) return;
    themePop.hidden = !open; themeBtn.setAttribute('aria-expanded', String(open));
  };
  themeBtn?.addEventListener('click', e => { e.stopPropagation(); toggleThemePop(themePop.hidden); });
  themeButtons.forEach(b => b.addEventListener('click', () => applyTheme(b.dataset.themeSet, true)));
  document.addEventListener('click', e => { if (themePop && !themePop.hidden && !e.target.closest('[data-theme-switch]')) toggleThemePop(false); });

  /* ---------- Cabecera, progreso y menú ---------- */
  const top = $('.site-top');
  const progress = $('.scroll-progress i');
  const fab = $('.fab');
  const setHeadH = () => { if (top) root.style.setProperty('--head-h', top.offsetHeight + 'px'); };
  setHeadH();
  if ('ResizeObserver' in window && top) new ResizeObserver(setHeadH).observe(top);
  const menu = $('.menu-toggle'), nav = $('#main-nav');
  const disclosures = $$('[data-nav-disclosure]');
  const closePanels = except => disclosures.forEach(d => { if (d !== except) d.open = false; });
  const closeMenu = () => {
    menu?.setAttribute('aria-expanded', 'false'); nav?.classList.remove('open');
    document.body.classList.remove('navigation-open'); closePanels();
  };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open);
    document.body.classList.toggle('navigation-open', open);
    if (open) toggleThemePop(false); else closePanels();
  });
  const desktopNav = () => matchMedia('(min-width: 1181px)').matches;
  disclosures.forEach(d => {
    const summary = $('summary', d);
    let timer;
    d.addEventListener('toggle', () => { if (d.open) closePanels(d); });
    summary.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); d.open = true; closePanels(d); $('.nav-panel a', d)?.focus(); }
    });
    if (finePointer) {
      d.addEventListener('pointerenter', e => {
        if (!desktopNav() || e.pointerType !== 'mouse') return;
        clearTimeout(timer); timer = setTimeout(() => { closePanels(d); d.open = true; d.dataset.hover = '1'; }, 90);
      });
      d.addEventListener('pointerleave', e => {
        if (!desktopNav() || e.pointerType !== 'mouse') return;
        clearTimeout(timer); timer = setTimeout(() => { if (!d.contains(document.activeElement) || d.dataset.hover) { d.open = false; } delete d.dataset.hover; }, 260);
      });
      summary.addEventListener('click', e => {
        if (d.dataset.hover === '1' && desktopNav()) { e.preventDefault(); d.dataset.hover = '2'; }
      });
    }
    // Catálogo en el desplegable: la colección activa cambia el listado y la imagen
    const tabs = $$('[data-mega-tab]', d), panes = $$('[data-mega-pane]', d), shots = $$('[data-mega-visual]', d);
    const activate = id => {
      tabs.forEach(t => t.classList.toggle('is-active', t.dataset.megaTab === id));
      panes.forEach(p => p.classList.toggle('is-active', p.id === id));
      shots.forEach(s => s.classList.toggle('is-active', s.dataset.megaVisual === id));
    };
    tabs.forEach(t => { ['pointerenter', 'focus'].forEach(ev => t.addEventListener(ev, () => activate(t.dataset.megaTab))); });
    panes.forEach(p => p.addEventListener('focusin', () => activate(p.id)));
  });
  $$('.mega-list').forEach(ul => [...ul.children].forEach((li, i) => li.style.setProperty('--k', i)));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (themePop && !themePop.hidden) { toggleThemePop(false); themeBtn.focus(); return; }
    const openPanel = disclosures.find(p => p.open);
    if (openPanel) { e.preventDefault(); openPanel.open = false; $('summary', openPanel).focus(); }
    else if (nav?.classList.contains('open')) { e.preventDefault(); closeMenu(); menu?.focus(); }
  });
  nav?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) { closePanels(); if (!desktopNav()) closeMenu(); } });
  top?.addEventListener('focusout', e => { if (e.relatedTarget && !top.contains(e.relatedTarget)) closePanels(); });
  matchMedia('(min-width: 1181px)').addEventListener('change', closeMenu);

  /* ---------- Scroll: cabecera, progreso, parallax ---------- */
  const heroMedia = $('.hero-media');
  const hero = $('.hero');
  const arts = $$('.wm-art');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    top?.classList.toggle('is-scrolled', y > 40);
    const max = document.documentElement.scrollHeight - vh;
    progress?.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    fab?.classList.toggle('is-away', y > vh * 0.9);
    if (reduce) return;
    if (heroMedia && hero && y < hero.offsetHeight) heroMedia.style.setProperty('--py', (y * 0.22).toFixed(1) + 'px');
    arts.forEach(a => {
      const r = a.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const d = (r.top + r.height / 2 - vh / 2) / vh;
      a.style.setProperty('--ps', Math.max(-70, Math.min(70, -d * 90)).toFixed(1));
    });
    setHeadH();
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  $('.fab-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- Texto dividido por palabras ---------- */
  let wordIndex;
  const splitNode = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part;
          inner.style.setProperty('--wi', wordIndex++); w.append(inner); w.setAttribute('aria-hidden', 'true'); frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') splitNode(child);
    });
  };
  const splits = $$('[data-split]');
  splits.forEach(el => {
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    wordIndex = 0; splitNode(el); el.setAttribute('aria-label', label); el.classList.add('is-split');
    $$('.w', el).forEach(w => w.removeAttribute('aria-hidden'));
  });

  /* ---------- Revelado al hacer scroll ---------- */
  const revealTargets = $$('[data-reveal], [data-split], .wm-art, .fine-rule');
  const splashActive = root.classList.contains('splash-on');
  const heroDelay = splashActive ? 2900 : 0;
  const reveal = el => el.classList.add('is-in');
  if (reduce || !('IntersectionObserver' in window)) revealTargets.forEach(reveal);
  else {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); }
    }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(el => {
      if (el.closest('.hero') && heroDelay) { setTimeout(() => reveal(el), heroDelay); return; }
      io.observe(el);
    });
  }

  /* ---------- Contadores ---------- */
  const counters = $$('[data-count]');
  const runCounter = el => {
    const end = Number(el.dataset.count), prefix = el.dataset.prefix || '';
    if (reduce) { el.textContent = prefix + end; return; }
    const start = performance.now(), dur = 1600;
    const tick = now => {
      const t = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(end * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
    }), { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------- Inclinación y brillo al pasar el ratón ---------- */
  if (finePointer && !reduce) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * r.width).toFixed(0) + 'px');
        card.style.setProperty('--my', (y * r.height).toFixed(0) + 'px');
        card.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
    $$('.hero').forEach(h => h.addEventListener('pointermove', e => {
      const r = h.getBoundingClientRect();
      h.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      h.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }));
  }

  /* ---------- Portada: presentación de imágenes ---------- */
  const slides = $$('.hero-picture');
  if (slides.length > 1) {
    const dots = $$('[data-slide-go]'), link = $('[data-slide-link]');
    const now = $('[data-slide-now]'), title = $('[data-slide-title]'), sub = $('[data-slide-sub]');
    const note = $('[data-editorial-note]');
    const meta = [
      ['Sistemas de uñas', 'Ilustración editorial', 'sistemas-de-unas.html'],
      ['El estudio', 'Paseo Zorrilla, 362', 'estudio.html'],
      ['Manicura', 'Desde 12 €', 'manicura.html'],
      ['Cejas y pestañas', 'Desde 5 €', 'cejas-y-pestanas.html']
    ];
    const pauseBtn = $('.slide-pause');
    const heroEl = $('.hero');
    let index = 0, timer, paused = reduce, visible = true;
    const SLIDE_MS = 6500;
    heroEl.style.setProperty('--slide-time', SLIDE_MS + 'ms');
    const go = i => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => { if (n === index) s.setAttribute('data-active', ''); else s.removeAttribute('data-active'); });
      dots.forEach((d, n) => { if (n === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      if (now) now.textContent = String(index + 1).padStart(2, '0');
      const m = meta[index] || meta[0];
      if (title) title.textContent = m[0]; if (sub) sub.textContent = m[1]; if (link) link.setAttribute('href', m[2]);
      if (note) note.style.opacity = index === 0 ? 1 : 0;
      schedule();
    };
    const schedule = () => { clearTimeout(timer); if (!paused && visible) timer = setTimeout(() => go(index + 1), SLIDE_MS); };
    dots.forEach(d => d.addEventListener('click', () => go(Number(d.dataset.slideGo))));
    const setPaused = p => {
      paused = p; heroEl.classList.toggle('paused-slides', p);
      if (pauseBtn) { pauseBtn.setAttribute('aria-pressed', String(p)); pauseBtn.textContent = p ? '▶' : 'Ⅱ'; pauseBtn.setAttribute('aria-label', p ? 'Reanudar la presentación de imágenes' : 'Pausar la presentación de imágenes'); }
      schedule();
    };
    pauseBtn?.addEventListener('click', () => setPaused(!paused));
    if (reduce) setPaused(true);
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; schedule(); }, { threshold: 0.2 }).observe(heroEl);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; schedule(); });
    go(0);
  }

  /* ---------- Pétalos de cerezo (canvas) ---------- */
  const canvases = $$('canvas[data-petals]');
  if (canvases.length && !reduce) {
    const colors = () => { const cs = getComputedStyle(root); return [cs.getPropertyValue('--petal').trim() || '#F4B1AE', cs.getPropertyValue('--petal-2').trim() || '#FBD9D5']; };
    let palette = colors();
    window.addEventListener('themechange', () => { palette = colors(); });
    const shape = (ctx, s) => {
      ctx.beginPath(); ctx.moveTo(0, s);
      ctx.bezierCurveTo(-s * 1.1, s * .3, -s * .9, -s * .9, -s * .25, -s * .95);
      ctx.quadraticCurveTo(0, -s * .6, s * .25, -s * .95);
      ctx.bezierCurveTo(s * .9, -s * .9, s * 1.1, s * .3, 0, s); ctx.closePath();
    };
    canvases.forEach(cv => {
      const ctx = cv.getContext('2d');
      const count = Number(cv.dataset.petals) || 14;
      let w = 0, h = 0, raf = 0, on = false, last = 0, petals = [];
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const make = (initial) => ({
        x: Math.random() * w, y: initial ? Math.random() * h : -30 - Math.random() * 80,
        s: 7 + Math.random() * 11, vy: 20 + Math.random() * 34, vx: -6 + Math.random() * 18,
        a: Math.random() * Math.PI * 2, va: -1 + Math.random() * 2, sw: Math.random() * Math.PI * 2, sws: .6 + Math.random() * .9,
        o: .35 + Math.random() * .5, tone: Math.random()
      });
      const resize = () => {
        const r = cv.getBoundingClientRect(); w = r.width; h = r.height;
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = w < 650 ? Math.round(count * .55) : count;
        petals = Array.from({ length: n }, () => make(true));
      };
      const frame = t => {
        if (!on) return;
        const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
        ctx.clearRect(0, 0, w, h);
        petals.forEach((p, i) => {
          p.y += p.vy * dt; p.sw += p.sws * dt; p.a += p.va * dt;
          p.x += (p.vx + Math.sin(p.sw) * 22) * dt;
          if (p.y > h + 30 || p.x > w + 40 || p.x < -40) petals[i] = make(false);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(Math.cos(p.sw * 1.3) * .6 + .55, 1);
          ctx.globalAlpha = p.o; ctx.fillStyle = p.tone > .5 ? palette[0] : palette[1];
          shape(ctx, p.s); ctx.fill(); ctx.restore();
        });
        raf = requestAnimationFrame(frame);
      };
      const start = () => { if (on) return; on = true; last = performance.now(); raf = requestAnimationFrame(frame); };
      const stop = () => { on = false; cancelAnimationFrame(raf); };
      resize();
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv);
      if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => en.isIntersecting && !document.hidden ? start() : stop(), { threshold: 0.05 }).observe(cv);
      else start();
      document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    });
  }

  /* ---------- Carruseles: botones y arrastre ---------- */
  $$('[data-carousel]').forEach(button => button.addEventListener('click', () => {
    const rail = $(button.dataset.target || '.gallery-rail');
    rail?.scrollBy({ left: (button.dataset.carousel === 'next' ? 1 : -1) * rail.clientWidth * .75, behavior: reduce ? 'auto' : 'smooth' });
  }));
  $$('.reel-rail, .gallery-rail').forEach(rail => {
    let down = false, sx = 0, sl = 0, moved = 0;
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; sx = e.clientX; sl = rail.scrollLeft; moved = 0; });
    window.addEventListener('pointermove', e => {
      if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 6) { rail.classList.add('is-dragging'); rail.scrollLeft = sl - dx; }
    });
    window.addEventListener('pointerup', () => { down = false; setTimeout(() => rail.classList.remove('is-dragging'), 0); });
    rail.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  });

  /* ---------- Reels de Instagram (se cargan al pulsar) ---------- */
  $$('.reel-play').forEach(btn => btn.addEventListener('click', () => {
    const frame = btn.closest('.reel-frame');
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.instagram.com/reel/' + btn.dataset.reel + '/embed/';
    iframe.title = 'Reel de Instagram: ' + btn.dataset.title;
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    iframe.setAttribute('allowfullscreen', ''); iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.replaceChildren(iframe); iframe.focus();
  }));

  /* ---------- Banner ---------- */
  const motionBanner = $('.motion-banner');
  $('.motion-toggle', motionBanner || document)?.addEventListener('click', e => {
    const paused = motionBanner.classList.toggle('paused');
    e.currentTarget.setAttribute('aria-pressed', String(paused));
    $('.motion-control-icon', e.currentTarget).textContent = paused ? '▶' : 'Ⅱ';
    $('.motion-control-label', e.currentTarget).textContent = paused ? 'Reanudar movimiento' : 'Pausar movimiento';
  });

  /* ---------- Lightbox ---------- */
  const dialog = $('.lightbox');
  let opener;
  $$('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    opener = button; $('img', dialog).src = button.dataset.lightbox;
    $('img', dialog).alt = $('img', button).alt; $('p', dialog).textContent = button.dataset.caption;
    dialog.showModal(); document.body.classList.add('modal-open');
  }));
  $('button', dialog)?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog?.addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus(); });

  /* ---------- Filtros de la carta ---------- */
  const search = $('#service-search');
  let filter = 'all';
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const applyFilter = () => {
    const term = norm(search?.value || ''); let count = 0;
    $$('.catalog-group').forEach(group => {
      let groupCount = 0;
      $$('.service-row', group).forEach(row => {
        const visible = (filter === 'all' || group.dataset.group === filter) && norm(row.textContent).includes(term);
        row.hidden = !visible; if (visible) { count++; groupCount++; }
      });
      group.hidden = !groupCount;
    });
    const counter = $('#search-count'); if (counter) counter.textContent = `${count} ${count === 1 ? 'servicio' : 'servicios'}`;
    const empty = $('.empty-state'); if (empty) empty.hidden = count > 0;
  };
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    $$('[data-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    applyFilter();
  }));
  search?.addEventListener('input', applyFilter);

  /* ---------- Selector de cuidados ---------- */
  $('.care-finder')?.addEventListener('submit', e => { e.preventDefault(); window.location.href = e.currentTarget.elements.care.value; });
  const careChoices = $$('[data-care]'), careSelect = $('#care'), carePreview = $('.care-preview');
  careChoices.forEach(choice => choice.addEventListener('click', () => {
    careSelect.value = choice.dataset.care;
    careChoices.forEach(o => { o.classList.toggle('selected', o === choice); o.setAttribute('aria-pressed', String(o === choice)); });
    $('h3', carePreview).textContent = choice.dataset.title;
    $('p', carePreview).textContent = choice.dataset.description;
    $('.care-price', carePreview).textContent = choice.dataset.count + ' servicios para explorar';
  }));

  /* ---------- Formulario de consulta ---------- */
  $('.appointment-form')?.addEventListener('submit', e => {
    e.preventDefault(); const form = e.currentTarget;
    const service = form.elements.service.value, message = form.elements.message.value.trim();
    const text = `Hola Jennifer, ${service ? 'me interesa ' + service : 'me gustaría recibir orientación sobre tus servicios'}.${message ? '\n' + message : ''}\n¿Podrías indicarme disponibilidad y confirmar los detalles de la cita?`;
    window.location.href = 'https://wa.me/34654972591?text=' + encodeURIComponent(text);
  });

  /* ---------- Comparador antes / después ---------- */
  $$('.compare-range').forEach(range => {
    const frame = range.closest('.compare-frame');
    const update = () => {
      const value = Math.max(0, Math.min(100, Number(range.value)));
      frame.style.setProperty('--reveal', value + '%');
      range.setAttribute('aria-valuetext', `${value} % antes, ${100 - value} % después`);
    };
    range.addEventListener('input', update); update();
    let dragging = false;
    const move = e => {
      const r = frame.getBoundingClientRect(); if (!r.width) return;
      range.value = String(Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / r.width * 100)))); update();
    };
    range.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault(); dragging = true; range.focus({ preventScroll: true }); range.setPointerCapture(e.pointerId); move(e);
    });
    range.addEventListener('pointermove', e => { if (dragging) move(e); });
    const stop = e => { dragging = false; if (range.hasPointerCapture(e.pointerId)) range.releasePointerCapture(e.pointerId); };
    range.addEventListener('pointerup', stop); range.addEventListener('pointercancel', stop);
    // Pista inicial: un pequeño recorrido al aparecer
    if (!reduce && 'IntersectionObserver' in window && !frame.closest('[hidden]')) {
      const hint = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return; hint.disconnect();
        let t0 = performance.now();
        const step = now => {
          const t = (now - t0) / 1400; if (t >= 1) { range.value = '50'; update(); return; }
          range.value = String(Math.round(50 + Math.sin(t * Math.PI * 2) * 22)); update(); requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
      hint.observe(frame);
    }
  });
  $$('.comparison-tabs').forEach(list => {
    const tabs = $$('[data-comparison-tab]', list);
    const choose = selected => tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.dataset.comparisonTab).hidden = !active;
    });
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => choose(tab));
      tab.addEventListener('keydown', e => {
        let index;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') index = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') index = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') index = 0; else if (e.key === 'End') index = tabs.length - 1; else return;
        e.preventDefault(); choose(tabs[index]); tabs[index].focus();
      });
    });
  });

  /* ---------- Intro de entrada ---------- */
  if (splashActive) {
    const splash = $('.splash');
    const end = () => { root.classList.remove('splash-on'); store.set('jo-splash', '1', sessionStorage); };
    setTimeout(end, 3500);
    splash?.addEventListener('click', end);
  }
})();
