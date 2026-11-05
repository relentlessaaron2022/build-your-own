// BAMA kit — shared helpers for every app page.
// In the packaged Mac app, window.bama comes from shell/preload.js.
// In a plain browser (npm run preview), a stand-in bridge keeps the UI
// usable so you can design and test without launching Electron.
(function () {
  window.BAMA_MOCKS = window.BAMA_MOCKS || {};
  if (!window.bama) {
    const ls = {
      get(k, f) { try { const v = localStorage.getItem('bama:' + k); return v == null ? f : JSON.parse(v); } catch (_) { return f; } },
      set(k, v) { try { localStorage.setItem('bama:' + k, JSON.stringify(v)); } catch (_) {} return true; },
    };
    const mockHandlers = {
      'bama:manifest': () => ({ id: document.body.dataset.app || 'preview', name: document.title, platform: 'web', preview: true }),
      'store:get': (k, f) => ls.get(k, f),
      'store:set': (k, v) => ls.set(k, v),
      'clipboard:read': () => (navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText().catch(() => '') : ''),
      'clipboard:write': (t) => { try { navigator.clipboard.writeText(String(t)); } catch (_) {} return true; },
      'shell:openExternal': (u) => { window.open(u, '_blank'); return true; },
      'dialog:confirm': (m) => window.confirm(m),
      'notify': (t, b) => { BAMA.toast(`${t}${b ? ' — ' + b : ''}`); return true; },
      'path:home': () => '/Users/you',
    };
    const extra = window.BAMA_MOCKS;
    window.bama = {
      isNative: false,
      invoke: async (channel, ...args) => {
        const fn = extra[channel] || mockHandlers[channel];
        if (fn) return fn(...args);
        console.info('[bama preview] no native handler for', channel, args);
        return null;
      },
      on: () => () => {},
      pathFor: (f) => (f && f.name) || '',
    };
  }

  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };

  let toastBox = null;
  function toast(msg, kind = '') {
    if (!toastBox) { toastBox = h('div', { class: 'toasts' }); document.body.append(toastBox); }
    const t = h('div', { class: 'toast ' + kind }, msg);
    toastBox.append(t);
    setTimeout(() => t.remove(), kind === 'bad' ? 6000 : 2800);
  }

  // A small promise-based dialog. fields: [{name,label,value,type,options,placeholder}]
  function form(title, fields = [], { ok = 'OK', note } = {}) {
    return new Promise((resolve) => {
      const inputs = {};
      const close = (val) => { back.remove(); resolve(val); };
      const body = fields.map((f) => {
        let input;
        if (f.type === 'select') {
          input = h('select', { class: 'select' }, (f.options || []).map((o) => {
            const [v, l] = Array.isArray(o) ? o : [o, o];
            return h('option', { value: v, selected: String(v) === String(f.value) }, l);
          }));
        } else if (f.type === 'textarea') {
          input = h('textarea', { class: 'textarea', rows: f.rows || 5, placeholder: f.placeholder || '' });
          input.value = f.value ?? '';
        } else if (f.type === 'checkbox') {
          input = h('input', { type: 'checkbox', checked: !!f.value });
          inputs[f.name] = input;
          return h('label', { class: 'check' }, input, f.label);
        } else {
          input = h('input', { class: 'input', type: f.type || 'text', placeholder: f.placeholder || '' });
          input.value = f.value ?? '';
        }
        inputs[f.name] = input;
        return h('label', { class: 'field' }, f.label, input);
      });
      const submit = () => {
        const out = {};
        for (const [k, el] of Object.entries(inputs)) out[k] = el.type === 'checkbox' ? el.checked : el.value;
        close(out);
      };
      const modal = h('form', { class: 'modal', onsubmit: (e) => { e.preventDefault(); submit(); } },
        h('h4', {}, title),
        note ? h('div', { class: 'muted' }, note) : null,
        body,
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn', onclick: () => close(null) }, 'Cancel'),
          h('button', { type: 'submit', class: 'btn primary' }, ok)));
      const back = h('div', { class: 'modal-back', onmousedown: (e) => { if (e.target === back) close(null); } }, modal);
      back.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(null); });
      document.body.append(back);
      const first = modal.querySelector('input,textarea,select');
      if (first) setTimeout(() => first.focus(), 0);
    });
  }
  async function ask(title, label, value = '') {
    const r = await form(title, [{ name: 'v', label, value }]);
    return r ? r.v : null;
  }

  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const words = (s) => (String(s).match(/[\p{L}\p{N}'’-]+/gu) || []).length;
  const fmtTime = (sec) => {
    sec = Math.max(0, sec || 0);
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60), f = Math.floor((sec % 1) * 10);
    return `${m}:${String(s).padStart(2, '0')}.${f}`;
  };
  const basename = (p) => String(p).split(/[\\/]/).pop();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const store = {
    get: (k, f = null) => window.bama.invoke('store:get', k, f),
    set: (k, v) => window.bama.invoke('store:set', k, v),
  };

  // URL a page can load (and read pixels from) for a local file.
  const mediaUrl = (p) => (window.bama.isNative ? 'bama-media://file' + encodeURI(p).replace(/#/g, '%23').replace(/\?/g, '%3F') : p);

  window.BAMA = { h, toast, mediaUrl, form, ask, debounce, uid, words, fmtTime, basename, esc, store,
    invoke: (...a) => window.bama.invoke(...a), on: (...a) => window.bama.on(...a),
    get native() { return !!window.bama.isNative; } };
})();
