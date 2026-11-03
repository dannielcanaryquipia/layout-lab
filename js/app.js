/* Layout Lab · app: state, rendering, drag and drop, checks, colors, export. */
(function () {
  'use strict';
  var D = window.LAB, G = window.GEN;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var KEY = 'pp-layout-lab-v1';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nid() { return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function mk(a) { return { id: nid(), type: a[0], x: a[1], y: a[2], w: a[3], h: a[4], label: a[5] || D.TYPES[a[0]].name }; }
  function slideDef(id) { return D.SLIDES.filter(function (s) { return s.id === id; })[0]; }
  function isContainer(b) { return !!D.CONTAINERS[b.type]; }
  function isBackdrop(b) { return b.w * b.h >= 100; }
  function overlap(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
  function toneOf(b) {
    var l = (b.label || '').toLowerCase();
    if (/\(dark\)|dark background|dark panel/.test(l)) return 'dark';
    if (/\(accent\)|accent background/.test(l)) return 'accent';
    return '';
  }
  function onDark(b, list) {
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, idx = list.indexOf(b), res = '';
    for (var i = 0; i < idx; i++) {
      var c = list[i];
      if (!isContainer(c) && c.type !== 'shape') continue;
      if (cx > c.x && cx < c.x + c.w && cy > c.y && cy < c.y + c.h) {
        var t = toneOf(c);
        res = (t === 'dark' || t === 'accent' || c.type === 'video') ? 'dark' : '';
      }
    }
    return res;
  }
  function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var A = hexRgb(a), B = hexRgb(b); return '#' + A.map(function (v, i) { var s = Math.round(v * t + B[i] * (1 - t)).toString(16); return s.length < 2 ? '0' + s : s; }).join(''); }
  function lum(hex) { return hexRgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function hslHex(h, s, l) {
    h = (h % 360 + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r, g, b;
    if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; } else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
    return '#' + [r, g, b].map(function (v) { var t = Math.round((v + m) * 255).toString(16); return (t.length < 2 ? '0' + t : t); }).join('').toUpperCase();
  }
  /* darken a hue/sat until it hits a target contrast ratio against a reference (ratio is symmetric) */
  function toRatio(h, s, l, ref, target) {
    var c = hslHex(h, s, l);
    while (ratio(c, ref) < target && l > 4) { l -= 3; c = hslHex(h, s, l); }
    return c;
  }
  /* build 5 role colors [bg, surface, accent, text, highlight] from a harmony scheme; all contrast checks pass */
  function genPalette() {
    var base = Math.floor(Math.random() * 360);
    var schemes = [[0, 180, 90], [0, 30, -30], [0, 120, 240], [0, 150, 210]]; // complementary, analogous, triadic, split
    var sc = schemes[Math.floor(Math.random() * schemes.length)];
    var accentHue = base + sc[1], hiHue = base + sc[2];
    var bgS = 24 + Math.random() * 16, bgL = 93 + Math.random() * 4;
    var bg = hslHex(base, bgS, bgL);
    var surface = hslHex(base, bgS + 8, bgL - 13);
    var text = toRatio(base, 20 + Math.random() * 12, 18, bg, 4.5);
    var accent = toRatio(accentHue, 60 + Math.random() * 25, 50, bg, 3);
    var hi = toRatio(hiHue, 55 + Math.random() * 25, 44, bg, 4.5);
    return [bg, surface, accent, text, hi];
  }
  function isHex(s) { return /^#[0-9a-fA-F]{6}$/.test(s); }

  /* ---------- state ---------- */
  var state = { slide: 'cover', theme: 'wire', grid: true, labels: true, palette: D.PALETTE.slice(), font: 0, sampleText: false, layouts: {}, sel: null };
  function curFonts() { return D.FONT_SETS[state.font] || D.FONTS; }
  function freshLayouts() {
    var out = {};
    D.SLIDES.forEach(function (s) { var t = D.TEMPLATES[s.id][0]; out[s.id] = { name: t.name, from: 0, edited: false, blocks: t.b.map(mk) }; });
    return out;
  }
  state.layouts = freshLayouts();
  function cur() { return state.layouts[state.slide]; }
  function selBlock() { var id = state.sel; return id ? cur().blocks.filter(function (b) { return b.id === id; })[0] || null : null; }

  function validBlock(b) { return b && D.TYPES[b.type] && [b.x, b.y, b.w, b.h].every(function (n) { return typeof n === 'number' && isFinite(n); }); }
  function fixBlock(b) {
    var w = clamp(Math.round(b.w), 1, 12), h = clamp(Math.round(b.h), 1, 12);
    return { id: nid(), type: b.type, x: clamp(Math.round(b.x), 0, 12 - w), y: clamp(Math.round(b.y), 0, 12 - h), w: w, h: h, label: String(b.label || D.TYPES[b.type].name).slice(0, 60) };
  }
  function applyData(d) {
    if (d.layouts) Object.keys(state.layouts).forEach(function (k) {
      var L = d.layouts[k];
      if (L && Array.isArray(L.blocks)) state.layouts[k] = { name: String(L.name || 'My layout').slice(0, 80), from: typeof L.from === 'number' ? L.from : -1, edited: !!L.edited, blocks: L.blocks.filter(validBlock).map(fixBlock) };
    });
    if (Array.isArray(d.palette) && d.palette.length === 5 && d.palette.every(isHex)) state.palette = d.palette.map(function (c) { return c.toUpperCase(); });
    if (d.theme === 'brand' || d.theme === 'wire') state.theme = d.theme;
    if (typeof d.grid === 'boolean') state.grid = d.grid;
    if (typeof d.labels === 'boolean') state.labels = d.labels;
    if (typeof d.font === 'number' && d.font >= 0 && d.font < D.FONT_SETS.length) state.font = d.font;
    if (typeof d.sampleText === 'boolean') state.sampleText = d.sampleText;
    if (d.slide && state.layouts[d.slide]) state.slide = d.slide;
  }
  function dataOut() { return { app: 'layout-lab', v: 1, slide: state.slide, theme: state.theme, grid: state.grid, labels: state.labels, palette: state.palette, font: state.font, sampleText: state.sampleText, layouts: state.layouts }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(dataOut())); } catch (e) { /* storage may be blocked */ } }
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.v === 1) applyData(d); } catch (e) { /* ignore */ } }

  /* ---------- history ---------- */
  var hist = {};
  function H() { return hist[state.slide] || (hist[state.slide] = { undo: [], redo: [] }); }
  function snapshot() { return JSON.stringify(cur()); }
  function commit(before, opts) {
    var h = H(); h.undo.push(before); if (h.undo.length > 80) h.undo.shift(); h.redo = [];
    save(); renderAll(false, opts);
  }
  function change(fn, opts) { var before = snapshot(); fn(); commit(before, opts); }
  function markEdited() { cur().edited = true; }
  function restore(json) {
    state.layouts[state.slide] = JSON.parse(json);
    if (!selBlock()) state.sel = null;
    save(); renderAll(false);
  }
  function undo() { var h = H(); if (!h.undo.length) { toast('Nothing to undo'); return; } h.redo.push(snapshot()); restore(h.undo.pop()); }
  function redo() { var h = H(); if (!h.redo.length) { toast('Nothing to redo'); return; } h.undo.push(snapshot()); restore(h.redo.pop()); }

  /* ---------- colors ---------- */
  var WIRE = { bg: '#FBF6EE', card: '#EFE5D6', surface: '#E4D8C6', shape: '#DCCFBC', ink: '#B8A68F', soft: '#D3C5B1', accent: '#A8957D', hi: '#8E7D69', line: '#A8957D', line2: '#DCCFBC', dark: '#C2B39D', inv: '#FBF6EE', invsoft: '#EFE5D6' };
  function brand(p) {
    return { bg: p[0], card: mix(p[1], p[0], 0.35), surface: p[1], shape: p[1], ink: p[3], soft: mix(p[3], p[0], 0.32), accent: p[2], hi: p[4], line: mix(p[3], p[0], 0.35), line2: mix(p[1], p[0], 0.7), dark: p[3], inv: p[0], invsoft: mix(p[0], p[3], 0.6) };
  }
  function colorsFor() { return state.theme === 'brand' ? brand(state.palette) : WIRE; }
  function applyTheme(el, c) { Object.keys(c).forEach(function (k) { el.style.setProperty('--c-' + k, c[k]); }); }
  function applyFont(el) { var f = curFonts(); el.style.setProperty('--f-head', f[0].stack); el.style.setProperty('--f-body', f[1].stack); }

  /* keep a unit (1% of canvas width) on every canvas for even radii and lines */
  var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) { es.forEach(function (e) { e.target.style.setProperty('--u', (e.contentRect.width / 100) + 'px'); }); }) : null;
  function watch(el) { if (ro) ro.observe(el); else el.style.setProperty('--u', (el.clientWidth / 100 || 6) + 'px'); }
  function unwatchIn(root) { if (ro) $$('.canvas', root).forEach(function (c) { ro.unobserve(c); }); }

  /* ---------- block drawing (DOM) ---------- */
  var CUP = '<svg class="cup" viewBox="0 0 60 84" aria-hidden="true"><rect x="33" y="0" width="5" height="22" rx="2" transform="rotate(14 35 11)" fill="currentColor" opacity=".7"/><path d="M10 25Q30 6 50 25Z" fill="currentColor" opacity=".55"/><rect x="7" y="24" width="46" height="5" rx="2.5" fill="currentColor" opacity=".85"/><path d="M9 29h42l-4 51q-17 4-34 0z" fill="currentColor"/><g fill="#2A1B12" opacity=".5"><circle cx="20" cy="74" r="3"/><circle cx="27" cy="76" r="3"/><circle cx="34" cy="76" r="3"/><circle cx="41" cy="74" r="3"/><circle cx="24" cy="69" r="3"/><circle cx="31" cy="70" r="3"/><circle cx="38" cy="69" r="3"/></g></svg>';
  var SK = {
    eyebrow: '<i class="bar"></i>',
    title: '<i class="bar"></i><i class="bar s"></i>',
    text: '<i class="ln"></i><i class="ln"></i><i class="ln s"></i>',
    list: '<span class="li"><i class="dt"></i><i class="ln"></i></span><span class="li"><i class="dt"></i><i class="ln"></i></span><span class="li"><i class="dt"></i><i class="ln s"></i></span>',
    button: '<i class="ln"></i>',
    image: '<svg class="x" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0L100 100M100 0L0 100"/></svg><svg class="pic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>',
    cutout: CUP,
    logo: '<i class="circle"></i>',
    icon: '<i class="circle ring"></i>',
    video: '<svg class="pic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z" fill="currentColor"/></svg>',
    audio: '<svg class="spk" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/></svg><i class="wv"></i><i class="wv"></i><i class="wv"></i><i class="wv"></i>',
    chart: '<i class="bar1" style="height:42%"></i><i class="bar1" style="height:62%"></i><i class="bar1" style="height:78%"></i><i class="bar1 hi" style="height:96%"></i>',
    table: '<i class="th"></i><i class="tr"></i><i class="tr"></i><i class="tr"></i><i class="tr"></i>',
    diagram: '<i class="node"></i><i class="lk"></i><i class="node"></i><i class="lk"></i><i class="node"></i><i class="lk"></i><i class="node hi"></i>',
    card: '<i class="ln c1"></i><i class="ln c2"></i>',
    shape: ''
  };
  function numText(label) { var l = (label || '').toLowerCase(); if (/₱|price|peso|off|discount/.test(l)) return '₱00'; if (/%/.test(l)) return '00%'; return '00'; }
  /* real words so the chosen fonts are visible on the slide. Uses the block's own label where it reads well. */
  var SAMPLE_TYPES = { eyebrow: 1, title: 1, text: 1, list: 1, button: 1, card: 1 };
  function sampleHTML(b) {
    var lab = esc(b.label || '');
    switch (b.type) {
      case 'eyebrow': return '<span class="sm sm-eyebrow">' + (lab || 'New this week') + '</span>';
      case 'title': return '<span class="sm sm-title">' + (lab || 'Your headline here') + '</span>';
      case 'button': return '<span class="sm sm-btn">' + (lab || 'Order now') + '</span>';
      case 'text': return '<span class="sm sm-body">The quick brown fox jumps over the lazy dog while five wizards guard the ube jam.</span>';
      case 'list': return '<span class="sm sm-body sm-list"><i>The quick brown fox</i><i>Jumps over the lazy dog</i><i>Five ube wizards guard it</i></span>';
      case 'card': return '<span class="sm sm-title sm-card-h">' + (lab || 'Card title') + '</span><span class="sm sm-body">The quick brown fox jumps over the lazy dog.</span>';
    }
    return SK[b.type];
  }
  function skel(b, mini) {
    if (!mini && state.sampleText && SAMPLE_TYPES[b.type]) return sampleHTML(b);
    return b.type === 'number' ? '<span class="num">' + numText(b.label) + '</span>' : SK[b.type];
  }
  function place(el, b) { el.style.left = (b.x / 12 * 100) + '%'; el.style.top = (b.y / 12 * 100) + '%'; el.style.width = (b.w / 12 * 100) + '%'; el.style.height = (b.h / 12 * 100) + '%'; }
  function aria(b) { return b.label + ', ' + D.TYPES[b.type].name + ', columns ' + (b.x + 1) + ' to ' + (b.x + b.w) + ', rows ' + (b.y + 1) + ' to ' + (b.y + b.h); }
  function blockEl(b, list, mini, labels) {
    var el = document.createElement('div');
    el.className = 'block';
    el.setAttribute('data-type', b.type);
    el.setAttribute('data-id', b.id);
    var t = toneOf(b);
    if (t && (isContainer(b) || b.type === 'shape')) el.setAttribute('data-tone', t);
    var on = onDark(b, list);
    if (on) el.setAttribute('data-on', on);
    place(el, b);
    el.innerHTML = '<div class="bx">' + skel(b, mini) + '</div>' + ((mini && !labels) ? '' : '<span class="tag">' + esc(b.label) + '</span>');
    if (!mini) { el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', aria(b)); }
    return el;
  }
  function miniCanvas(blocks, labels) {
    var c = document.createElement('div'); c.className = 'canvas mini'; c.setAttribute('aria-hidden', 'true');
    applyTheme(c, colorsFor());
    var safe = document.createElement('div'); safe.className = 'safe';
    var w = document.createElement('div'); w.className = 'blocks';
    blocks.forEach(function (b) { w.appendChild(blockEl(b, blocks, true, labels)); });
    safe.appendChild(w); c.appendChild(safe); watch(c);
    return c;
  }

  /* ---------- palette (add blocks) ---------- */
  var PAL_ICON = {
    eyebrow: '<svg viewBox="0 0 32 24"><rect x="4" y="10" width="16" height="4" rx="2" fill="currentColor"/></svg>',
    title: '<svg viewBox="0 0 32 24"><rect x="4" y="5" width="24" height="6" rx="2" fill="currentColor"/><rect x="4" y="14" width="15" height="6" rx="2" fill="currentColor"/></svg>',
    text: '<svg viewBox="0 0 32 24"><rect x="4" y="5" width="24" height="3" rx="1.5" fill="currentColor" opacity=".6"/><rect x="4" y="11" width="24" height="3" rx="1.5" fill="currentColor" opacity=".6"/><rect x="4" y="17" width="14" height="3" rx="1.5" fill="currentColor" opacity=".6"/></svg>',
    list: '<svg viewBox="0 0 32 24"><circle cx="6" cy="6" r="2" fill="currentColor"/><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="6" cy="18" r="2" fill="currentColor"/><rect x="11" y="5" width="17" height="2.5" rx="1.2" fill="currentColor" opacity=".6"/><rect x="11" y="11" width="17" height="2.5" rx="1.2" fill="currentColor" opacity=".6"/><rect x="11" y="17" width="12" height="2.5" rx="1.2" fill="currentColor" opacity=".6"/></svg>',
    number: '<svg viewBox="0 0 32 24"><text x="16" y="19" text-anchor="middle" font-size="17" font-weight="700" fill="currentColor" font-family="Georgia,serif">₱9</text></svg>',
    button: '<svg viewBox="0 0 32 24"><rect x="3" y="7" width="26" height="10" rx="5" fill="currentColor"/></svg>',
    image: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="24" height="18" rx="3"/><circle cx="11" cy="10" r="2"/><path d="M28 18l-7-7-11 10"/></svg>',
    cutout: '<svg viewBox="0 0 32 24"><rect x="9" y="1" width="14" height="22" rx="2" fill="none" stroke="currentColor" stroke-dasharray="2 2"/><path d="M12 9h8l-1 12h-6z" fill="currentColor"/><path d="M12 8q4-4 8 0z" fill="currentColor" opacity=".6"/></svg>',
    logo: '<svg viewBox="0 0 32 24"><circle cx="16" cy="12" r="9" fill="currentColor"/></svg>',
    icon: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="12" r="7"/><path d="M13 12l2 2 4-4"/></svg>',
    video: '<svg viewBox="0 0 32 24"><rect x="4" y="4" width="24" height="16" rx="3" fill="currentColor"/><path d="M14 8l6 4-6 4z" fill="#FBF6EE"/></svg>',
    audio: '<svg viewBox="0 0 32 24"><path d="M5 9h4l5-4v14l-5-4H5z" fill="currentColor"/><rect x="18" y="9" width="2" height="6" rx="1" fill="currentColor"/><rect x="22" y="6" width="2" height="12" rx="1" fill="currentColor"/><rect x="26" y="9" width="2" height="6" rx="1" fill="currentColor"/></svg>',
    chart: '<svg viewBox="0 0 32 24"><rect x="5" y="13" width="4" height="8" fill="currentColor"/><rect x="11" y="9" width="4" height="12" fill="currentColor"/><rect x="17" y="6" width="4" height="15" fill="currentColor"/><rect x="23" y="3" width="4" height="18" fill="currentColor"/></svg>',
    table: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="24" height="18" rx="2"/><path d="M4 9h24M4 15h24M13 3v18"/></svg>',
    diagram: '<svg viewBox="0 0 32 24"><circle cx="5" cy="12" r="3.5" fill="currentColor"/><circle cx="16" cy="12" r="3.5" fill="currentColor"/><circle cx="27" cy="12" r="3.5" fill="currentColor"/><path d="M8.5 12h4M19.5 12h4" stroke="currentColor" stroke-width="2"/></svg>',
    card: '<svg viewBox="0 0 32 24"><rect x="4" y="3" width="24" height="18" rx="5" fill="currentColor" opacity=".35"/><rect x="8" y="7" width="10" height="2.5" rx="1.2" fill="currentColor"/></svg>',
    shape: '<svg viewBox="0 0 32 24"><rect x="2" y="8" width="28" height="8" rx="1" fill="currentColor"/></svg>'
  };
  function renderPalette() {
    var groups = {}, order = [];
    Object.keys(D.TYPES).forEach(function (k) { var g = D.TYPES[k].group; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(k); });
    var html = '';
    order.forEach(function (g) {
      html += '<p class="pal-group">' + esc(g) + '</p>';
      groups[g].forEach(function (k) { html += '<button type="button" class="pal-item" data-type="' + k + '" aria-label="Add ' + esc(D.TYPES[k].name) + '">' + PAL_ICON[k] + '<span>' + esc(D.TYPES[k].name) + '</span></button>'; });
    });
    $('#palette').innerHTML = html;
  }

  /* ---------- rendering ---------- */
  var canvas = $('#canvas'), safe = $('#safe');
  function renderTabs() {
    var t = $('#tabs');
    if (!t.children.length) {
      D.SLIDES.forEach(function (s) {
        var b = document.createElement('button');
        b.className = 'tab'; b.type = 'button'; b.setAttribute('data-slide', s.id);
        b.innerHTML = '<b>' + (s.n <= 10 ? s.n : '+') + '</b>' + esc(s.name);
        b.addEventListener('click', function () { goSlide(s.id); });
        t.appendChild(b);
      });
    }
    $$('.tab', t).forEach(function (b) { b.setAttribute('aria-current', b.getAttribute('data-slide') === state.slide ? 'true' : 'false'); });
  }
  function renderBlocks(fresh) {
    var L = cur(), wrap = $('#blocks');
    var ae = document.activeElement, focusId = ae && ae.closest && ae.closest('#blocks .block') ? ae.getAttribute('data-id') : null;
    wrap.innerHTML = '';
    L.blocks.forEach(function (b, i) { var el = blockEl(b, L.blocks, false); el.style.setProperty('--i', i); wrap.appendChild(el); });
    $('#emptyMsg').hidden = L.blocks.length > 0;
    if (fresh && !reduce) { wrap.classList.remove('fresh'); void wrap.offsetWidth; wrap.classList.add('fresh'); setTimeout(function () { wrap.classList.remove('fresh'); }, 900); }
    if (focusId) { var el = wrap.querySelector('[data-id="' + focusId + '"]'); if (el) el.focus({ preventScroll: true }); }
    updateSel();
  }
  function updateSel() {
    var b = selBlock(), box = $('#selbox');
    $$('#blocks .block').forEach(function (e) { e.classList.toggle('is-sel', !!b && e.getAttribute('data-id') === b.id); });
    if (!b) { box.classList.remove('on'); return; }
    place(box, b); box.classList.add('on');
    $('#selinfo').textContent = D.TYPES[b.type].name + ' · ' + b.w + ' × ' + b.h;
  }
  function placeById(b) {
    var el = $('#blocks [data-id="' + b.id + '"]');
    if (el) { place(el, b); el.setAttribute('aria-label', aria(b)); }
    updateSel();
  }
  function stepper(k, name, v) {
    return '<div class="stepper"><button type="button" data-k="' + k + '" data-d="-1" aria-label="' + name + ' minus one">−</button><span>' + name + '<b>' + v + '</b></span><button type="button" data-k="' + k + '" data-d="1" aria-label="' + name + ' plus one">+</button></div>';
  }
  function renderInspector() {
    var b = selBlock(), el = $('#inspector');
    if (!b) {
      el.innerHTML = '<div class="ins-empty"><p>Click a block on the slide to edit it.</p><ul><li>Drag a block to move it.</li><li>Drag the blue dot to resize it.</li><li>Or use the buttons here and the arrow keys.</li></ul></div>';
      return;
    }
    var T = D.TYPES[b.type];
    var opts = Object.keys(D.TYPES).map(function (k) { return '<option value="' + k + '"' + (k === b.type ? ' selected' : '') + '>' + esc(D.TYPES[k].name) + '</option>'; }).join('');
    el.innerHTML = '<p class="ins-type">' + esc(T.name) + '</p>' +
      '<label class="field">What goes here<input type="text" id="insLabel" maxlength="60" value="' + esc(b.label) + '"></label>' +
      '<p class="tip"><b>Tip:</b> ' + esc(T.tip) + '</p>' +
      '<label class="field">Block type<select id="insType">' + opts + '</select></label>' +
      '<div class="steppers">' + stepper('x', 'Column', b.x + 1) + stepper('y', 'Row', b.y + 1) + stepper('w', 'Width', b.w) + stepper('h', 'Height', b.h) + '</div>' +
      '<div class="row-btns"><button class="btn" type="button" data-act="fwd">Bring forward</button><button class="btn" type="button" data-act="back">Send back</button><button class="btn" type="button" data-act="dup">Duplicate</button><button class="btn danger" type="button" data-act="del">Delete</button></div>';
  }
  function runChecks(L, sid) {
    var bl = L.blocks, s = slideDef(sid), out = [];
    s.must.forEach(function (m) {
      var types = m[0].split('|');
      var n = bl.filter(function (b) { return types.indexOf(b.type) >= 0; }).length;
      out.push({ ok: n >= m[1], t: m[2], h: n >= m[1] ? n + ' on this slide.' : 'Add ' + (m[1] - n) + ' more: ' + types.map(function (t) { return D.TYPES[t].name; }).join(' or ') + '.' });
    });
    var cont = bl.filter(function (b) { return !isContainer(b) && b.type !== 'shape' && !isBackdrop(b) && ['eyebrow', 'icon', 'audio', 'button'].indexOf(b.type) < 0; });
    var areas = cont.map(function (b) { return b.w * b.h; }).sort(function (a, b) { return b - a; });
    var hi = bl.some(function (b) { return (isContainer(b) || b.type === 'shape') && toneOf(b) && !isBackdrop(b); });
    var focal = areas.length < 2 || areas[0] >= 1.35 * areas[1] || hi;
    out.push({ ok: focal, t: 'One focal point', h: focal ? 'One thing stands out first.' : 'Make one item bigger, or color one card with (dark) or (accent).' });
    out.push({ ok: bl.length <= 16, t: 'Not crowded', h: bl.length + ' blocks' + (bl.length > 16 ? '. Try 16 or fewer, or split it into two slides.' : '.') });
    var cells = {};
    bl.filter(function (b) { return !isBackdrop(b); }).forEach(function (b) { for (var y = b.y; y < b.y + b.h; y++) for (var x = b.x; x < b.x + b.w; x++) cells[x + ',' + y] = 1; });
    var pct = Math.round(Object.keys(cells).length / 144 * 100);
    out.push({ ok: pct <= 90, t: 'Room to breathe', h: pct + '% of the grid is used' + (pct > 90 ? '. Leave some empty space.' : '.') });
    var xs = {};
    bl.filter(function (b) { return b.w >= 2 && !isBackdrop(b); }).forEach(function (b) { xs[b.x] = 1; });
    var nx = Object.keys(xs).length;
    out.push({ ok: nx <= 5, t: 'Edges line up', h: 'Blocks start on ' + nx + ' different column' + (nx === 1 ? '' : 's') + (nx > 5 ? '. Line more of them up.' : '.') });
    var free = ['cutout', 'icon', 'logo'], bad = 0;
    for (var i = 0; i < bl.length; i++) for (var j = i + 1; j < bl.length; j++) {
      var a = bl[i], c = bl[j];
      if (isContainer(a) || isContainer(c) || a.type === 'shape' || c.type === 'shape') continue;
      if (free.indexOf(a.type) >= 0 || free.indexOf(c.type) >= 0) continue;
      if (overlap(a, c)) bad++;
    }
    out.push({ ok: !bad, t: 'Words do not overlap', h: bad ? bad + ' overlapping pair' + (bad > 1 ? 's' : '') + '. Move one of them.' : 'Text and data stay apart.' });
    var cuts = bl.filter(function (b) { return b.type === 'cutout'; });
    if (cuts.length) {
      var depth = cuts.some(function (c) {
        return bl.some(function (k) {
          if ((k.type !== 'card' && k.type !== 'shape') || isBackdrop(k) || !overlap(c, k)) return false;
          return !(c.x >= k.x && c.y >= k.y && c.x + c.w <= k.x + k.w && c.y + c.h <= k.y + k.h);
        });
      });
      out.push({ ok: depth, t: 'A cutout breaks a card edge', h: depth ? 'This gives the 3D feel.' : 'Let a cutout stick out over the edge of a card or color band.' });
    }
    return out;
  }
  function renderChecks() {
    var res = runChecks(cur(), state.slide), ok = res.filter(function (r) { return r.ok; }).length;
    $('#checks').innerHTML = res.map(function (r) {
      return '<li><svg class="ico ' + (r.ok ? 'ok' : 'no') + '" aria-hidden="true"><use href="#' + (r.ok ? 'i-check' : 'i-bulb') + '"/></svg><span><b>' + (r.ok ? '' : 'Try: ') + esc(r.t) + '</b><small>' + esc(r.h) + '</small></span></li>';
    }).join('');
    $('#scoreBar').style.width = (ok / res.length * 100) + '%';
    $('#scoreText').textContent = ok + ' / ' + res.length;
  }
  function renderTemplates() {
    var el = $('#tplStrip'), L = cur();
    unwatchIn(el); el.innerHTML = '';
    var r = document.createElement('button');
    r.type = 'button'; r.className = 'tpl random';
    r.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-dice"/></svg><b>Random layout</b><span>A new mix every time</span>';
    r.addEventListener('click', randomize);
    el.appendChild(r);
    D.TEMPLATES[state.slide].forEach(function (t, i) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'tpl';
      btn.setAttribute('aria-pressed', L.from === i && !L.edited ? 'true' : 'false');
      btn.appendChild(miniCanvas(t.b.map(mk)));
      btn.insertAdjacentHTML('beforeend', '<b>' + esc(t.name) + '</b><span>' + esc(t.note) + '</span>');
      btn.addEventListener('click', function () { applyTemplate(i); });
      el.appendChild(btn);
    });
  }
  function markTemplates() { var L = cur(); $$('#tplStrip .tpl:not(.random)').forEach(function (b, i) { b.setAttribute('aria-pressed', L.from === i && !L.edited ? 'true' : 'false'); }); }
  function renderMeta() {
    var s = slideDef(state.slide), L = cur();
    $('#layoutName').textContent = s.n + '. ' + s.name + ' · ' + L.name + (L.edited ? ' (edited)' : '');
    $('#slideGoal').textContent = 'Goal: ' + s.goal;
    $('#undoBtn').disabled = !H().undo.length;
    $('#redoBtn').disabled = !H().redo.length;
  }
  function renderAll(full, opts) {
    renderTabs();
    applyTheme(canvas, colorsFor());
    canvas.classList.toggle('show-grid', state.grid);
    canvas.classList.toggle('hide-labels', !state.labels);
    $('#gridBtn').setAttribute('aria-pressed', state.grid ? 'true' : 'false');
    renderBlocks(opts && opts.fresh);
    renderInspector();
    renderChecks();
    renderMeta();
    if (full) renderTemplates(); else markTemplates();
  }

  /* ---------- actions ---------- */
  function goSlide(id) {
    if (!state.layouts[id]) return;
    state.slide = id; state.sel = null; save();
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    renderAll(true);
  }
  function randomize() {
    change(function () {
      var g = G.generate(state.slide), L = cur();
      L.blocks = g.b.map(mk); L.name = g.name; L.from = -1; L.edited = false; state.sel = null;
    }, { fresh: true });
    toast(cur().name.replace('Random: ', 'New layout: '));
  }
  function applyTemplate(i) {
    var t = D.TEMPLATES[state.slide][i];
    change(function () { var L = cur(); L.blocks = t.b.map(mk); L.name = t.name; L.from = i; L.edited = false; state.sel = null; }, { fresh: true });
  }
  function mirror() {
    change(function () { cur().blocks.forEach(function (b) { b.x = 12 - b.x - b.w; }); markEdited(); });
    toast('Mirrored: left and right swapped');
  }
  function clearSlide() {
    if (!cur().blocks.length) return;
    change(function () { cur().blocks = []; markEdited(); state.sel = null; });
    toast('Slide cleared', true);
  }
  function freeSpot(w, h) {
    var bl = cur().blocks.filter(function (b) { return !isBackdrop(b); });
    for (var y = 0; y <= 12 - h; y++) for (var x = 0; x <= 12 - w; x++) {
      var r = { x: x, y: y, w: w, h: h };
      if (!bl.some(function (b) { return overlap(r, b); })) return r;
    }
    return { x: 0, y: 0, w: w, h: h };
  }
  function addBlock(type, cell) {
    var T = D.TYPES[type], spot = cell || freeSpot(T.w, T.h);
    var b = { id: nid(), type: type, x: spot.x, y: spot.y, w: spot.w, h: spot.h, label: T.name };
    change(function () { cur().blocks.push(b); markEdited(); state.sel = b.id; });
    toast('Added ' + T.name);
  }
  function act(name) {
    var b = selBlock(); if (!b) return;
    var list = cur().blocks, i = list.indexOf(b);
    if (name === 'fwd') { if (i < list.length - 1) change(function () { list.splice(i, 1); list.splice(i + 1, 0, b); markEdited(); }); else toast('Already at the front'); }
    else if (name === 'back') { if (i > 0) change(function () { list.splice(i, 1); list.splice(i - 1, 0, b); markEdited(); }); else toast('Already at the back'); }
    else if (name === 'dup') {
      var c = { id: nid(), type: b.type, w: b.w, h: b.h, label: b.label, x: clamp(b.x + 1, 0, 12 - b.w), y: clamp(b.y + 1, 0, 12 - b.h) };
      change(function () { list.splice(i + 1, 0, c); markEdited(); state.sel = c.id; });
      toast('Duplicated');
    } else if (name === 'del') {
      change(function () { list.splice(i, 1); markEdited(); state.sel = null; });
      toast('Deleted ' + D.TYPES[b.type].name, true);
    }
  }
  function select(id) { state.sel = id; updateSel(); renderInspector(); }

  /* ---------- inspector events ---------- */
  var labelBefore = null;
  $('#inspector').addEventListener('click', function (e) {
    var s = e.target.closest('[data-k]'), a = e.target.closest('[data-act]'), b = selBlock();
    if (!b) return;
    if (s) {
      var k = s.getAttribute('data-k'), d = +s.getAttribute('data-d');
      change(function () {
        if (k === 'x') b.x = clamp(b.x + d, 0, 12 - b.w);
        if (k === 'y') b.y = clamp(b.y + d, 0, 12 - b.h);
        if (k === 'w') b.w = clamp(b.w + d, 1, 12 - b.x);
        if (k === 'h') b.h = clamp(b.h + d, 1, 12 - b.y);
        markEdited();
      });
      var again = $('#inspector [data-k="' + k + '"][data-d="' + d + '"]'); if (again) again.focus();
    } else if (a) act(a.getAttribute('data-act'));
  });
  $('#inspector').addEventListener('focusin', function (e) { if (e.target.id === 'insLabel') labelBefore = snapshot(); });
  $('#inspector').addEventListener('input', function (e) {
    if (e.target.id !== 'insLabel') return;
    var b = selBlock(); if (!b) return;
    b.label = e.target.value.slice(0, 60) || D.TYPES[b.type].name;
    var el = $('#blocks [data-id="' + b.id + '"]');
    if (el) { var tg = $('.tag', el); if (tg) tg.textContent = b.label; el.setAttribute('aria-label', aria(b)); }
  });
  $('#inspector').addEventListener('change', function (e) {
    var b = selBlock(); if (!b) return;
    if (e.target.id === 'insLabel') { if (labelBefore) { markEdited(); commit(labelBefore); labelBefore = null; } }
    if (e.target.id === 'insType') { var v = e.target.value; change(function () { if (b.label === D.TYPES[b.type].name) b.label = D.TYPES[v].name; b.type = v; markEdited(); }); }
  });

  /* ---------- drag to move and resize ---------- */
  var drag = null;
  function cellSize() { var r = safe.getBoundingClientRect(); return { r: r, cw: r.width / 12, ch: r.height / 12 }; }
  canvas.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var hd = e.target.closest('#handle'), el = e.target.closest('#blocks .block');
    if (hd && selBlock()) { startDrag(e, 'resize', selBlock()); return; }
    if (el) { var id = el.getAttribute('data-id'); if (state.sel !== id) select(id); startDrag(e, 'move', selBlock()); return; }
    if (state.sel) { state.sel = null; updateSel(); renderInspector(); }
  });
  function startDrag(e, mode, b) {
    if (!b) return;
    e.preventDefault();
    drag = { mode: mode, b: b, sx: e.clientX, sy: e.clientY, ox: b.x, oy: b.y, ow: b.w, oh: b.h, cs: cellSize(), before: snapshot(), moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    canvas.classList.add('dragging');
  }
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var d = drag, b = d.b;
    var dx = Math.round((e.clientX - d.sx) / d.cs.cw), dy = Math.round((e.clientY - d.sy) / d.cs.ch);
    if (d.mode === 'move') {
      var nx = clamp(d.ox + dx, 0, 12 - b.w), ny = clamp(d.oy + dy, 0, 12 - b.h);
      if (nx !== b.x || ny !== b.y) { b.x = nx; b.y = ny; d.moved = true; placeById(b); }
    } else {
      var nw = clamp(d.ow + dx, 1, 12 - b.x), nh = clamp(d.oh + dy, 1, 12 - b.y);
      if (nw !== b.w || nh !== b.h) { b.w = nw; b.h = nh; d.moved = true; placeById(b); }
    }
  });
  function endDrag() {
    if (!drag) return;
    var d = drag; drag = null;
    canvas.classList.remove('dragging');
    if (d.moved) { markEdited(); commit(d.before); } else renderInspector();
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('dblclick', function (e) { if (e.target.closest('#blocks .block')) { var i = $('#insLabel'); if (i) { i.focus(); i.select(); } } });
  canvas.addEventListener('focusin', function (e) { var el = e.target.closest('#blocks .block'); if (el && state.sel !== el.getAttribute('data-id')) select(el.getAttribute('data-id')); });
  // delete button on the selected block: stop pointerdown from deselecting, remove on click
  $('#selDel').addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  $('#selDel').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (selBlock()) act('del'); });

  /* ---------- drag from the palette ---------- */
  var pdrag = null, ghost = null, suppressClick = false;
  var palette = $('#palette');
  function cellAt(px, py, type) {
    var cs = cellSize(), r = cs.r, T = D.TYPES[type];
    if (px < r.left - cs.cw || px > r.right + cs.cw || py < r.top - cs.ch || py > r.bottom + cs.ch) return null;
    var x = Math.round((px - r.left) / cs.cw - T.w / 2), y = Math.round((py - r.top) / cs.ch - T.h / 2);
    return { x: clamp(x, 0, 12 - T.w), y: clamp(y, 0, 12 - T.h), w: T.w, h: T.h };
  }
  function endPal() { pdrag = null; $('#drop').classList.remove('on'); if (ghost) { ghost.remove(); ghost = null; } }
  palette.addEventListener('pointerdown', function (e) {
    var it = e.target.closest('.pal-item');
    if (!it || (e.pointerType === 'mouse' && e.button !== 0)) return;
    pdrag = { type: it.getAttribute('data-type'), sx: e.clientX, sy: e.clientY, on: false };
    try { it.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  palette.addEventListener('pointermove', function (e) {
    if (!pdrag) return;
    if (!pdrag.on) {
      if (Math.abs(e.clientX - pdrag.sx) + Math.abs(e.clientY - pdrag.sy) < 8) return;
      pdrag.on = true;
      ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.textContent = D.TYPES[pdrag.type].name;
      document.body.appendChild(ghost);
    }
    ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
    var cell = cellAt(e.clientX, e.clientY, pdrag.type), drop = $('#drop');
    if (cell) { place(drop, cell); drop.classList.add('on'); } else drop.classList.remove('on');
  });
  palette.addEventListener('pointerup', function (e) {
    if (!pdrag) return;
    var d = pdrag; endPal();
    if (d.on) { suppressClick = true; var cell = cellAt(e.clientX, e.clientY, d.type); if (cell) addBlock(d.type, cell); else toast('Drop it on the slide to add it'); }
  });
  palette.addEventListener('pointercancel', endPal);
  palette.addEventListener('click', function (e) {
    var it = e.target.closest('.pal-item'); if (!it) return;
    if (suppressClick) { suppressClick = false; return; }
    addBlock(it.getAttribute('data-type'), null);
  });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = t.closest && t.closest('input, select, textarea');
    if (!$('#storyModal').hidden || !$('#helpModal').hidden) { if (e.key === 'Escape') closeModals(); return; }
    var mod = e.ctrlKey || e.metaKey, k = e.key;
    if (mod && !typing && k.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && !typing && k.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (typing || e.altKey) return;
    var b = selBlock();
    if (mod && k.toLowerCase() === 'd' && b) { e.preventDefault(); act('dup'); return; }
    if (mod) return;
    if (k === 'r' || k === 'R') { randomize(); return; }
    if (k === 'm' || k === 'M') { mirror(); return; }
    if (k === 'g' || k === 'G') { toggleGrid(); return; }
    if (!b) return;
    var dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }, d = dirs[k];
    if (d) {
      e.preventDefault();
      change(function () {
        if (e.shiftKey) { b.w = clamp(b.w + d[0], 1, 12 - b.x); b.h = clamp(b.h + d[1], 1, 12 - b.y); }
        else { b.x = clamp(b.x + d[0], 0, 12 - b.w); b.y = clamp(b.y + d[1], 0, 12 - b.h); }
        markEdited();
      });
      return;
    }
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); act('del'); }
    else if (k === ']') act('fwd');
    else if (k === '[') act('back');
    else if (k === 'Escape') { state.sel = null; updateSel(); renderInspector(); }
  });

  /* ---------- toolbar ---------- */
  function toggleGrid() { state.grid = !state.grid; save(); canvas.classList.toggle('show-grid', state.grid); $('#gridBtn').setAttribute('aria-pressed', state.grid ? 'true' : 'false'); }
  $('#randomBtn').addEventListener('click', randomize);
  $('#mirrorBtn').addEventListener('click', mirror);
  $('#undoBtn').addEventListener('click', undo);
  $('#redoBtn').addEventListener('click', redo);
  $('#gridBtn').addEventListener('click', toggleGrid);
  $('#clearBtn').addEventListener('click', clearSlide);
  $('#copyBtn').addEventListener('click', function () {
    copyText(planText()).then(function () { toast('Plan copied. Paste it in your notes or design brief.'); }, function () { toast('Copy did not work here. Try Save file instead.'); });
  });
  $('#pngBtn').addEventListener('click', exportPNG);

  function planText() {
    var s = slideDef(state.slide), L = cur();
    var lines = [s.n + '. ' + s.name + ' · ' + L.name + (L.edited ? ' (edited)' : ''), 'Grid: 12 columns x 12 rows inside the slide margins. Blocks listed first sit at the back.', ''];
    L.blocks.forEach(function (b, i) { lines.push((i + 1) + '. ' + b.label + ' [' + D.TYPES[b.type].name + ']: columns ' + (b.x + 1) + '-' + (b.x + b.w) + ', rows ' + (b.y + 1) + '-' + (b.y + b.h)); });
    lines.push('', 'Rebuild it in Google Slides: View › Guides › Add vertical guides for the columns, then draw each block on the guides. In Canva, turn on rulers and guides first.');
    lines.push('', 'Fonts: ' + curFonts().map(function (f) { return f.role + ' — ' + f.name + ' (or ' + f.safe + ')'; }).join('. ') + '. These are in the font menu of Google Slides and Canva; in PowerPoint add the Google Fonts once, or use the no-install options.');
    return lines.join('\n');
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand('copy')) res(); else rej(); } catch (err) { rej(err); }
      document.body.removeChild(ta);
    });
  }
  function download(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ---------- PNG export (canvas drawing of the wireframe) ---------- */
  var CUP_PATHS = ['M10 25Q30 6 50 25Z', 'M9 29h42l-4 51q-17 4-34 0z'];
  function exportPNG() {
    var W = 1920, HH = 1080, cv = document.createElement('canvas'); cv.width = W; cv.height = HH;
    var x = cv.getContext('2d'), C = colorsFor(), U = W / 100;
    x.fillStyle = C.bg; x.fillRect(0, 0, W, HH);
    var sx = W * 0.0667, sy = HH * 0.08, sw = W - 2 * sx, sh = HH - 2 * sy, cw = sw / 12, ch = sh / 12, g = sw * 0.0032;
    if (state.grid) {
      x.strokeStyle = 'rgba(147,85,42,.25)'; x.lineWidth = 1; x.setLineDash([6, 6]);
      for (var i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(sx + i * cw, sy); x.lineTo(sx + i * cw, sy + sh); x.stroke(); }
      x.setLineDash([]);
    }
    var list = cur().blocks;
    list.forEach(function (b) { drawBlock(x, b, { x: sx + b.x * cw + g, y: sy + b.y * ch + g, w: b.w * cw - 2 * g, h: b.h * ch - 2 * g }, C, U, list); });
    if (state.labels) list.forEach(function (b) {
      var rx = sx + b.x * cw + g + 10, ry = sy + b.y * ch + g + 10, maxw = b.w * cw - 2 * g - 20;
      if (maxw < 60 || b.h * ch < 40) return;
      x.font = '600 22px "DM Sans", Arial, sans-serif';
      var t = b.label; while (x.measureText(t).width > maxw - 16 && t.length > 3) t = t.slice(0, -2);
      if (t !== b.label) t = t.replace(/.$/, '…');
      var tw = x.measureText(t).width + 16;
      x.fillStyle = 'rgba(255,253,248,.92)'; rr(x, rx, ry, tw, 32, 7); x.fill();
      x.fillStyle = '#2A1B12'; x.textBaseline = 'middle'; x.fillText(t, rx + 8, ry + 17);
    });
    var s = slideDef(state.slide), L = cur();
    x.font = '600 20px "DM Sans", Arial, sans-serif'; x.fillStyle = 'rgba(42,27,18,.55)'; x.textBaseline = 'alphabetic';
    x.fillText('Layout Lab · ' + s.n + '. ' + s.name + ' · ' + L.name, sx, HH - 28);
    cv.toBlob(function (blob) { if (blob) { download(blob, 'layout-' + s.n + '-' + s.id + '.png'); toast('PNG downloaded'); } }, 'image/png');
  }
  function rr(x, X, Y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
  }
  function drawBlock(x, b, r, C0, U, list) {
    var C = Object.assign({}, C0), tone = toneOf(b), R = U * 0.9;
    if (onDark(b, list)) { C.ink = C.inv; C.soft = C.invsoft; C.accent = C.inv; C.line = C.invsoft; }
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2, m = Math.min(r.w, r.h);
    function fill(col) { x.fillStyle = col; x.fill(); }
    function bar(X, Y, w, h, col) { rr(x, X, Y, w, h, Math.min(h / 2, U * 0.5)); fill(col); }
    switch (b.type) {
      case 'card': rr(x, r.x, r.y, r.w, r.h, R); fill(tone === 'dark' ? C.dark : tone === 'accent' ? C.hi : C.card);
        if (!tone) { x.strokeStyle = C.line2; x.lineWidth = 2; x.stroke(); }
        var ph = Math.max(14, Math.min(r.h * 0.14, U * 1.6)), pw = Math.max(14, Math.min(r.w * 0.1, U * 1.6)), lh = Math.max(3, Math.min(r.h * 0.13, U * 1.1));
        x.globalAlpha = 0.55; bar(r.x + pw, r.y + ph, r.w * 0.42, lh, tone ? C.invsoft : C.soft); bar(r.x + pw, r.y + ph + lh * 1.8, r.w * 0.62, lh, tone ? C.invsoft : C.soft); x.globalAlpha = 1; break;
      case 'shape': rr(x, r.x, r.y, r.w, r.h, R); fill(tone === 'dark' ? C.dark : tone === 'accent' ? C.hi : C.shape); break;
      case 'image': case 'video':
        rr(x, r.x, r.y, r.w, r.h, R); fill(b.type === 'video' ? C.dark : C.surface);
        if (b.type === 'image') { x.save(); rr(x, r.x, r.y, r.w, r.h, R); x.clip(); x.strokeStyle = C.line; x.globalAlpha = 0.5; x.lineWidth = 2; x.beginPath(); x.moveTo(r.x, r.y); x.lineTo(r.x + r.w, r.y + r.h); x.moveTo(r.x + r.w, r.y); x.lineTo(r.x, r.y + r.h); x.stroke(); x.restore(); }
        x.strokeStyle = b.type === 'video' ? C.inv : C.line; x.lineWidth = 3;
        var s2 = m * 0.17; x.beginPath(); x.arc(cx, cy, s2, 0, Math.PI * 2); x.stroke();
        if (b.type === 'video') { x.beginPath(); x.moveTo(cx - s2 * 0.35, cy - s2 * 0.45); x.lineTo(cx + s2 * 0.5, cy); x.lineTo(cx - s2 * 0.35, cy + s2 * 0.45); x.closePath(); x.fillStyle = C.inv; x.fill(); }
        break;
      case 'title': var bh = Math.min(r.h * 0.32, U * 4.2), gp = r.h * 0.09, ty = cy - (bh * 2 + gp) / 2; bar(r.x, ty, r.w, bh, C.ink); bar(r.x, ty + bh + gp, r.w * 0.62, bh, C.ink); break;
      case 'eyebrow': var eh = Math.min(r.h * 0.48, U * 1.3); bar(r.x, cy - eh / 2, r.w * 0.72, eh, C.accent); break;
      case 'text': var th = Math.max(3, Math.min(r.h * 0.13, U * 1.1)), tg = Math.min(r.h * 0.14, U * 1.4), t0 = cy - (th * 3 + tg * 2) / 2;
        [1, 1, 0.58].forEach(function (f, k) { bar(r.x, t0 + k * (th + tg), r.w * f, th, C.soft); }); break;
      case 'list': for (var k = 0; k < 3; k++) { var ly = r.y + r.h * (k + 0.5) / 3, dd = Math.min(r.h * 0.14, U * 1.5); x.beginPath(); x.arc(r.x + dd / 2, ly, dd / 2, 0, Math.PI * 2); fill(C.accent); var lh2 = Math.max(3, Math.min(r.h * 0.13, U * 1.1)); bar(r.x + dd + r.w * 0.06, ly - lh2 / 2, (r.w - dd - r.w * 0.06) * (k === 2 ? 0.58 : 1), lh2, C.soft); } break;
      case 'number': var fs = Math.min(r.h * 0.66, r.w * 0.30); x.font = '600 ' + fs + 'px Fraunces, Georgia, serif'; x.fillStyle = C.accent; x.textBaseline = 'middle'; x.fillText(numText(b.label), r.x + r.w * 0.04, cy); break;
      case 'button': rr(x, r.x, r.y, r.w, r.h, r.h / 2); fill(C.hi); x.globalAlpha = 0.8; bar(cx - r.w * 0.23, cy - Math.max(3, Math.min(r.h * 0.13, U * 1.1)) / 2, r.w * 0.46, Math.max(3, Math.min(r.h * 0.13, U * 1.1)), C.inv); x.globalAlpha = 1; break;
      case 'cutout':
        rr(x, r.x, r.y, r.w, r.h, R); x.setLineDash([10, 8]); x.strokeStyle = C.line; x.lineWidth = Math.max(2, U * 0.22); x.stroke(); x.setLineDash([]);
        var hh = r.h * 0.84, sc = Math.min(hh / 84, (r.w * 0.92) / 60), ox = cx - 30 * sc, oy = r.y + r.h - 84 * sc - r.h * 0.02;
        x.save(); x.translate(ox, oy); x.scale(sc, sc); x.fillStyle = C.accent; x.globalAlpha = 0.75;
        CUP_PATHS.forEach(function (p) { x.fill(new Path2D(p)); }); x.fillRect(7, 24, 46, 5);
        x.save(); x.translate(35, 11); x.rotate(14 * Math.PI / 180); x.fillRect(-2.5, -11, 5, 22); x.restore();
        x.restore(); x.globalAlpha = 1; break;
      case 'logo': x.beginPath(); x.arc(cx, cy, m / 2, 0, Math.PI * 2); fill(C.hi); break;
      case 'icon': x.globalAlpha = 0.7; x.beginPath(); x.arc(cx, cy, m * 0.39, 0, Math.PI * 2); fill(C.accent); x.globalAlpha = 1; break;
      case 'chart': var base = Math.max(2, U * 0.25), pad = r.w * 0.06, gw = r.w * 0.06, bw = (r.w - 2 * pad - 3 * gw) / 4, ah = r.h - r.h * 0.06 - base;
        [0.42, 0.62, 0.78, 0.96].forEach(function (f, k) { var bh2 = ah * f; rr(x, r.x + pad + k * (bw + gw), r.y + r.h - base - bh2, bw, bh2, U * 0.4); fill(k === 3 ? C.hi : C.accent); });
        x.fillStyle = C.ink; x.fillRect(r.x, r.y + r.h - base, r.w, base); break;
      case 'table': x.fillStyle = C.ink; rr(x, r.x, r.y, r.w, r.h * 0.2, U * 0.4); x.fill();
        for (var q = 1; q < 5; q++) { if (q % 2 === 0) { x.fillStyle = C.card; x.fillRect(r.x, r.y + r.h * 0.2 * q, r.w, r.h * 0.2); } x.fillStyle = C.line2; x.fillRect(r.x, r.y + r.h * 0.2 * (q + 1) - 1, r.w, 2); } break;
      case 'diagram': var nd = Math.min(r.w * 0.17, r.h * 0.64), sp = (r.w - r.w * 0.04 - nd) / 3;
        x.fillStyle = C.line; x.fillRect(r.x + r.w * 0.02 + nd / 2, cy - Math.max(2, U * 0.3) / 2, sp * 3, Math.max(2, U * 0.3));
        for (var n = 0; n < 4; n++) { x.beginPath(); x.arc(r.x + r.w * 0.02 + nd / 2 + n * sp, cy, nd / 2, 0, Math.PI * 2); fill(n === 3 ? C.hi : C.accent); } break;
      case 'audio': rr(x, r.x, r.y, r.w, r.h, r.h / 2); fill(C.surface);
        x.fillStyle = C.accent; var ah2 = r.h * 0.5; x.fillRect(r.x + r.w * 0.1, cy - ah2 / 3, ah2 * 0.4, ah2 * 0.66);
        for (var v = 0; v < 4; v++) { var vh = r.h * [0.3, 0.55, 0.75, 0.45][v]; rr(x, r.x + r.w * (0.32 + v * 0.13), cy - vh / 2, r.w * 0.05, vh, U * 0.3); fill(C.accent); } break;
    }
  }

  /* ---------- colors panel ---------- */
  function renderColors() {
    var box = $('#colors');
    if (!box.children.length) {
      box.innerHTML = D.ROLES.map(function (role, i) {
        return '<label>' + role +
          '<input type="color" data-i="' + i + '" aria-label="' + role + ' color">' +
          '<input type="text" class="hex" data-i="' + i + '" maxlength="7" spellcheck="false" autocapitalize="off" aria-label="' + role + ' hex code">' +
          '</label>';
      }).join('');
      box.addEventListener('input', function (e) {
        var t = e.target, i = t.getAttribute('data-i'); if (i === null) return; i = +i;
        var v;
        if (t.type === 'color') {
          v = t.value.toUpperCase();
          var tx = box.querySelector('input.hex[data-i="' + i + '"]'); if (tx) tx.value = v;
        } else {
          var raw = t.value.trim(); if (raw && raw.charAt(0) !== '#') raw = '#' + raw;
          if (!isHex(raw)) return; // wait for a full, valid hex before applying
          v = raw.toUpperCase();
          var pk = box.querySelector('input[type=color][data-i="' + i + '"]'); if (pk) pk.value = v.toLowerCase();
        }
        state.palette[i] = v;
        if (state.theme !== 'brand') setTheme('brand', true);
        applyTheme(canvas, colorsFor()); renderContrast();
      });
      box.addEventListener('change', function (e) {
        var t = e.target;
        if (t.classList && t.classList.contains('hex')) { t.value = state.palette[+t.getAttribute('data-i')]; } // normalize / revert bad input
        save(); renderTemplates();
      });
    }
    $$('#colors label').forEach(function (lab, i) {
      var pk = lab.querySelector('input[type=color]'); if (pk) pk.value = state.palette[i].toLowerCase();
      var hx = lab.querySelector('input.hex'); if (hx) hx.value = state.palette[i];
    });
    renderContrast();
  }
  function renderContrast() {
    var p = state.palette;
    function row(name, a, b, large) {
      var r = ratio(a, b), ok = r >= 4.5, okL = r >= 3;
      return '<span>' + name + ': <b>' + r.toFixed(1) + ' : 1</b> <span class="' + (ok ? 'pass' : okL && large ? 'pass' : 'fail') + '">' + (ok ? 'Pass' : okL ? 'Large text only' : 'Fail') + '</span></span>';
    }
    $('#contrast').innerHTML = row('Text on background', p[3], p[0]) + row('Accent on background', p[2], p[0], true) + row('Background color on highlight button', p[0], p[4]);
  }
  /* ---------- fonts panel ---------- */
  function renderFonts() {
    var box = $('#fonts'); if (!box) return;
    box.innerHTML = curFonts().map(function (f) {
      return '<div class="font-item">' +
        '<span class="font-role">' + esc(f.role) + '</span>' +
        '<span class="font-sample" style="font-family:' + f.stack + '">' + esc(f.name) + '</span>' +
        '<span class="font-meta">' + esc(f.note) + ' · no install: ' + esc(f.safe) + '</span>' +
        '</div>';
    }).join('');
  }
  function setTheme(t, quiet) {
    state.theme = t;
    $('#wireBtn').setAttribute('aria-pressed', t === 'wire' ? 'true' : 'false');
    $('#colorBtn').setAttribute('aria-pressed', t === 'brand' ? 'true' : 'false');
    applyTheme(canvas, colorsFor());
    if (!quiet) { save(); renderTemplates(); }
  }
  $('#wireBtn').addEventListener('click', function () { setTheme('wire'); });
  $('#colorBtn').addEventListener('click', function () { setTheme('brand'); });
  $('#genBtn').addEventListener('click', function () {
    state.palette = genPalette();
    setTheme('brand', true);
    renderColors(); applyTheme(canvas, colorsFor()); save(); renderTemplates();
    toast('Generated a palette that passes the checks');
  });
  $('#resetColors').addEventListener('click', function () { state.palette = D.PALETTE.slice(); renderColors(); applyTheme(canvas, colorsFor()); save(); renderTemplates(); toast('Colors reset to the Pili & Pearl palette'); });
  $('#genFontBtn').addEventListener('click', function () {
    var n = D.FONT_SETS.length, i = state.font;
    while (n > 1 && i === state.font) i = Math.floor(Math.random() * n);
    state.font = i;
    if (!state.sampleText) { state.sampleText = true; $('#sampleChk').checked = true; }
    applyFont(canvas); renderFonts(); renderBlocks(); save();
    toast('Font: ' + curFonts()[0].name + ' + ' + curFonts()[1].name);
  });
  $('#sampleChk').addEventListener('change', function (e) { state.sampleText = e.target.checked; renderBlocks(); save(); });
  $('#labelsChk').addEventListener('change', function (e) { state.labels = e.target.checked; canvas.classList.toggle('hide-labels', !state.labels); save(); });

  /* ---------- save, open, start over ---------- */
  $('#saveBtn').addEventListener('click', function () {
    download(new Blob([JSON.stringify(dataOut(), null, 1)], { type: 'application/json' }), 'layout-lab-plan.json');
    toast('Saved layout-lab-plan.json');
  });
  $('#openBtn').addEventListener('click', function () { $('#fileIn').click(); });
  $('#fileIn').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result);
        if (!d || d.app !== 'layout-lab' || !d.layouts) throw new Error('not a plan');
        applyData(d); hist = {}; state.sel = null; save(); renderColors(); setTheme(state.theme, true); $('#labelsChk').checked = state.labels; renderAll(true);
        toast('Opened ' + f.name);
      } catch (err) { toast('That file is not a Layout Lab plan'); }
      e.target.value = '';
    };
    rd.readAsText(f);
  });
  $('#resetAll').addEventListener('click', function () {
    if (!window.confirm('Start over? Every slide goes back to its first template. Save a file first if you want to keep this work.')) return;
    state.layouts = freshLayouts(); state.palette = D.PALETTE.slice(); hist = {}; state.sel = null;
    save(); renderColors(); setTheme('wire', true); renderAll(true); toast('Started over');
  });

  /* ---------- storyboard and help ---------- */
  var lastFocus = null;
  function openModal(id) { lastFocus = document.activeElement; var m = $(id); m.hidden = false; var c = $('[data-close]', m); if (c) c.focus(); }
  function closeModals() { $$('.modal').forEach(function (m) { m.hidden = true; }); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeModals); });
  $$('.modal').forEach(function (m) { m.addEventListener('click', function (e) { if (e.target === m) closeModals(); }); });
  $('#helpBtn').addEventListener('click', function () { openModal('#helpModal'); });
  $('#storyBtn').addEventListener('click', function () {
    var box = $('#story'); unwatchIn(box); box.innerHTML = '';
    D.SLIDES.forEach(function (s) {
      var L = state.layouts[s.id], res = runChecks(L, s.id), ok = res.filter(function (r) { return r.ok; }).length;
      var b = document.createElement('button'); b.type = 'button';
      b.appendChild(miniCanvas(L.blocks, true));
      b.insertAdjacentHTML('beforeend', '<b>' + (s.n <= 10 ? s.n + '. ' : '') + esc(s.name) + '</b><span>' + esc(L.name) + (L.edited ? ' (edited)' : '') + ' · ' + ok + ' of ' + res.length + ' checks</span>');
      b.addEventListener('click', function () { closeModals(); goSlide(s.id); });
      box.appendChild(b);
    });
    $('#palettePrint').innerHTML = '<h3>Color palette</h3><p class="pp-note">The five colors used in this deck.</p><div class="pp-grid">' +
      state.palette.map(function (c, i) {
        return '<div class="pp-item"><span class="pp-sw" style="background:' + esc(c) + '"></span><b>' + esc(D.ROLES[i]) + '</b><span class="pp-hex">' + esc(c) + '</span></div>';
      }).join('') + '</div>' +
      '<h3 class="pp-fonts-h">Fonts</h3><p class="pp-note">Set these in Google Slides, PowerPoint or Canva. No-install option in brackets.</p><div class="pp-fonts">' +
      curFonts().map(function (f) {
        return '<div class="pp-font"><span class="pp-font-role">' + esc(f.role) + '</span><span class="pp-font-name" style="font-family:' + f.stack + '">' + esc(f.name) + '</span><span class="pp-font-note">' + esc(f.note) + ' (or ' + esc(f.safe) + ')</span></div>';
      }).join('') + '</div>';
    openModal('#storyModal');
  });
  $('#printBtn').addEventListener('click', function () { window.print(); });

  /* ---------- toast ---------- */
  var tt = null;
  function toast(msg, withUndo) {
    var t = $('#toast'); $('#toastMsg').textContent = msg;
    $('#toastBtn').hidden = !withUndo;
    t.classList.add('show'); clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove('show'); }, withUndo ? 5000 : 2200);
  }
  $('#toastBtn').addEventListener('click', function () { undo(); $('#toast').classList.remove('show'); });

  /* ---------- start ---------- */
  load();
  var h = (location.hash || '').replace('#', '');
  if (h && state.layouts[h]) state.slide = h;
  watch(canvas);
  renderPalette();
  renderColors();
  renderFonts();
  applyFont(canvas);
  setTheme(state.theme, true);
  $('#labelsChk').checked = state.labels;
  $('#sampleChk').checked = state.sampleText;
  renderAll(true);

  /* small hook for automated checks */
  window.LayoutLab = { state: state, runChecks: runChecks, generate: G.generate, slides: D.SLIDES };
})();
