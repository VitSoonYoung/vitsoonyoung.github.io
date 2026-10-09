(() => {
  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.site-menu-toggle');
  const navigation = document.querySelector('.site-nav');
  const mobile = matchMedia('(max-width: 1100px)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const setMenu = open => {
    header.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', window.studioLanguage.t(open ? 'Close navigation' : 'Open navigation'));
    navigation.inert = mobile.matches && !open;
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      setMenu(false);
      menu.focus();
    }
  });
  mobile.addEventListener('change', () => setMenu(false));
  setMenu(false);
  document.addEventListener('studio-language-change', () => setMenu(false));
  const topButton = document.querySelector('.back-to-top');
  const games = document.querySelector('#games');
  const updateTopButton = () => {
    topButton.hidden = games.getBoundingClientRect().top > innerHeight * .35;
  };
  addEventListener('scroll', updateTopButton, { passive: true });
  addEventListener('resize', updateTopButton, { passive: true });
  topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
  });
  updateTopButton();
  let currentYear = new Date().getFullYear();
  const renderCopyright = () => {
    const copyright = document.querySelector('.site-footer p');
    window.renderDesignHeading(copyright, `${window.studioLanguage.t('Copyright')} ${currentYear} Abubu Dance`);
  };
  document.addEventListener('studio-language-change', renderCopyright);
  setInterval(() => {
    const year = new Date().getFullYear();
    if (year === currentYear) return;
    currentYear = year;
    renderCopyright();
  }, 3600000);
})();
