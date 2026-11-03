/* Layout Lab: random layout generator.
   Builds a layout from a structure (split, bento, columns, rows, sidebar...)
   and fills the regions with the blocks each pitch slide needs. */
window.GEN = (function () {
  'use strict';
  var R = Math.random;
  function ri(a, b) { return a + Math.floor(R() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(R() * a.length)]; }
  function ch(p) { return R() < p; }
  function B(t, x, y, w, h, l) { return [t, x, y, w, h, l]; }

  var LABEL = {
    about: { eyebrow: '02 · About us', title: 'About Us' },
    need: { eyebrow: '03 · The need', title: 'The Need and Why Us' },
    menu: { eyebrow: '04 · The menu', title: 'The Menu' },
    numbers: { eyebrow: '05 · Prices and numbers', title: 'Prices and Numbers' },
    how: { eyebrow: '06 · How it works', title: 'How It Works' },
    customers: { eyebrow: '07 · Customers', title: 'Customers and Where We Sell' },
    sources: { eyebrow: '10 · Sources', title: 'Sources and Credits' },
    free: { eyebrow: 'Extra slide', title: 'Title' }
  };

  /* ---------- header ---------- */
  function header(L, center) {
    var b = [], y = 0, tw = center ? 8 : pick([5, 6, 7]), tx = center ? 2 : 0;
    if (ch(0.6)) { b.push(B('eyebrow', center ? 4 : 0, 0, center ? 4 : pick([3, 4]), 1, L.eyebrow)); y = 1; }
    b.push(B('title', tx, y, tw, 2, L.title));
    var bottom = y + 2;
    return { b: b, top: bottom + (ch(0.5) ? 1 : 0), titleBottom: bottom, center: center };
  }

  /* ---------- structures ---------- */
  function sSplit(A) {
    var r = pick([4, 5, 7, 8]), m = ch(0.5);
    var a = { x: m ? A.x + A.w - r : A.x, y: A.y, w: r, h: A.h };
    var b = { x: m ? A.x : A.x + r, y: A.y, w: A.w - r, h: A.h };
    var hero = r >= 6 ? a : b, rest = r >= 6 ? b : a;
    return { name: 'Split ' + hero.w + ' + ' + rest.w + ' columns' + (m ? ', mirrored' : ''), hero: hero, rest: [rest] };
  }
  function sColumns(A, n) {
    n = n || pick([2, 3, 4]);
    var w = 12 / n, regs = [];
    for (var i = 0; i < n; i++) regs.push({ x: i * w, y: A.y, w: w, h: A.h });
    return { name: n + ' equal columns', hero: regs[0], rest: regs.slice(1), equal: true };
  }
  function sBento(A) {
    var hw = pick([6, 7, 8]), m = ch(0.5);
    var hero = { x: m ? 12 - hw : 0, y: A.y, w: hw, h: A.h };
    var rx = m ? 0 : hw, rw = 12 - hw, rest = [];
    var h1 = Math.floor(A.h / 2), h2 = A.h - h1;
    if (rw >= 5 && ch(0.75)) {
      var w1 = Math.floor(rw / 2), w2 = rw - w1;
      rest = [{ x: rx, y: A.y, w: w1, h: h1 }, { x: rx + w1, y: A.y, w: w2, h: h1 }, { x: rx, y: A.y + h1, w: w1, h: h2 }, { x: rx + w1, y: A.y + h1, w: w2, h: h2 }];
    } else {
      rest = [{ x: rx, y: A.y, w: rw, h: h1 }, { x: rx, y: A.y + h1, w: rw, h: h2 }];
    }
    return { name: 'Bento, big tile ' + hw + ' columns' + (m ? ', mirrored' : ''), hero: hero, rest: rest };
  }
  function sRows(A) {
    var th = Math.min(A.h - 3, pick([4, 5])), n = pick([2, 3, 4]), w = 12 / n, rest = [];
    var hero = { x: 0, y: A.y, w: 12, h: th };
    for (var i = 0; i < n; i++) rest.push({ x: i * w, y: A.y + th, w: w, h: A.h - th });
    return { name: 'Wide band on top, ' + n + ' tiles below', hero: hero, rest: rest };
  }
  function sRowsFlip(A) {
    var th = Math.min(A.h - 3, pick([4, 5])), n = pick([2, 3, 4]), w = 12 / n, rest = [];
    var bh = A.h - th;
    for (var i = 0; i < n; i++) rest.push({ x: i * w, y: A.y, w: w, h: th });
    var hero = { x: 0, y: A.y + th, w: 12, h: bh };
    return { name: n + ' tiles on top, wide band below', hero: hero, rest: rest };
  }
  function sSidebar(A) {
    var sw = pick([3, 4]), m = ch(0.5);
    var side = { x: m ? 12 - sw : 0, y: A.y, w: sw, h: A.h };
    var mx = m ? 0 : sw, mw = 12 - sw, th = Math.ceil(A.h * 0.6);
    var hero = { x: mx, y: A.y, w: mw, h: th };
    var low = { x: mx, y: A.y + th, w: mw, h: A.h - th };
    return { name: 'Sidebar and stacked main' + (m ? ', mirrored' : ''), hero: hero, rest: [side, low] };
  }
  var STRUCTS = { split: sSplit, columns: sColumns, bento: sBento, rows: sRows, rowsflip: sRowsFlip, sidebar: sSidebar };

  /* split a region into n tiles (for slides that need several items) */
  function tiles(r, n) {
    var out = [];
    if (n === 4 && r.w >= 4 && r.h >= 6) {
      var w1 = Math.floor(r.w / 2), h1 = Math.floor(r.h / 2);
      return [{ x: r.x, y: r.y, w: w1, h: h1 }, { x: r.x + w1, y: r.y, w: r.w - w1, h: h1 }, { x: r.x, y: r.y + h1, w: w1, h: r.h - h1 }, { x: r.x + w1, y: r.y + h1, w: r.w - w1, h: r.h - h1 }];
    }
    if (r.w >= r.h * 1.4) {
      var cw = Math.floor(r.w / n), x = r.x;
      for (var i = 0; i < n; i++) { var w = i === n - 1 ? r.x + r.w - x : cw; out.push({ x: x, y: r.y, w: w, h: r.h }); x += w; }
    } else {
      var rh = Math.floor(r.h / n), y = r.y;
      for (var j = 0; j < n; j++) { var h = j === n - 1 ? r.y + r.h - y : rh; out.push({ x: r.x, y: y, w: r.w, h: h }); y += h; }
    }
    return out;
  }
  function ensureTiles(st, min) {
    var rest = st.rest.slice();
    while (rest.length < min) {
      rest.sort(function (a, b) { return b.w * b.h - a.w * a.h; });
      var big = rest.shift();
      if (!big || (big.w < 2 && big.h < 2)) break;
      var need = Math.min(4, min - rest.length);
      if (need < 2) need = 2;
      rest = rest.concat(tiles(big, need));
    }
    st.rest = rest;
    return st;
  }

  /* ---------- fills ---------- */
  var F = {
    card: function (r, l) { return [B('card', r.x, r.y, r.w, r.h, l)]; },
    image: function (r, l) { return [B('image', r.x, r.y, r.w, r.h, l)]; },
    chart: function (r, l) { return [B('chart', r.x, r.y, r.w, r.h, l)]; },
    table: function (r, l) { return [B('table', r.x, r.y, r.w, r.h, l)]; },
    list: function (r, l) { return [B('list', r.x, r.y, r.w, r.h, l)]; },
    text: function (r, l) { return [B('text', r.x, r.y, r.w, Math.min(r.h, 3), l)]; },
    video: function (r, l) { return [B('video', r.x, r.y, r.w, r.h, l)]; },
    diagram: function (r, l) { var h = Math.min(r.h, Math.max(3, Math.round(r.h * 0.6))); return [B('diagram', r.x, r.y + Math.floor((r.h - h) / 2), r.w, h, l)]; },
    cardIcon: function (r, l) {
      var b = [B('card', r.x, r.y, r.w, r.h, l)];
      if (r.w >= 2 && r.h >= 4) b.push(B('icon', r.x, r.y, 1, 2, 'Icon'));
      if (r.h >= 5 && r.w >= 2) b.push(B('text', r.x, r.y + r.h - 2, r.w, 2, 'Short line'));
      return b;
    },
    cardNum: function (r, l) {
      var b = [B('card', r.x, r.y, r.w, r.h, l)];
      b.push(B('number', r.x, r.y, r.w, Math.min(3, Math.max(1, r.h - 1)), 'Number'));
      if (r.h >= 4) b.push(B('text', r.x, r.y + r.h - 1, r.w, 1, 'Caption'));
      return b;
    },
    cardCut: function (r, l, ctx) {
      if (r.w < 2 || r.h < 3) return [B('card', r.x, r.y, r.w, r.h, l)];
      var cw = Math.max(1, Math.floor(r.w / 3)), chh = Math.max(2, Math.ceil(r.h * 0.6));
      var cy = (ctx && r.y - 1 >= ctx.titleBottom) ? r.y - 1 : r.y;
      var b = [B('card', r.x, r.y, r.w, r.h, l), B('cutout', r.x + r.w - cw, cy, cw, chh, 'Cutout')];
      b.push(B('number', r.x, r.y, Math.max(1, r.w - cw), Math.min(2, r.h - 1), 'Price'));
      if (r.h >= 4) b.push(B('text', r.x, r.y + r.h - 1, r.w, 1, 'Name'));
      return b;
    },
    heroCut: function (r, l, ctx) {
      if (r.w < 4 || r.h < 5) return F.cardCut(r, l, ctx);
      var cw = Math.ceil(r.w / 2), brk = ctx && r.y - 1 >= ctx.titleBottom;
      var b = [B('card', r.x, r.y, r.w, r.h, l), B('cutout', r.x + r.w - cw, brk ? r.y - 1 : r.y, cw, brk ? r.h + 1 : r.h, 'Signature cutout')];
      var th = Math.min(3, r.h - 4);
      b.push(B('text', r.x, r.y, r.w - cw, Math.max(1, th), 'Name + description'));
      b.push(B('number', r.x, r.y + r.h - 3, r.w - cw, 3, 'Price'));
      return b;
    },
    cutoutShape: function (r, l) {
      var w = Math.max(1, Math.ceil(r.w * 0.55)), x = r.x + Math.floor((r.w - w) / 2);
      return [B('shape', r.x, r.y, r.w, r.h, 'Color panel'), B('cutout', x, r.y, w, r.h, l || 'Cutout')];
    },
    darkText: function (r, l) {
      var b = [B('card', r.x, r.y, r.w, r.h, (l || 'Panel') + ' (dark)')];
      b.push(B('text', r.x, r.y, r.w, Math.min(3, r.h), 'The main sentence'));
      if (r.h >= 6) b.push(B('text', r.x, r.y + r.h - 2, r.w, 2, 'Supporting line'));
      return b;
    },
    numberBig: function (r, l) {
      var h = Math.min(r.h, Math.max(3, Math.ceil(r.h * 0.6)));
      var b = [B('number', r.x, r.y, r.w, h, l || 'One big number')];
      if (r.h - h >= 1) b.push(B('text', r.x, r.y + h, r.w, Math.min(2, r.h - h), 'What it means'));
      return b;
    },
    timeline: function (r, l) {
      var b = [B('list', r.x, r.y, r.w, r.h, l || 'Timeline of steps')];
      return b;
    }
  };

  /* ---------- per-slide recipes ---------- */
  var RECIPE = {
    about:     { structs: ['split', 'bento', 'rows', 'sidebar'], hero: [['image', 'Group photo'], ['darkText', 'Our story'], ['cutoutShape', 'Product cutout']], rest: [['cardIcon', 'Member and role'], ['card', 'Member and role'], ['image', 'Member photo']], min: 4 },
    need:      { structs: ['bento', 'split', 'rows', 'columns'], hero: [['darkText', 'The need'], ['numberBig', 'One big fact']], rest: [['cardNum', 'Fact card'], ['cardIcon', 'Reason card']], min: 3 },
    menu:      { structs: ['bento', 'rows', 'rowsflip', 'columns', 'sidebar'], hero: [['heroCut', 'Signature drink']], rest: [['cardCut', 'Drink: price + name']], min: 2 },
    numbers:   { structs: ['split', 'rows', 'rowsflip', 'sidebar', 'bento'], hero: [['chart', 'Chart from Google Sheets']], rest: [['table', 'Price table'], ['cardNum', 'Key number']], min: 1 },
    how:       { structs: ['rows', 'split', 'rowsflip'], hero: [['diagram', 'Steps with arrows'], ['timeline', 'Timeline of steps']], rest: [['cardIcon', 'Step note'], ['image', 'Step photo'], ['cutoutShape', 'Product cutout']], min: 1 },
    customers: { structs: ['columns', 'split', 'rows', 'bento'], hero: [['image', 'Map or persona'], ['cardIcon', 'Main customer group']], rest: [['cardIcon', 'Customer group'], ['card', 'Persona card']], min: 2 },
    sources:   { structs: ['split', 'rows', 'rowsflip', 'sidebar'], hero: [['table', 'Credits table'], ['list', 'Credits list']], rest: [['darkText', 'Declaration'], ['list', 'More credits'], ['card', 'Declaration card']], min: 1 },
    free:      { structs: ['split', 'bento', 'rows', 'rowsflip', 'sidebar', 'columns'], hero: [['image', 'Photo'], ['video', 'Video clip'], ['chart', 'Chart'], ['cutoutShape', 'Cutout'], ['diagram', 'Diagram']], rest: [['card', 'Card'], ['cardIcon', 'Card'], ['cardNum', 'Number card'], ['text', 'Text']], min: 1 }
  };

  function fillWith(spec, r, ctx) { return F[spec[0]](r, spec[1], ctx); }

  function genBody(slide) {
    var L = LABEL[slide] || LABEL.free, rc = RECIPE[slide] || RECIPE.free;
    var H = header(L, ch(0.15));
    var A = { x: 0, y: H.top, w: 12, h: 12 - H.top };
    var key = pick(rc.structs);
    var st = key === 'columns' ? sColumns(A, slide === 'customers' ? 3 : undefined) : STRUCTS[key](A);
    if (rc.min > st.rest.length) ensureTiles(st, rc.min);
    var ctx = { titleBottom: H.titleBottom };
    var blocks = H.b.slice();
    var heroSpec = pick(rc.hero), restSpec = pick(rc.rest);
    if (st.equal && slide !== 'numbers' && slide !== 'sources') heroSpec = restSpec; // equal columns: same card everywhere
    blocks = blocks.concat(fillWith(heroSpec, st.hero, ctx));
    st.rest.forEach(function (r, i) {
      var spec = restSpec;
      if (slide === 'how' && spec[0] === 'cardIcon') spec = ['cardIcon', 'Step ' + (i + 2)];
      blocks = blocks.concat(fillWith(spec, r, ctx));
    });
    return { name: st.name + (H.center ? ', centered title' : ''), b: blocks };
  }

  /* ---------- cover, offer, contact (no standard header) ---------- */
  function stack(x, y, w, items) {
    var b = [];
    items.forEach(function (it) { b.push(B(it[0], x + (it[3] || 0), y, Math.min(w, it[2] || w), it[1], it[4])); y += it[1] + (it[5] || 0); });
    return b;
  }
  function cluster(ax, aw, y0, h, n) {
    var b = [], mw = Math.min(aw, 3), mx = ax + Math.floor((aw - mw) / 2);
    if (n >= 2 && aw >= 5) { b.push(B('cutout', ax, y0 + 2, 2, h - 2, 'Cutout')); b.push(B('cutout', ax + aw - 2, y0 + 2, 2, h - 2, 'Cutout')); }
    b.push(B('cutout', mx, y0, mw, h, 'Signature cutout'));
    return b;
  }

  function genCover() {
    var v = pick(['split', 'centered', 'bleed', 'giant', 'z']), b = [], name = '';
    if (v === 'split') {
      var r = pick([5, 6, 7]), m = ch(0.5), tx = m ? 12 - r : 0, ax = m ? 0 : r, aw = 12 - r, ys = pick([0, 1, 2]);
      b = stack(tx, ys, r, [['logo', 2, 1, 0, 'Your logo', 1], ['title', 3, r, 0, 'Business name'], ['text', 1, r - 1, 0, 'Tagline', 1], ['eyebrow', 1, 4, 0, 'A business pitch · Group']]);
      if (ch(0.6)) b.unshift(B('shape', ax, 1, aw, 10, 'Color panel behind the picture'));
      b = b.concat(cluster(ax, aw, 2, 9, pick([1, 3])));
      name = 'Split: words ' + (m ? 'right' : 'left') + ', picture ' + (m ? 'left' : 'right');
    } else if (v === 'centered') {
      var k = pick([3, 4, 5]);
      b = [B('logo', 5, 0, 2, 2, 'Your logo'), B('title', 2, 2, 8, 3, 'Business name'), B('text', 3, 5, 6, 1, 'Tagline')];
      var cw = Math.floor(12 / k), off = Math.floor((12 - cw * k) / 2);
      for (var i = 0; i < k; i++) b.push(B('cutout', off + i * cw, 7, cw, 4, i === Math.floor(k / 2) ? 'Signature cutout' : 'Cutout'));
      if (ch(0.6)) b.push(B('shape', 0, 11, 12, 1, 'Shelf band'));
      name = 'Centered poster, ' + k + ' products in a row';
    } else if (v === 'bleed') {
      var left = ch(0.5), cx = left ? 0 : 6, cy = pick([4, 5]);
      b = [B('image', 0, 0, 12, 12, 'Full photo'), B('card', cx, cy, 6, 12 - cy, 'Title card'), B('logo', cx + 1, cy + 1, 1, 2, 'Your logo'), B('title', cx + 1, cy + 3, 5, 2, 'Business name'), B('text', cx + 1, cy + 5, 4, 1, 'Tagline')];
      name = 'Full photo with a title card ' + (left ? 'left' : 'right');
    } else if (v === 'giant') {
      var right = ch(0.5);
      b = [B('logo', 0, 0, 1, 2, 'Your logo'), B('title', 0, 2, 12, pick([3, 4]), 'Business name, very big'), B('text', right ? 0 : 4, 7, 6, 1, 'Tagline'), B('eyebrow', right ? 0 : 4, 9, 4, 1, 'Group and section'), B('cutout', right ? 9 : 0, 5, 3, 7, 'Cutout')];
      name = 'Giant name, picture ' + (right ? 'right' : 'left');
    } else {
      b = [B('logo', 0, 0, 1, 2, 'Your logo'), B('text', 8, 0, 4, 1, 'Tagline'), B('cutout', 0, 3, 5, 9, 'Hero cutout'), B('title', 6, 5, 6, 3, 'Business name'), B('button', 6, 9, 3, 1, 'A pitch by Group')];
      name = 'Z-pattern';
    }
    return { name: name, b: b };
  }

  function genOffer() {
    var v = pick(['split', 'ticket', 'badge', 'bleed', 'center']), b = [], name = '';
    if (v === 'split') {
      var r = pick([6, 7]), m = ch(0.5), tx = m ? 12 - r : 0, ax = m ? 0 : r;
      if (ch(0.7)) b.push(B('shape', 0, 0, 12, 12, 'Accent background'));
      b = b.concat(stack(tx, pick([1, 2]), r, [['eyebrow', 1, 4, 0, '08 · Offer', 1], ['title', 4, r, 0, 'The offer, big'], ['text', 1, r - 1, 0, 'Who and when', 1], ['button', 1, 4, 0, 'Call to action']]));
      b = b.concat(cluster(ax, 12 - r, 2, 9, pick([1, 3])));
      name = 'Statement ' + (m ? 'right' : 'left') + ', picture ' + (m ? 'left' : 'right');
    } else if (v === 'ticket') {
      b = [B('eyebrow', 4, 0, 4, 1, '08 · Offer'), B('card', 1, 2, 7, 7, 'Ticket'), B('card', 8, 2, 3, 7, 'Ticket stub'), B('title', 1, 3, 5, 3, 'The offer'), B('text', 8, 4, 3, 2, 'Show this at the shop'), B('cutout', 5, 5, 2, 5, 'Cutout'), B('button', 4, 10, 4, 1, 'Reserve now')];
      name = 'Coupon ticket';
    } else if (v === 'badge') {
      var bl = ch(0.5);
      b = [B('number', bl ? 0 : 8, 3, 4, 6, 'Big discount'), B('title', bl ? 5 : 0, 2, 7, 4, 'The offer'), B('text', bl ? 5 : 0, 6, 6, 2, 'Who and when'), B('button', bl ? 5 : 0, 9, 4, 1, 'Call to action')];
      name = 'Discount badge ' + (bl ? 'left' : 'right');
    } else if (v === 'bleed') {
      var cx = ch(0.5) ? 0 : 6;
      b = [B('image', 0, 0, 12, 12, 'Photo of the product'), B('card', cx, 2, 6, 8, 'Offer card'), B('title', cx + 1, 3, 4, 3, 'The offer'), B('text', cx + 1, 6, 4, 1, 'Who and when'), B('button', cx + 1, 8, 4, 1, 'Call to action')];
      name = 'Full photo and offer card';
    } else {
      b = [B('title', 2, 2, 8, 4, 'The offer'), B('text', 3, 6, 6, 1, 'Who and when'), B('button', 4, 8, 4, 1, 'Call to action'), B('cutout', 0, 5, 2, 7, 'Cutout'), B('cutout', 10, 5, 2, 7, 'Cutout')];
      name = 'Centered call';
    }
    return { name: name, b: b };
  }

  function genContact() {
    var v = pick(['split', 'centered', 'dark', 'qr', 'big']), b = [], name = '';
    if (v === 'split') {
      var m = ch(0.5), tx = m ? 6 : 0, ax = m ? 0 : 6;
      b = [B('logo', tx, 0, 1, 2, 'Logo'), B('title', tx + 1, 0, 5, 2, 'Thank you'), B('text', tx, 3, 5, 1, 'One friendly line'), B('list', tx, 5, 6, 5, 'Contact details')];
      var k = pick([3, 5]);
      if (k === 5) for (var i = 0; i < 5; i++) b.push(B('cutout', ax + i, 7, 1, 4, 'Cutout'));
      else b = b.concat(cluster(ax, 6, 3, 8, 3));
      name = 'Details ' + (m ? 'right' : 'left') + ', products ' + (m ? 'left' : 'right');
    } else if (v === 'centered') {
      var n = pick([3, 4]), w = 12 / n;
      b = [B('logo', 5, 0, 2, 2, 'Logo'), B('title', 3, 2, 6, 3, 'Thank you'), B('text', 4, 5, 4, 1, 'One friendly line')];
      ['Facebook', 'Find us', 'Open hours', 'Proposal link'].slice(0, n).forEach(function (l, j) { b.push(B('card', j * w, 8, w, 4, l)); });
      name = 'Centered thanks and ' + n + ' tiles';
    } else if (v === 'dark') {
      var left = ch(0.5), px = left ? 0 : 6, dx = left ? 7 : 1;
      b = [B('card', px, 0, 6, 12, 'Dark panel'), B('logo', px + 1, 1, 1, 2, 'Logo'), B('title', px + 1, 4, 5, 3, 'Thank you'), B('text', px + 1, 8, 4, 1, 'One line'),
        B('icon', dx, 2, 1, 2, 'Icon'), B('text', dx + 1, 2, 4, 2, 'Facebook'), B('icon', dx, 5, 1, 2, 'Icon'), B('text', dx + 1, 5, 4, 2, 'Place'), B('icon', dx, 8, 1, 2, 'Icon'), B('text', dx + 1, 8, 4, 2, 'Hours')];
      name = 'Dark half ' + (left ? 'left' : 'right');
    } else if (v === 'qr') {
      b = [B('title', 0, 0, 6, 2, 'Thank you'), B('image', 0, 3, 4, 7, 'QR code to your page'), B('list', 5, 3, 7, 6, 'Contact details'), B('button', 5, 10, 4, 1, 'Message us')];
      name = 'QR code and details';
    } else {
      b = [B('title', 0, 3, 12, 4, 'Thank you'), B('text', 2, 8, 8, 1, 'How to reach you, in one line'), B('logo', 5, 10, 2, 2, 'Logo')];
      name = 'Big thank you';
    }
    return { name: name, b: b };
  }

  function clamp(b) {
    return b.map(function (x) {
      var t = x.slice();
      t[3] = Math.max(1, Math.min(12, t[3])); t[4] = Math.max(1, Math.min(12, t[4]));
      t[1] = Math.max(0, Math.min(12 - t[3], t[1])); t[2] = Math.max(0, Math.min(12 - t[4], t[2]));
      return t;
    });
  }

  function generate(slide) {
    var out = slide === 'cover' ? genCover() : slide === 'offer' ? genOffer() : slide === 'contact' ? genContact() : genBody(slide);
    out.b = clamp(out.b);
    out.name = 'Random: ' + out.name;
    return out;
  }

  return { generate: generate };
})();
