// Application state
const state = {
  config: null,
  tierId: 'silver',
  iconIndex: 0,
  customIconUrl: null,
  title: 'Tap to edit Title',
  tag: 'UTILITY',
  desc: 'When you critical strike, you gain Mana and Max Health'
};

const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// ---------------------------------------------------------------------------
// UndoHistory — per-field undo stack for contenteditable elements.
// Stores plain-text snapshots so it survives innerHTML replacement.
// ---------------------------------------------------------------------------
class UndoHistory {
  constructor({ maxSize = 200, debounceMs = 300 } = {}) {
    this.stack = [];      // [{ text, caret }]
    this.index = -1;      // current position in stack
    this.maxSize = maxSize;
    this.debounceMs = debounceMs;
    this._timer = null;
    this._isMutating = false; // suppress input events triggered by our own writes
  }

  // Record the current state immediately (e.g. on focus or Enter)
  pushNow(text, caret) {
    // Drop any redo-future
    this.stack.splice(this.index + 1);
    // Avoid duplicate consecutive entries
    const top = this.stack[this.index];
    if (top && top.text === text) return;
    this.stack.push({ text, caret });
    if (this.stack.length > this.maxSize) this.stack.shift();
    this.index = this.stack.length - 1;
  }

  // Schedule a debounced push (collapses rapid keystrokes into one entry)
  push(text, caret) {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.pushNow(text, caret), this.debounceMs);
  }

  // Flush any pending debounced push immediately
  flush(text, caret) {
    clearTimeout(this._timer);
    this.pushNow(text, caret);
  }

  canUndo() { return this.index > 0; }

  undo() {
    if (!this.canUndo()) return null;
    this.index -= 1;
    return this.stack[this.index];
  }
}

// Bootstrap — fetch config then wire up the UI
async function init() {
  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    state.config = await res.json();
  } catch (err) {
    const el = document.getElementById('config-error');
    el.textContent = 'Failed to load config.json: ' + err.message;
    el.hidden = false;
    return; // halt
  }
  readURIParams();
  renderTierRow();
  renderIconGrid();
  renderCard();
  renderKeywordWall();
  bindEvents();

  // If URL contains a shared card (tier + icon + title or desc), scroll to preview
  const p = new URLSearchParams(location.search);
  if (p.has('tier') && (p.has('title') || p.has('desc'))) {
    // Small delay to let scroll-snap settle after initial render
    setTimeout(() => {
      document.getElementById('preview-section').scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }
}
document.addEventListener('DOMContentLoaded', init);

// Render the tier selection row
function renderTierRow() {
  const row = document.getElementById('tier-row');
  row.innerHTML = '';
  state.config.tiers.forEach(tier => {
    const btn = document.createElement('button');
    btn.className = 'tier-btn';
    btn.dataset.tierId = tier.id;
    const isActive = tier.id === state.tierId;
    btn.setAttribute('aria-pressed', String(isActive));
    if (isActive) btn.classList.add('tier-btn--active');

    const img = document.createElement('img');
    img.src = tier.background;
    img.alt = tier.label;
    img.className = 'tier-thumb';
    img.onerror = () => { img.src = TRANSPARENT_PIXEL; };

    const label = document.createElement('span');
    label.className = 'tier-label';
    label.textContent = tier.label;

    btn.appendChild(img);
    btn.appendChild(label);
    row.appendChild(btn);
  });
}

// Render the icon grid for the current tier
function renderIconGrid() {
  const grid = document.getElementById('icon-grid');
  grid.innerHTML = '';
  const tier = state.config.tiers.find(t => t.id === state.tierId);
  if (!tier) return;
  tier.icons.forEach((icon, index) => {
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.dataset.iconIndex = index;
    btn.setAttribute('aria-pressed', String(index === state.iconIndex));
    if (index === state.iconIndex) btn.classList.add('icon-btn--active');

    const img = document.createElement('img');
    img.src = icon.src;
    img.alt = icon.label;
    img.loading = 'lazy';
    img.onerror = () => { img.src = TRANSPARENT_PIXEL; };

    btn.appendChild(img);
    grid.appendChild(btn);
  });
}

// Render / update the augment card
function renderCard() {
  const tier = state.config.tiers.find(t => t.id === state.tierId);
  if (!tier) return;

  // Background
  const bg = document.getElementById('card-bg');
  bg.src = tier.background;
  bg.onerror = () => { bg.src = TRANSPARENT_PIXEL; };

  // Icon — set as background-image on the wrap div for correct aspect ratio in html2canvas
  const iconWrap = document.querySelector('.card-icon-wrap');
  let iconSrc;
  if (state.customIconUrl) {
    iconSrc = state.customIconUrl;
  } else {
    const iconData = tier.icons[state.iconIndex] || tier.icons[0];
    iconSrc = iconData ? iconData.src : '';
  }
  iconWrap.style.backgroundImage = iconSrc ? `url('${iconSrc}')` : 'none';

  // Title
  const titleEl = document.getElementById('card-title');
  titleEl.innerText = state.title;

  // Tag
  const tagEl = document.getElementById('card-tag');
  tagEl.innerText = state.tag;

  // Description with keyword highlighting
  const descEl = document.getElementById('card-desc');
  highlightKeywords(descEl, state.desc, state.config.keywords);
}

// Returns the caret offset (in plain-text characters, counting \n for each <br>) within a contenteditable element
function getCaretOffset(el) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  // Walk the range contents manually so we count <br> as \n
  let offset = 0;
  const walker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node === el) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  let node;
  outer: while ((node = walker.nextNode())) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === 'BR') offset += 1;
      continue;
    }
    // Text node
    if (node === range.endContainer) {
      offset += range.endOffset;
      break outer;
    }
    offset += node.textContent.length;
  }
  return offset;
}

