(() => {
  const SNOW_SETTINGS = {
    minSize: 2,
    maxSize: 20,
    direction: { x: -0.2, y: 1 },
    mobileSizeScale: .8
  };
  const shell = document.querySelector('.scene-shell');
  const snow = shell.querySelector('.hero-snow');
  const mobile = matchMedia('(max-width: 600px)');
  let visible = true;
  const updateDirection = () => {
    const width = shell.clientWidth;
    const height = shell.clientHeight;
    snow.style.setProperty('--fall-x', `${SNOW_SETTINGS.direction.x * (width + 30)}px`);
    snow.style.setProperty('--fall-y', `${SNOW_SETTINGS.direction.y * (height + 30)}px`);
    snow.style.setProperty('--snow-start-y', `${SNOW_SETTINGS.direction.y < 0 ? height + 15 : -15}px`);
    snow.style.setProperty('--mobile-snow-scale', String(SNOW_SETTINGS.mobileSizeScale));
    snow.querySelectorAll('.snowflake').forEach(flake => {
      if (SNOW_SETTINGS.direction.y === 0 && SNOW_SETTINGS.direction.x !== 0) {
        flake.style.left = SNOW_SETTINGS.direction.x < 0 ? `${width + 15}px` : '-15px';
        flake.style.top = `${Number(flake.dataset.startY) * height}px`;
      }
    });
  };
  const populate = () => {
    const flakes = document.createDocumentFragment();
    for (let index = 0; index < (mobile.matches ? 28 : 50); index++) {
      const flake = document.createElement('div');
      flake.className = 'snowflake';
      const duration = 8 + Math.random() * 12;
      const minSize = Math.max(0, Math.min(SNOW_SETTINGS.minSize, SNOW_SETTINGS.maxSize));
      const maxSize = Math.max(minSize, SNOW_SETTINGS.maxSize);
      flake.style.setProperty('--size', `${minSize + Math.random() * (maxSize - minSize)}px`);
      flake.dataset.startY = String(Math.random());
      flake.style.setProperty('--left', `${Math.random() * 100}%`);
      flake.style.setProperty('--speed', `${duration}s`);
      flake.style.setProperty('--delay', `${-Math.random() * duration}s`);
      flake.style.opacity = String(.35 + Math.random() * .45);
      flakes.append(flake);
    }
    snow.replaceChildren(flakes);
    updateDirection();
  };
  const updateFade = () => {
    const bottom = shell.getBoundingClientRect().bottom;
    snow.style.opacity = String(Math.max(0, Math.min(1, bottom / (innerHeight * .45))));
  };
  const updatePlayback = () => {
    snow.classList.toggle('is-paused', !visible || document.hidden);
  };
  new ResizeObserver(() => {
    updateDirection();
    updateFade();
  }).observe(shell);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    updatePlayback();
  }).observe(shell);
  addEventListener('scroll', updateFade, { passive: true });
  addEventListener('resize', updateFade, { passive: true });
  document.addEventListener('visibilitychange', updatePlayback);
  mobile.addEventListener('change', populate);
  populate();
  updateFade();
})();
