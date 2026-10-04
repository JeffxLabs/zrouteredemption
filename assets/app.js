/* Shared helpers for the Z Route tools: theme toggle (same "theme" key as the other pages), toast, formatting. */
(() => {
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* storage unavailable */ } }
  };
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function applyTheme(day) {
    document.documentElement.classList.toggle('day', day);
    document.body.classList.toggle('day', day);
    const btn = document.getElementById('theme-toggle');
    if (btn) { btn.innerHTML = day ? MOON : SUN; btn.setAttribute('aria-label', day ? 'Switch to dark theme' : 'Switch to light theme'); }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = day ? '#f5f5f6' : '#000000';
    store.set('theme', day ? 'day' : 'night');
  }
  const saved = store.get('theme');
  applyTheme(saved === 'day' || (!saved && matchMedia('(prefers-color-scheme: light)').matches));
  document.getElementById('theme-toggle')?.addEventListener('click', () => applyTheme(!document.documentElement.classList.contains('day')));
  let toastTimer = 0;
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
  }
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = v => Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
  function short(n) {
    const a = Math.abs(n);
    if (a >= 1e9) return `${+(n / 1e9).toFixed(2)}B`;
    if (a >= 1e6) return `${+(n / 1e6).toFixed(2)}M`;
    if (a >= 1e4) return `${+(n / 1e3).toFixed(1)}K`;
    return fmt(n);
  }
  function duration(sec) {
    sec = Math.round(sec);
    if (sec <= 0) return '0s';
    const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (d) return `${d}d ${h}h`;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  }
  function copy(text, label = 'Copied') {
    const done = () => toast(label);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => prompt('Copy this', text));
    else prompt('Copy this', text);
  }
  window.ZR = { store, toast, esc, fmt, short, duration, copy };
})();