// Restores the caret to a plain-text offset (counting \n for each <br>) within a contenteditable element
function setCaretOffset(el, offset) {
  const sel = window.getSelection();
  if (!sel) return;
  let remaining = offset;
  const walker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node === el) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === 'BR') {
        if (remaining === 0) {
          // Place caret before the <br>
          const range = document.createRange();
          range.setStartBefore(node);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        }
        remaining -= 1;
      }
      continue;
    }
    // Text node
    if (remaining <= node.textContent.length) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    remaining -= node.textContent.length;
  }
  // Fallback: place at end
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Wrap recognised keywords in styled <span> elements, preserving caret position
function highlightKeywords(descEl, text, keywords) {
  // Save caret offset before replacing innerHTML
  const hasFocus = document.activeElement === descEl;
  const caretOffset = hasFocus ? getCaretOffset(descEl) : null;

  if (!keywords || !text) {
    descEl.innerHTML = escapeHtml(text || '');
    if (hasFocus && caretOffset !== null) setCaretOffset(descEl, caretOffset);
    return;
  }

  // Sort keywords longest-first to avoid partial-match clobbering
  const entries = Object.entries(keywords);
  entries.sort((a, b) => b[0].length - a[0].length);

  // Helper: highlight keywords within a single line of plain text
  function highlightLine(line) {
    if (entries.length === 0) return escapeHtml(line);
    const pattern = new RegExp(
      '(?:(?:\\d+(?:\\.\\d+)?%?|\\d+(?:\\.\\d+)?)\\s+)?(?:' +
      entries.map(([k]) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
      ')',
      'gi'
    );
    return line.replace(pattern, match => {
      const kwMatch = match.match(/^(?:\d[\d.]*%?\s+)?(.+)$/i);
      const kwPart = kwMatch ? kwMatch[1] : match;
      const entry = entries.find(([k]) => k.toLowerCase() === kwPart.toLowerCase());
      if (!entry) return escapeHtml(match);
      const [, rule] = entry;
      const iconHtml = rule.icon
        ? `<img src="${rule.icon}" class="kw-icon" aria-hidden="true" onerror="this.style.display='none'">`
        : '';
      return `<span class="kw" style="color:${rule.color}">${iconHtml}${escapeHtml(match)}</span>`;
    });
  }

  // Split on newlines, highlight each line, rejoin with <br>
  const html = text
    .split('\n')
    .map(line => highlightLine(line))
    .join('<br>');

  descEl.innerHTML = html;

  // Restore caret after innerHTML replacement
  if (hasFocus && caretOffset !== null) setCaretOffset(descEl, caretOffset);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Encode current state into URI query params
function pushState() {
  const params = new URLSearchParams({
    tier:  state.tierId,
    icon:  String(state.iconIndex),
    title: state.title,
    tag:   state.tag,
    desc:  state.desc,
  });
  history.replaceState(null, '', '?' + params.toString());
}

// Read URI query params and apply them to state
function readURIParams() {
  const p = new URLSearchParams(location.search);

  // tier
  const tierParam = p.get('tier');
  if (tierParam && state.config.tiers.some(t => t.id === tierParam)) {
    state.tierId = tierParam;
  } else {
    state.tierId = state.config.tiers[0].id;
  }

  // icon
  const tier = state.config.tiers.find(t => t.id === state.tierId);
  const iconParam = parseInt(p.get('icon'), 10);
  if (!isNaN(iconParam) && iconParam >= 0 && iconParam < tier.icons.length) {
    state.iconIndex = iconParam;
  } else {
    state.iconIndex = 0;
  }

  // title
  const titleParam = p.get('title');
  if (titleParam !== null) state.title = titleParam;

  // tag
  const tagParam = p.get('tag');
  if (tagParam !== null) state.tag = tagParam;

  // desc
  const descParam = p.get('desc');
  if (descParam !== null) state.desc = descParam;
}

// Rasterise the card and download or copy to clipboard
async function exportPNG(action) {
  setImageExportBusy(true);
  try {
    const canvas = await html2canvas(document.getElementById('augment-card'), {
      useCORS: true,
      scale: 2,
      backgroundColor: null,
    });
    if (action === 'download') {
      const slug = state.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'augment';
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `mayhem_maker_${slug}.png`;
      a.click();
    } else {
      await new Promise((resolve, reject) => {
        canvas.toBlob(async blob => {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            resolve();
          } catch (err) {
            showClipboardError('Could not copy image: ' + err.message);
            reject(err);
          }
        }, 'image/png');
      });
    }
  } catch (err) {
    if (action !== 'copy-image') console.error('Export failed:', err);
  } finally {
    setImageExportBusy(false);
  }
}

// Write current URL to clipboard
async function copyURL() {
  try {
    await navigator.clipboard.writeText(location.href);
    const btn = document.getElementById('btn-copy-url');
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  } catch (err) {
    showClipboardError('Could not copy URL: ' + err.message);
  }
}

// Toggle disabled/busy state on image export buttons
function setImageExportBusy(busy) {
  const btnCopy = document.getElementById('btn-copy-image');
  const btnDown = document.getElementById('btn-download');
  btnCopy.disabled = busy;
  btnDown.disabled = busy;
  btnCopy.classList.toggle('btn--busy', busy);
  btnDown.classList.toggle('btn--busy', busy);
}

// Display an inline clipboard error message
function showClipboardError(msg) {
  const el = document.getElementById('clipboard-error');
  el.textContent = msg || 'Clipboard operation failed.';
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 4000);
}

