(() => {
  const root = new URL('../../', document.currentScript.src);
  const selector = document.getElementById('language-select');
  if (!window.I18N || !selector) return;
  if (!Array.from(selector.options).some(option => option.value === I18N.language)) {
    I18N.setLanguage('en', { persist: false, updateUrl: false });
  }

  // Preserve direct language links between the home card and both guide pages.
  const isGuide = document.querySelector('main.season');
  const guidePath = new URL('season-1/', root).pathname;
  const links = Array.from(document.querySelectorAll('a[href]')).filter(link => {
    if (link.getAttribute('href').startsWith('#')) return false;
    const url = new URL(link.href);
    if (!isGuide && url.pathname !== guidePath) return false;
    return url.origin === root.origin && url.pathname.startsWith(root.pathname) &&
      (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
  });
  function localizeLinks() {
    for (const link of links) {
      const url = new URL(link.href);
      url.searchParams.set('lang', I18N.language);
      link.href = url.href;
    }
  }

  function openSection() {
    const hash = location.hash;
    if (!/^#[\w-]+$/.test(hash)) return;
    const target = document.getElementById(hash.slice(1));
    if (!target || target.closest('.skill-class')) return; // Skill links are handled by skills.js.
    for (let node = target.parentElement; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') node.open = true;
    }
    target.scrollIntoView({ block: 'start' });
  }

  document.addEventListener('languagechange', localizeLinks);
  window.addEventListener('hashchange', openSection);
  localizeLinks();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', openSection, { once: true });
  else openSection();
})();
