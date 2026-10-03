// Applied before the stylesheet loads to avoid flashing a light theme on reload.
(() => {
  const key = 'voice-studio-theme';
  const choices = ['trans-fem-light','trans-fem-dark','nonbinary-light','nonbinary-dark','trans-masc-light','trans-masc-dark','blue-gold-light','blue-gold-dark','teal-rose-light','teal-rose-dark','monochrome-light','monochrome-dark'];
  let selected = 'trans-fem-light';
  try { const saved = localStorage.getItem(key); if (choices.includes(saved)) selected = saved; } catch {}
  function apply(value) {
    selected = choices.includes(value) ? value : 'trans-fem-light';
    document.documentElement.dataset.theme = selected;
    const dark = selected.endsWith('dark');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#171923' : '#faf7fb';
    const selector = document.getElementById('theme-select');
    if (selector) selector.value = selected;
    window.dispatchEvent(new Event('voice-theme-change'));
  }
  apply(selected);
  document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('theme-select');
    selector.value = selected;
    selector.addEventListener('change', () => {
      apply(selector.value);
      try { localStorage.setItem(key, selected); }
      catch { const notice = document.getElementById('notice'); notice.textContent = 'Appearance updated for this visit. Browser storage is unavailable, so this choice cannot be saved.'; notice.hidden = false; notice.classList.add('error'); }
    });
  });
  window.addEventListener('voice-theme-apply', event => { apply(event.detail);try { localStorage.setItem(key,selected); } catch {} });
  window.addEventListener('voice-theme-reset', () => { try { localStorage.removeItem(key); } catch {} apply('trans-fem-light'); });
})();