// Build the keyword text-wall background
function renderKeywordWall() {
  const wall = document.getElementById('keyword-wall');
  if (!wall || !state.config || !state.config.keywords) return;

  const keywords = state.config.keywords;
  const keys = Object.keys(keywords);

  // Repeat the list enough times to fill the screen
  const repeats = Math.ceil((window.innerWidth * window.innerHeight) / (120 * 24));
  const pool = [];
  while (pool.length < repeats) {
    // Shuffle a copy each pass for visual variety
    const shuffled = [...keys].sort(() => Math.random() - 0.5);
    pool.push(...shuffled);
  }

  const fragment = document.createDocumentFragment();
  pool.forEach(key => {
    const span = document.createElement('span');
    span.className = 'kw-wall-word';
    span.textContent = key;
    span.style.color = keywords[key].color || '#c8aa6e';
    // Slight randomised opacity variation for depth
    span.style.opacity = (0.18 + Math.random() * 0.14).toFixed(2);
    fragment.appendChild(span);
  });

  wall.appendChild(fragment);
}

// Helper — select all content inside a contenteditable element
function selectAllContent(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// Helper — wire up select-all-on-focus and Ctrl+A for a contenteditable element
function bindEditableSelectAll(el) {
  // Select all on first tap/click (focus)
  el.addEventListener('focus', () => {
    // Use setTimeout so the browser has placed the caret before we override
    setTimeout(() => selectAllContent(el), 0);
  });

  // Ctrl+A / Cmd+A — select all within this field only
  el.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      selectAllContent(el);
    }
  });
}

