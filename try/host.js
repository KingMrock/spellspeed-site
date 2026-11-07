/* Spellspeed "Try it" host, GPL-3.0-only.
 * Stands in for DuelingBook's deck constructor so Spellspeed's own deck-builder files (spellspeed/rules.js,
 * constructor.js, content.js, copied unchanged by scripts/build-try.cjs) run on spellspeed.com. It provides only
 * what those files call: the catalog in DuelingBook's card shape, card fronts, the card overview, and the deck
 * lists. It contains no DuelingBook code or markup. Card data comes from YGOPRODeck (scripts/build-try.cjs); faces are
 * drawn here, and images, when present, are self-hosted under art/<id>.jpg. */
(() => {
  'use strict';
  const $ = window.jQuery;
  const W = 813, H = 1185; // DuelingBook's card-front size; Spellspeed scales fronts from it.

  // ---- Catalog: the compact keys build-try.cjs writes, expanded into the card shape Spellspeed reads in DuelingBook
  // (the same as DuelingBook's loader gives, tests/link-audit/runtime.cjs mapCard).
  function mapCard(raw) {
    const c = { ...raw };
    c.name = c.n; c.treated_as = c.ta || c.n; c.effect = c.e || ''; c.card_type = c.c;
    if (c.mc) {
      c.monster_color = c.mc; if (c.ie == null) c.is_effect = 1;
      c.attribute = c.att; c.level = c.lvl; if (c.abi) c.ability = c.abi;
      c.flip = ~~c.flp; c.pendulum = ~~c.p; c.scale = ~~c.scl; if (c.arr) c.arrows = c.arr;
    } else c.monster_color = '';
    c.pendulum_effect = c.pef || ''; c.pendulum_effect_lowercase = c.pendulum_effect.toLowerCase();
    if (c.typ) c.type = c.typ;
    c.tcg_limit = c.tcgl ?? 3; c.ocg_limit = c.ocgl ?? 3;
    c.serial_number = String(c.s || c.id); if (c.d) c.tcg_date = c.d;
    c.tcg ??= 1; c.ocg ??= 1; c.art = c.a === 1; c.alt_passcodes = c.alt || [];
    for (const k of ['n', 'ta', 'e', 'c', 'mc', 'ie', 'att', 'lvl', 'abi', 'flp', 'p', 'pef', 'scl', 'arr', 'typ', 'tcgl', 'ocgl', 's', 'a', 'd', 'alt']) delete c[k];
    c.name_lowercase = c.name.toLowerCase(); c.effect_lowercase = c.effect.toLowerCase();
    return c;
  }

  // ---- What Spellspeed reads from DuelingBook's page globals.
  Object.assign(window, {
    currentLabel: 'deck_constructor', cards_fingerprint: '', Cards: [], ShowingPoints: false,
    GenesysCards: [], GoatCards: [], EdisonCards: [], SpeedCards: [], favorites: [],
    search_arr: [], deck_filled_arr: [], side_filled_arr: [], extra_filled_arr: [],
    deck: { id: 'try', label: 'Try deck' }, currentDeckId: 'try', contentScale: 1, loading_deck: false,
    hideDim() {}, goto() {}, setUnsavedChanges() { saveDeck(); }, initializeDeckCards() { drawDeck(); },
    sortByName: (a, b) => a.name.localeCompare(b.name), getPoints: () => undefined, getLegality: () => 3,
    // Spellspeed adds the card id and .jpg (Lab icon, Lab breakdown thumbnails): images come from this site only.
    CARD_IMAGES_START: 'art/'
  });
  let banlist = { id: 0, f: [], l: [], s: [] }, banlistsData = [];
  window.getBanlist = () => banlist;
  window.getLimit = (id, fallback = 3) => banlist.f.includes(id) ? 0 : banlist.l.includes(id) ? 1 : banlist.s.includes(id) ? 2 : 3; // "No banlist": 3 of everything

  // ---- Card faces (Spellspeed's own drawing, not Konami's frame).
  const frameOf = c => c.card_type === 'Spell' ? 'spell' : c.card_type === 'Trap' ? 'trap' : String(c.monster_color || 'effect').toLowerCase();
  const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  function typeLine(c) {
    if (c.card_type !== 'Monster') return `${c.card_type} · ${c.type || 'Normal'}`;
    return [c.type, c.monster_color, c.pendulum ? 'Pendulum' : '', c.ability, c.is_effect && !['Effect', 'Normal'].includes(c.monster_color) ? 'Effect' : ''].filter(Boolean).join(' / ');
  }
  function stats(c) {
    if (c.card_type !== 'Monster') return '';
    const link = c.monster_color === 'Link';
    return `<span>ATK ${esc(c.atk)}</span><span>${link ? 'LINK-' + esc(c.level) : 'DEF ' + esc(c.def)}</span>`;
  }
  function level(c) {
    if (c.card_type !== 'Monster' || c.monster_color === 'Link') return '';
    const rank = c.monster_color === 'Xyz';
    return `<span class="ss-level${rank ? ' ss-rank' : ''}">${rank ? 'Rank' : 'Level'} ${esc(c.level)}${c.pendulum ? ` · Scale ${esc(c.scale)}` : ''}</span>`;
  }
  // A card with a self-hosted image shows it whole; the others get a drawn face.
  function drawFace(node, c) {
    if (c.art) {
      node.className = 'cardfront ss-face ss-image';
      node.innerHTML = `<img class="pic" alt="" decoding="async" src="art/${encodeURIComponent(c.id)}.jpg"><span class="ss-limit"></span>`;
      return;
    }
    node.className = `cardfront ss-face ss-${frameOf(c)}${c.pendulum ? ' ss-pendulum' : ''}`;
    node.innerHTML = `<span class="ss-name">${esc(c.name)}</span>${c.attribute ? `<span class="ss-attr">${esc(c.attribute)}</span>` : ''}${level(c)}` +
      `<span class="ss-art"><span class="ss-art-name">${esc(c.name)}</span></span>` +
      `<span class="ss-type">${esc(typeLine(c))}</span><span class="ss-text">${esc(c.pendulum_effect ? c.pendulum_effect + '\n\n' + c.effect : c.effect)}</span>` +
      `<span class="ss-stats">${stats(c)}</span><span class="ss-limit"></span>`;
  }
  // A front is a jQuery node with the card's data, as DuelingBook's are (constructor.js reads .data()).
  function front(cls = '') {
    const card = $(`<div class="cardfront ${cls}"></div>`);
    card.initializeAndLimit = (data, ocg) => {
      card.removeData(); card.data(data); drawFace(card[0], data); card[0].classList.add(...cls.split(' ').filter(Boolean));
      const limit = ocg ? data.ocg_limit ?? 3 : window.getLimit(data.id, data.tcg_limit ?? 3);
      const badge = card[0].querySelector('.ss-limit'); badge.textContent = limit < 3 ? String(limit) : ''; badge.hidden = limit >= 3;
      card.attr('aria-label', data.name);
    };
    card.copyCard = other => card.initializeAndLimit({ ...other.data() });
    return card;
  }
  window.newCardFront = () => front();

  // Search results, with DuelingBook's habits: click shows the card; double-click, right-click (DuelingBook adds
  // with it) or a drag onto the deck adds it; Shift sends it to the Side. On a phone a double tap adds (see below).
  const narrow = () => document.documentElement.classList.contains('ss-narrow');
  window.SearchCard = function SearchCard() {
    const card = front('ss-result');
    card.attr({ tabindex: '0', role: 'button', draggable: 'true' });
    card.on('click', () => window.previewFront(card));
    card.on('dblclick', event => { event.preventDefault(); if (!narrow()) addFrom(card, event.shiftKey); });
    card.on('contextmenu', event => { event.preventDefault(); if (!narrow()) addFrom(card, event.shiftKey); });
    card.on('keydown', event => { if (event.key === 'Enter') addFrom(card, event.shiftKey); else if (event.key === ' ') { event.preventDefault(); window.previewFront(card); } });
    card.on('mouseenter', () => { if (matchMedia('(hover: hover)').matches) window.previewFront(card); });
    card[0].addEventListener('dragstart', event => startDrag(event, card, null));
    return card;
  };

  // ---- Card overview: content.js links names, archetypes, Access, Starters and the Lab breakdown inside #preview_txt.
  window.preview = $('#preview');
  window.previewFront = source => {
    const data = { ...source.data() };
    if (!data.name) return;
    window.preview.removeData(); window.preview.data(data);
    drawFace(document.querySelector('#preview > .cardfront'), data);
    document.querySelector('#preview .name_txt').textContent = data.name;
    const text = document.getElementById('preview_txt'), parts = [];
    parts.push(`<span class="ss-pv-type">${esc(typeLine(data))}${data.attribute ? ' · ' + esc(data.attribute) : ''}${data.card_type === 'Monster' && data.monster_color !== 'Link' ? ` · ${data.monster_color === 'Xyz' ? 'Rank' : 'Level'} ${esc(data.level)}` : ''}${data.card_type === 'Monster' ? ` · ${esc(data.atk)} / ${data.monster_color === 'Link' ? 'LINK-' + esc(data.level) : esc(data.def)}` : ''}</span>`);
    if (data.pendulum_effect) parts.push(`<span>[Pendulum Effect]\n${esc(data.pendulum_effect)}</span>`);
    parts.push(`<span>${esc(data.effect)}</span>`);
    text.innerHTML = parts.join('');
    text.scrollTop = 0;
    document.getElementById('ss-add').disabled = document.getElementById('ss-side').disabled = false;
    syncRemove();
  };

  // ---- Deck lists, with DuelingBook's names so Spellspeed's undo and Summon Lab read them.
  const extraDeck = c => c.card_type === 'Monster' && /Fusion|Synchro|Xyz|Link/.test(c.monster_color);
  const deckName = data => data.treated_as || data.name;
  const copies = data => [...window.deck_filled_arr, ...window.side_filled_arr, ...window.extra_filled_arr].filter(f => deckName(f.data()) === deckName(data)).length;
  const targetOf = (data, side) => side ? ['side_filled_arr', 'addCardToSide', 'Side Deck'] : extraDeck(data) ? ['extra_filled_arr', 'addCardToExtra', 'Extra Deck'] : ['deck_filled_arr', 'addCardToMain', 'Main Deck'];
  function addFrom(source, side) {
    const data = source.data(); if (!data?.id) return false;
    const card = front(); card.initializeAndLimit({ ...data });
    const [list, add, label] = targetOf(data, side), before = window[list].length;
    window[add](card);
    afterChange();
    const added = window[list].length > before;
    // On a phone the deck is on another tab: say where the card went.
    if (added && narrow()) note(`${data.name} → ${label} (${window[list].length})`, true);
    return added;
  }
  // Main or Extra Deck ↔ Side Deck, checking the room there first so a full zone never loses the card.
  function move(card, from, side) {
    const [list, , label] = targetOf(card.data(), side), max = side ? 15 : list === 'extra_filled_arr' ? 15 : 60;
    if (window[list].length >= max) return note(`The ${label} is full (${max} cards).`);
    window[from.remove](card);
    window.loading_deck = true;
    try { addFrom(card, side); } finally { window.loading_deck = false; }
  }
  function room(list, max, card) {
    const id = card.data('id'), limit = window.getLimit(id, card.data('tcg_limit') ?? 3);
    if (window[list].length >= max) return note(`That part of the deck is full (${max} cards).`), false;
    if (!window.loading_deck && copies(card.data()) >= limit) return note(limit ? `${card.data('name')}: ${limit} ${limit > 1 ? 'copies' : 'copy'} at most.` : `${card.data('name')} is Forbidden.`), false;
    return true;
  }
  const adder = (list, max) => card => { if (!room(list, max, card)) return; window[list].push(card); drawDeck(); };
  const remover = list => card => { const i = window[list].indexOf(card); if (i >= 0) window[list].splice(i, 1); drawDeck(); };
  Object.assign(window, {
    addCardToMain: adder('deck_filled_arr', 60), addCardToSide: adder('side_filled_arr', 15), addCardToExtra: adder('extra_filled_arr', 15),
    removeCardFromMain: remover('deck_filled_arr'), removeCardFromSide: remover('side_filled_arr'), removeCardFromExtra: remover('extra_filled_arr'),
    clearDeck() { window.deck_filled_arr = []; window.side_filled_arr = []; window.extra_filled_arr = []; drawDeck(); },
    countMain() {}, countSide() {}, countExtra() {}, countPoints() {}
  });
  function afterChange() { saveDeck(); }
  const zones = [['deck_filled_arr', 'main', 'removeCardFromMain'], ['extra_filled_arr', 'extra', 'removeCardFromExtra'], ['side_filled_arr', 'sidedeck', 'removeCardFromSide']];
  function drawDeck() {
    for (const [list, zone, remove] of zones) {
      const box = document.querySelector(`#ss-${zone} .ss-cards`), cards = window[list];
      const order = [...cards].sort((a, b) => sortKey(a.data()) - sortKey(b.data()) || a.data('name').localeCompare(b.data('name')));
      // Deck cards, with DuelingBook's habits: double-click or right-click removes, Ctrl + right-click adds a copy,
      // Shift moves the card between the deck and the Side; drag it to another zone, or out of the deck to remove it.
      const side = zone === 'sidedeck', from = { list, remove, zone };
      box.replaceChildren(...order.map(card => {
        const slot = document.createElement('button'); slot.type = 'button'; slot.className = 'ss-slot'; slot.draggable = true;
        slot.title = `${card.data('name')} · double-click or right-click: remove · Shift: ${side ? 'back to the deck' : 'to the Side'} · Ctrl + right-click: one more`;
        slot.append(card[0]);
        slot.onclick = () => window.previewFront(card);
        const act = event => {
          event.preventDefault();
          if (narrow()) return; // phone: a long press does nothing; the card view has − Remove
          if (event.shiftKey) move(card, from, !side);
          else if (event.ctrlKey && event.type === 'contextmenu') addFrom(card, side);
          else { window[remove](card); afterChange(); }
        };
        slot.ondblclick = act; slot.oncontextmenu = act;
        slot.addEventListener('dragstart', event => startDrag(event, card, from));
        return slot;
      }));
      document.querySelector(`#ss-${zone} .ss-count`).textContent = String(cards.length);
    }
    const main = window.deck_filled_arr.map(f => f.data());
    document.querySelector('#ss-main .ss-split').textContent = ['Monster', 'Spell', 'Trap'].map(t => `${main.filter(c => c.card_type === t).length} ${t}`).join(' · ');
    const count = window.deck_filled_arr.length + window.extra_filled_arr.length + window.side_filled_arr.length;
    document.querySelector('[data-view="deck"]').textContent = count ? `Deck · ${window.deck_filled_arr.length}` : 'Deck';
    syncRemove(); slotScale();
  }
  const sortKey = c => ({ Monster: 0, Spell: 1, Trap: 2 })[c.card_type] ?? 3;
  // − Remove takes one copy of the shown card out of the Main or Extra Deck, else the Side Deck.
  function copyOf(id) {
    for (const [list, , remove] of zones) { const card = window[list].find(f => f.data('id') === id); if (card) return { card, remove }; }
    return null;
  }
  function syncRemove() { document.getElementById('ss-remove').disabled = !copyOf(window.preview.data('id')); }
  // The phone deck sizes its slots with the grid; a drawn face (a card without an image) follows the slot width.
  function slotScale() {
    const slot = document.querySelector('#ss-deck-phone .ss-slot');
    if (slot?.clientWidth) document.getElementById('ss-deck-phone').style.setProperty('--slot-scale', String(slot.clientWidth / W));
  }

  // ---- The deck is kept in this browser only (and in the URL when shared).
  const KEY = 'spellspeed-try-deck';
  function deckIds() { return zones.map(([list]) => window[list].map(f => f.data('id')).join('.')).join('_'); }
  function saveDeck() { try { localStorage.setItem(KEY, deckIds()); } catch {} }
  function loadDeck(ids) {
    const byId = new Map(window.Cards.map(c => [c.id, c]));
    window.clearDeck(true); window.loading_deck = true;
    try {
      String(ids || '').split('_').forEach((part, i) => {
        for (const id of part.split('.').filter(Boolean)) { const c = byId.get(Number(id)); if (!c) continue; const card = front(); card.initializeAndLimit({ ...c }); window[['addCardToMain', 'addCardToExtra', 'addCardToSide'][i]](card); }
      });
    } finally { window.loading_deck = false; }
    drawDeck();
  }
  let noteTimer;
  function note(text, ok = false) {
    const node = document.getElementById('ss-note'); node.textContent = text; node.classList.toggle('ss-ok', ok); node.hidden = false;
    clearTimeout(noteTimer); noteTimer = setTimeout(() => { node.hidden = true; }, 2600);
  }

  // ---- Drag and drop (desktop): a result onto a zone adds it there; a deck card onto another zone moves it, and
  // anywhere else on the builder removes it, as in DuelingBook.
  let dragging = null;
  function startDrag(event, card, from) {
    dragging = { card, from };
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.setData('text/plain', card.data('name'));
    const img = card[0].querySelector('img.pic');
    if (img) event.dataTransfer.setDragImage(img, img.naturalWidth / 2, img.naturalHeight / 2);
  }
  for (const [, zone] of zones) {
    const box = document.getElementById(`ss-${zone}`);
    box.addEventListener('dragover', event => { if (!dragging) return; event.preventDefault(); box.classList.add('ss-drop'); });
    box.addEventListener('dragleave', event => { if (!box.contains(event.relatedTarget)) box.classList.remove('ss-drop'); });
    box.addEventListener('drop', event => {
      if (!dragging) return;
      event.preventDefault(); event.stopPropagation(); box.classList.remove('ss-drop');
      const { card, from } = dragging, side = zone === 'sidedeck';
      if (!from) addFrom(card, side);
      else if ((from.zone === 'sidedeck') !== side) move(card, from, side);
    });
  }
  const builder = document.getElementById('deck_constructor');
  builder.addEventListener('dragover', event => { if (dragging?.from) event.preventDefault(); });
  builder.addEventListener('drop', event => { if (!dragging?.from) return; event.preventDefault(); window[dragging.from.remove](dragging.card); afterChange(); });
  addEventListener('dragend', () => { dragging = null; document.querySelectorAll('.ss-drop').forEach(node => node.classList.remove('ss-drop')); });

  // ---- Import and export: YDKe codes and .ydk files, the two formats DuelingBook's Import reads ("YDKe Code",
  // "YDK or XML file"). A YDKe code is ydke://main!extra!side!, each part base64 of little-endian 32-bit passcodes.
  // Cards export the passcode DuelingBook knows (build-try.cjs s), and import by any of their passcodes.
  const passcode = card => Number(card.data('serial_number')) || card.data('id');
  const parts = () => zones.map(([list]) => window[list].map(passcode));
  function toBase64(codes) {
    const bytes = new Uint8Array(codes.length * 4), data = new DataView(bytes.buffer);
    codes.forEach((code, i) => data.setUint32(i * 4, code, true));
    return btoa(String.fromCharCode(...bytes));
  }
  function fromBase64(text) {
    const bytes = Uint8Array.from(atob(text), ch => ch.charCodeAt(0)), data = new DataView(bytes.buffer);
    if (bytes.length % 4) throw new Error('not whole passcodes');
    return Array.from({ length: bytes.length >> 2 }, (_, i) => data.getUint32(i * 4, true));
  }
  const toYdke = () => 'ydke://' + parts().map(toBase64).join('!') + '!';
  const toYdk = () => { const [main, extra, side] = parts(); return ['#created by Spellspeed (spellspeed.com/try)', '#main', ...main, '#extra', ...extra, '!side', ...side, ''].join('\n'); };
  function parseDeck(text) {
    const ydke = String(text).match(/ydke:\/\/([A-Za-z0-9+/=]*)!([A-Za-z0-9+/=]*)!([A-Za-z0-9+/=]*)/);
    if (ydke) return ydke.slice(1, 4).map(fromBase64);
    if (!/#main/.test(text)) return null;
    const out = [[], [], []]; let part = -1;
    for (const raw of String(text).split(/\r?\n/)) {
      const line = raw.trim();
      if (line === '#main') part = 0; else if (line === '#extra') part = 1; else if (line === '!side') part = 2;
      else if (part >= 0 && /^\d+$/.test(line)) out[part].push(Number(line));
    }
    return out;
  }
  function importDeck(text) {
    let lists; try { lists = parseDeck(text); } catch { lists = null; }
    if (!lists) return note('That is not a YDKe code or a .ydk file.'), false;
    const total = lists.flat().length;
    if (!total) return note('That deck is empty.'), false;
    const byCode = new Map();
    for (const c of window.Cards) for (const code of [...c.alt_passcodes, Number(c.serial_number), c.id]) byCode.set(code, c);
    window.clearDeck(); window.loading_deck = true; let missing = 0;
    try {
      lists.forEach((codes, i) => codes.forEach(code => {
        const c = byCode.get(code); if (!c) return void missing++;
        const card = front(); card.initializeAndLimit({ ...c });
        window[i === 2 ? 'addCardToSide' : extraDeck(c) ? 'addCardToExtra' : 'addCardToMain'](card);
      }));
    } finally { window.loading_deck = false; }
    drawDeck(); afterChange();
    const added = zones.reduce((sum, [list]) => sum + window[list].length, 0), over = total - missing - added;
    note(`Imported ${added} cards${missing ? `; ${missing} not found in the catalog` : ''}${over > 0 ? `; ${over} over the 60 / 15 / 15 limits` : ''}.`, !missing && over <= 0);
    return true;
  }
  const share = document.getElementById('ss-share'), codeOut = document.getElementById('ss-ydke-out');
  const empty = () => !parts().flat().length;
  document.getElementById('ss-io').onclick = () => {
    codeOut.value = empty() ? '' : toYdke(); codeOut.placeholder = 'Your deck is empty';
    document.getElementById('ss-copy').disabled = document.getElementById('ss-download').disabled = empty();
    share.showModal();
  };
  document.getElementById('ss-copy').onclick = async () => {
    try { await navigator.clipboard.writeText(codeOut.value); note('Code copied. In DuelingBook: Import → YDKe Code, then paste.', true); }
    catch { codeOut.focus(); codeOut.select(); note('Select the code and copy it.'); }
  };
  document.getElementById('ss-download').onclick = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([toYdk()], { type: 'text/plain' })); link.download = 'spellspeed-deck.ydk';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const replaceOk = () => empty() || confirm('Replace the deck here with the imported one?');
  document.getElementById('ss-import').onclick = () => {
    const field = document.getElementById('ss-import-text');
    if (!field.value.trim()) return note('Paste a YDKe code or a .ydk file first.');
    if (replaceOk() && importDeck(field.value)) { field.value = ''; share.close(); }
  };
  const file = document.getElementById('ss-import-file');
  file.parentElement.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); file.click(); } });
  file.onchange = async () => {
    const chosen = file.files[0]; file.value = '';
    if (chosen && replaceOk() && importDeck(await chosen.text())) share.close();
  };

  // ---- Stage: DuelingBook's 1024 × 640 constructor coordinates, scaled to the window. On narrow screens one
  // part of it at a time (card or search), chosen with the tabs; the Deck tab moves the deck zones out of the
  // stage into a page-wide grid with bigger cards.
  const REGIONS = { card: [0, 206], deck: [0, 206], search: [794, 1024] };
  // content.js clears window.DBLiteLayout while its adaptive layout is off (it is, here): keep the host's value.
  let searchLayout = { constructorWidth: 216 };
  Object.defineProperty(window, 'DBLiteLayout', { configurable: true, get: () => searchLayout, set() {} });
  let view = 'search';
  function placeZones(narrow) {
    const root = document.getElementById('deck_constructor'), phone = document.getElementById('ss-deck-phone');
    for (const id of ['ss-main', 'ss-extra', 'ss-sidedeck']) {
      const zone = document.getElementById(id);
      if (narrow && zone.parentElement !== phone) phone.append(zone);
      if (!narrow && zone.parentElement !== root) root.insertBefore(zone, root.querySelector(':scope > .dblite-results-bg, :scope > .cards'));
    }
  }
  function layout() {
    const viewport = document.getElementById('ss-viewport'), stage = document.getElementById('ss-stage');
    const width = viewport.parentElement.clientWidth, narrow = width < 760;
    document.documentElement.classList.toggle('ss-narrow', narrow);
    placeZones(narrow);
    viewport.hidden = narrow && view === 'deck';
    document.getElementById('ss-deck-phone').hidden = !(narrow && view === 'deck');
    slotScale();
    if (narrow) searchLayout = { constructorWidth: 216 };
    const wide = Math.max(0, (window.DBETTERConstructor?.searchWidth?.() || 216) - 216);
    const [x0, x1] = narrow ? (view === 'search' ? [794 - wide, 1024] : REGIONS[view]) : [0, 1024];
    // Desktop: as wide as the column allows, but the whole stage fits under the sticky header.
    const header = document.querySelector('.top')?.offsetHeight || 56;
    const scale = narrow ? width / (x1 - x0) : Math.max(.5, Math.min((width - 32) / 1024, (innerHeight - header - 16) / 640, 1.5));
    // Desktop: the width the stage's height leaves over goes to the card search, so more results fit in a row
    // (Spellspeed's adaptive constructor width, as content.js sets it in DuelingBook; its splitter still widens it).
    const extra = narrow ? 0 : Math.max(0, Math.floor((width - 32) / scale - 1024));
    searchLayout = { constructorWidth: 216 + extra };
    document.documentElement.style.setProperty('--ss-search-extra', extra + 'px');
    stage.style.width = document.getElementById('deck_constructor').style.width = 1024 + extra + 'px';
    stage.style.transform = `translate(${-x0 * scale}px, 0) scale(${scale})`;
    viewport.style.height = 640 * scale + 'px'; viewport.style.width = narrow ? '100%' : (1024 + extra) * scale + 'px';
    window.contentScale = scale;
    for (const tab of document.querySelectorAll('[data-view]')) tab.setAttribute('aria-selected', String(tab.dataset.view === view));
    window.DBETTERConstructor?.resize();
  }
  // A new view starts at its top, just under the sticky header and tabs.
  function show(next) {
    view = next; layout();
    const shown = view === 'deck' && document.documentElement.classList.contains('ss-narrow') ? 'ss-deck-phone' : 'ss-viewport';
    const tabs = document.getElementById('ss-tabs'), top = document.getElementById(shown).getBoundingClientRect().top + scrollY;
    scrollTo({ top: Math.max(0, top - tabs.getBoundingClientRect().bottom + 4), behavior: 'instant' });
  }
  for (const tab of document.querySelectorAll('[data-view]')) tab.addEventListener('click', () => show(tab.dataset.view));
  addEventListener('resize', layout);

  document.getElementById('ss-add').onclick = () => { addFrom(window.preview, false); };
  document.getElementById('ss-side').onclick = () => { addFrom(window.preview, true); };
  document.getElementById('ss-remove').onclick = () => { const hit = copyOf(window.preview.data('id')); if (hit) { window[hit.remove](hit.card); afterChange(); } };
  document.getElementById('ss-clear').onclick = () => { if (!empty() && confirm('Remove every card from the deck?')) { window.clearDeck(); afterChange(); } };
  // On a phone: one tap on a result opens the card overview, a double tap adds the card and stays in the search;
  // a tapped deck card opens the card overview.
  let tap = null;
  addEventListener('click', event => {
    const result = event.target.closest?.('.ss-result');
    if (narrow() && view === 'search' && result) {
      if (tap?.node === result && event.timeStamp - tap.time < 350) { clearTimeout(tap.timer); tap = null; addFrom($(result), false); return; }
      clearTimeout(tap?.timer);
      tap = { node: result, time: event.timeStamp, timer: setTimeout(() => { tap = null; show('card'); }, 350) };
    }
    if (narrow() && view === 'deck' && event.target.closest?.('.ss-slot')) show('card');
    if (event.target.closest?.('.dblite-card-ref, .dblite-lab-way, .dblite-preview-lab button') && narrow() && view === 'card') setTimeout(() => show('search'), 0);
  }, true);

  // ---- Boot: load the catalog, then let Spellspeed build its search.
  async function boot() {
    layout();
    const started = performance.now(), status = document.getElementById('ss-loading');
    const response = await fetch('cards.json'), data = await response.json();
    window.Cards = data.cards.map(mapCard);
    banlistsData = data.banlists || [];
    const select = document.getElementById('banlists');
    for (const b of banlistsData) select.append(new Option(b.n, String(b.id)));
    select.append(new Option('No banlist', '0'));
    banlist = banlistsData[0] || banlist;
    select.addEventListener('change', () => { banlist = banlistsData.find(b => String(b.id) === select.value) || { id: 0, f: [], l: [], s: [] }; drawDeck(); });
    window.banlists = $(select);
    window.cards_fingerprint = data.version;
    if (data.updated) document.getElementById('ss-data-version').textContent = `Cards as of ${data.updated}.`;
    window.DBETTERConstructor.tick();
    let saved = new URLSearchParams(location.hash.slice(1)).get('deck');
    if (!saved) try { saved = localStorage.getItem(KEY); } catch {}
    if (saved) loadDeck(saved); else drawDeck();
    const first = window.Cards.find(c => c.name === 'Dark Magician') || window.Cards[0];    const sample = front(); sample.initializeAndLimit(first); window.previewFront(sample);
    status.textContent = `${window.Cards.length.toLocaleString('en')} cards loaded in ${((performance.now() - started) / 1000).toFixed(1)} s`;
    window.ssTry = { loadMs: performance.now() - started, cards: window.Cards.length };
    layout();
  }
  // After the Spellspeed scripts below this one have run.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => start()); else start();
  function start() { boot().catch(error => { document.getElementById('ss-loading').textContent = 'Could not load the cards: ' + error.message; console.error(error); }); }
})();
