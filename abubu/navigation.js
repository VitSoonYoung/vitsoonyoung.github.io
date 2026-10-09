(() => {
  const header = document.getElementById('site-header');
  const toggle = header.querySelector('.site-menu-toggle');
  const navigation = document.getElementById('site-nav');
  const compact = matchMedia('(max-width: 900px)');
  const links = [...navigation.querySelectorAll('a')];
  const partners = document.getElementById('partners');
  const games = document.getElementById('games');
  const about = document.getElementById('about');
  let frame = 0;

  const updateActiveSection = currentScroll => {
    const position = currentScroll + Math.min(innerHeight * .45, 480);
    const aboutTop = about.getBoundingClientRect().top + currentScroll;
    const gamesTop = games.getBoundingClientRect().top + currentScroll;
    const partnersTop = partners.getBoundingClientRect().top + currentScroll;
    const active = position >= aboutTop ? '#about' : position >= gamesTop ? '#games' : position >= partnersTop ? '#partners' : '#top';
    links.forEach(link => {
      if (link.getAttribute('href') === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const showHeader = () => {
    header.classList.remove('is-hidden');
    header.inert = false;
  };

  const closeMenu = () => {
    navigation.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  };

  toggle.addEventListener('click', () => {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    showHeader();
  });

  links.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('pointerdown', event => {
    if (!header.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  compact.addEventListener('change', closeMenu);

  const updateHeader = () => {
    frame = 0;
    const currentScroll = Math.max(0, window.scrollY);
    showHeader();
    updateActiveSection(currentScroll);
  };

  window.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(updateHeader);
  }, { passive: true });
  window.addEventListener('resize', () => updateActiveSection(Math.max(0, window.scrollY)), { passive: true });
  updateActiveSection(Math.max(0, window.scrollY));

  const sections = document.querySelectorAll('.reveal-on-scroll');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    sections.forEach(section => section.classList.add('is-visible'));
  } else {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -30px 0px' });
    sections.forEach(section => observer.observe(section));
  }
})();