// Attach all DOM event listeners
function bindEvents() {
  // ------------------------------------------------------------------
  // Helper: attach undo (Ctrl/Cmd+Z) to a plain contenteditable field
  // (title, tag — no keyword highlighting, just innerText)
  // ------------------------------------------------------------------
  function bindUndoPlain(el, getStateVal, setStateVal) {
    const history = new UndoHistory();

    el.addEventListener('focus', () => {
      history.pushNow(el.innerText, getCaretOffset(el));
    });

    el.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        history.flush(el.innerText, getCaretOffset(el));
        const snap = history.undo();
        if (!snap) return;
        history._isMutating = true;
        el.innerText = snap.text;
        setCaretOffset(el, snap.caret);
        history._isMutating = false;
        setStateVal(snap.text);
        pushState();
        return;
      }
      // Ctrl+A / Cmd+A handled by bindEditableSelectAll
    });

    el.addEventListener('input', () => {
      if (history._isMutating) return;
      history.push(el.innerText, getCaretOffset(el));
      setStateVal(el.innerText);
      pushState();
    });

    el.addEventListener('blur', () => {
      history.flush(el.innerText, getCaretOffset(el));
      setStateVal(el.innerText);
      pushState();
    });
  }

  // ------------------------------------------------------------------
  // Helper: attach undo to the description field (has keyword highlighting)
  // ------------------------------------------------------------------
  function bindUndoDesc(el) {
    const history = new UndoHistory();

    el.addEventListener('focus', () => {
      history.pushNow(el.innerText, getCaretOffset(el));
    });

    el.addEventListener('keydown', e => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        history.flush(el.innerText, getCaretOffset(el));
        const snap = history.undo();
        if (!snap) return;
        history._isMutating = true;
        state.desc = snap.text;
        highlightKeywords(el, snap.text, state.config.keywords);
        setCaretOffset(el, snap.caret);
        history._isMutating = false;
        pushState();
        return;
      }

      // Enter — insert <br> newline
      if (e.key === 'Enter') {
        e.preventDefault();
        // Flush current state before the change so Enter is its own undo point
        history.flush(el.innerText, getCaretOffset(el));
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        state.desc = el.innerText;
        highlightKeywords(el, state.desc, state.config.keywords);
        pushState();
        // Record the post-Enter state as a new undo point
        history.pushNow(el.innerText, getCaretOffset(el));
      }
    });

    el.addEventListener('input', () => {
      if (history._isMutating) return;
      state.desc = el.innerText;
      highlightKeywords(el, state.desc, state.config.keywords);
      history.push(el.innerText, getCaretOffset(el));
      pushState();
    });

    el.addEventListener('blur', () => {
      history.flush(el.innerText, getCaretOffset(el));
      state.desc = el.innerText;
      highlightKeywords(el, state.desc, state.config.keywords);
      pushState();
    });
  }

  // Title editing
  const titleEl = document.getElementById('card-title');
  bindEditableSelectAll(titleEl);
  bindUndoPlain(titleEl, () => state.title, v => { state.title = v; });

  // Tag editing
  const tagEl = document.getElementById('card-tag');
  bindEditableSelectAll(tagEl);
  bindUndoPlain(tagEl, () => state.tag, v => { state.tag = v; });

  // Description editing
  const descEl = document.getElementById('card-desc');
  bindEditableSelectAll(descEl);
  bindUndoDesc(descEl);

  // Export buttons
  document.getElementById('btn-copy-image').addEventListener('click', () => exportPNG('copy-image'));
  document.getElementById('btn-download').addEventListener('click', () => exportPNG('download'));
  document.getElementById('btn-copy-url').addEventListener('click', copyURL);

  // Custom icon upload
  document.getElementById('custom-icon-btn').addEventListener('click', () => {
    document.getElementById('custom-icon-input').click();
  });

  document.getElementById('custom-icon-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    state.customIconUrl = url;
    // Set background-image on wrap div directly
    document.querySelector('.card-icon-wrap').style.backgroundImage = `url('${url}')`;
    // Highlight the upload button
    document.getElementById('custom-icon-btn').classList.add('has-custom');
    // Deselect all grid icons
    document.querySelectorAll('.icon-btn--active').forEach(b => {
      b.classList.remove('icon-btn--active');
      b.setAttribute('aria-pressed', 'false');
    });
    state.iconIndex = -1;
    pushState();
  });

  // Tier row click (delegated)
  document.getElementById('tier-row').addEventListener('click', e => {
    const btn = e.target.closest('.tier-btn');
    if (!btn) return;
    const tierId = btn.dataset.tierId;
    if (!tierId || tierId === state.tierId) return;
    state.tierId = tierId;
    state.iconIndex = 0;
    renderTierRow();
    renderIconGrid();
    renderCard();
    pushState();
  });

  // Icon grid click (delegated)
  document.getElementById('icon-grid').addEventListener('click', e => {
    const btn = e.target.closest('.icon-btn');
    if (!btn) return;
    const index = parseInt(btn.dataset.iconIndex, 10);
    if (isNaN(index)) return;
    // Clear custom icon when picking from grid
    state.customIconUrl = null;
    state.iconIndex = index;
    document.getElementById('custom-icon-btn').classList.remove('has-custom');
    document.getElementById('custom-icon-input').value = '';
    renderIconGrid();
    renderCard();
    pushState();
    document.getElementById('preview-section').scrollIntoView({ behavior: 'smooth' });
  });
}
