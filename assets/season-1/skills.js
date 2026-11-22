(() => {
  const form = document.getElementById('skill-filter');
  const query = document.getElementById('skill-query');
  const tree = document.getElementById('skill-scope');
  const level = document.getElementById('skill-level');
  const count = document.getElementById('skill-count');
  const sections = Array.from(document.querySelectorAll('.skill-class'), section => ({
    section,
    tiers: Array.from(section.querySelectorAll('.skill-tier'), tier => ({
      tier,
      level: Number(tier.dataset.level),
      cards: Array.from(tier.querySelectorAll('.skill-card'), card => ({
        card,
        text: card.textContent.toLocaleLowerCase('en'),
      })),
    })),
  }));

  function update() {
    const words = query.value.trim().toLocaleLowerCase('en').split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const { section, tiers } of sections) {
      let treeCount = 0;
      for (const entry of tiers) {
        let tierCount = 0;
        const eligible = (tree.value === 'all' || tree.value === section.id) && entry.level <= Number(level.value);
        for (const { card, text } of entry.cards) {
          const matches = eligible && words.every(word => text.includes(word));
          card.hidden = !matches;
          if (matches) tierCount++;
        }
        entry.tier.hidden = !tierCount;
        treeCount += tierCount;
      }
      section.hidden = !treeCount;
      visible += treeCount;
    }
    count.textContent = visible ? `${visible} ${visible === 1 ? 'skill' : 'skills'} shown` : 'No skills match these filters.';
  }

  function openTarget(hash) {
    if (!/^#[\w-]+$/.test(hash)) return;
    const target = document.getElementById(hash.slice(1));
    const section = target?.closest('.skill-class');
    if (!section) return;
    if (target.closest('[hidden]')) {
      form.reset();
      update();
    }
    if (target.matches('.skill-card')) target.open = true;
    target.scrollIntoView({ block: 'start' });
  }

  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', update);
  form.addEventListener('reset', event => {
    event.preventDefault();
    query.value = '';
    tree.selectedIndex = 0;
    level.selectedIndex = 0;
    update();
  });
  window.addEventListener('hashchange', () => openTarget(location.hash));
  document.querySelector('.skill-index').addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link?.hash === location.hash) openTarget(link.hash);
  });
  form.hidden = false;
  update();
  openTarget(location.hash);
})();
