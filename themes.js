// Applied before the stylesheet loads to avoid flashing a light theme on reload.
(() => {
  const key = 'voice-studio-theme';
  const choices = ['trans-fem-light','trans-fem-dark','nonbinary-light','nonbinary-dark','blue-gold-light','blue-gold-dark','teal-rose-light','teal-rose-dark','monochrome-light','monochrome-dark','ocean-light','ocean-dark','forest-light','forest-dark','sunset-light','sunset-dark','bisexual-light','bisexual-dark','lesbian-light','lesbian-dark','pansexual-light','pansexual-dark','asexual-light','asexual-dark','rainbow-light','rainbow-dark','high-contrast-light','high-contrast-dark'];
  window.TrueYouThemes = Object.freeze(choices);
  let selected = 'trans-fem-dark';
  try { const saved = localStorage.getItem(key); if (choices.includes(saved)) selected = saved; else if (saved === 'trans-masc-light') selected = 'trans-fem-light'; } catch {}
  function apply(value) {
    selected = choices.includes(value) ? value : 'trans-fem-dark';
    document.documentElement.dataset.theme = selected;
    const dark = selected.endsWith('dark');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#171923' : '#faf7fb';
    const selector = document.getElementById('theme-select');
    if (selector) selector.value = selected;
    window.dispatchEvent(new Event('voice-theme-change'));
  }
  apply(selected);
  window.addEventListener('voice-theme-apply', event => { apply(event.detail);try { localStorage.setItem(key,selected); } catch {} });
  window.addEventListener('voice-theme-reset', () => { try { localStorage.removeItem(key); } catch {} apply('trans-fem-dark'); });
})();
