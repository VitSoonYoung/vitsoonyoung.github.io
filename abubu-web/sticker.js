(() => {
  const card = document.getElementById('about-sticker');
  const canvas = card.querySelector('canvas');
  const context = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const front = new Image();
  const hintPeel = .05;
  let width = 0;
  let height = 0;
  let peel = 0;
  let corner = 'top-right';
  let open = false;
  let interacted = false;
  let dragStart = null;
  let animation = 0;
  let glowX = .5;
  let glowY = .5;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const depthLimit = () => Math.min(width * .82, height * .83);
  const mapPoint = (x, y) => [corner.endsWith('right') ? x : width - x, corner.startsWith('top') ? y : height - y];

  const tracePolygon = points => {
    context.beginPath();
    points.forEach(([x, y], index) => {
      if (index) context.lineTo(x, y);
      else context.moveTo(x, y);
    });
    context.closePath();
  };

  const transformToCorner = () => {
    if (corner === 'top-left') {
      context.translate(width, 0);
      context.scale(-1, 1);
    } else if (corner === 'bottom-right') {
      context.translate(0, height);
      context.scale(1, -1);
    } else if (corner === 'bottom-left') {
      context.translate(width, height);
      context.scale(-1, -1);
    }
  };

  const coverImage = () => {
    const targetWidth = width - 18;
    const targetHeight = height - 31;
    const scale = Math.max(targetWidth / front.naturalWidth, targetHeight / front.naturalHeight);
    const cropWidth = targetWidth / scale;
    const cropHeight = targetHeight / scale;
    context.drawImage(front, (front.naturalWidth - cropWidth) / 2, (front.naturalHeight - cropHeight) / 2, cropWidth, cropHeight, 9, 9, targetWidth, targetHeight);
  };

  const render = () => {
    if (!width || !height || !front.naturalWidth) return;
    const depth = peel * depthLimit();
    const start = { x: width - depth, y: 0 };
    const end = { x: width, y: depth };
    const tip = { x: width - depth * .94, y: depth * .92 };
    const middle = { x: width - depth / 2, y: depth / 2 };
    context.clearRect(0, 0, width, height);

    context.save();
    tracePolygon([[0, 0], [start.x, 0], [end.x, end.y], [width, height], [0, height]].map(point => mapPoint(...point)));
    context.clip();
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    coverImage();
    const light = context.createRadialGradient(glowX * width, glowY * height, 4, glowX * width, glowY * height, width * .65);
    light.addColorStop(0, 'rgba(255, 255, 255, .56)');
    light.addColorStop(.25, 'rgba(117, 235, 255, .21)');
    light.addColorStop(.55, 'rgba(246, 143, 255, .12)');
    light.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.globalAlpha = card.classList.contains('is-hovered') ? .85 : .12;
    context.fillStyle = light;
    context.fillRect(0, 0, width, height);
    context.restore();

    if (depth < 1) return;
    context.save();
    transformToCorner();
    tracePolygon([[start.x, 0], [width, 0], [width, end.y]]);
    context.clip();
    const shadow = context.createLinearGradient(middle.x, middle.y, middle.x + 68, middle.y - 68);
    shadow.addColorStop(0, 'rgba(8, 10, 46, .48)');
    shadow.addColorStop(.34, 'rgba(8, 10, 46, .22)');
    shadow.addColorStop(1, 'rgba(8, 10, 46, 0)');
    context.fillStyle = shadow;
    context.fillRect(0, 0, width, height);
    context.restore();

    const flap = () => {
      context.beginPath();
      context.moveTo(start.x, 0);
      context.quadraticCurveTo(start.x - depth * .03, depth * .57, tip.x, tip.y);
      context.quadraticCurveTo(width - depth * .25, depth * 1.02, end.x, end.y);
      context.closePath();
    };

    context.save();
    transformToCorner();
    flap();
    context.shadowColor = 'rgba(5, 6, 36, .54)';
    context.shadowBlur = 12 + peel * 23;
    context.shadowOffsetX = 5 + peel * 8;
    context.shadowOffsetY = 6 + peel * 10;
    const paper = context.createLinearGradient(start.x, 0, tip.x, tip.y);
    paper.addColorStop(0, '#fffefb');
    paper.addColorStop(.24, '#e9edf2');
    paper.addColorStop(.57, '#f9f8f2');
    paper.addColorStop(.83, '#d1d9e6');
    paper.addColorStop(1, '#fafbff');
    context.fillStyle = paper;
    context.fill();
    context.restore();

    context.save();
    transformToCorner();
    flap();
    context.clip();
    context.translate(start.x, 0);
    context.rotate(.35);
    context.fillStyle = 'rgba(66, 77, 105, .12)';
    context.font = '600 12px system-ui';
    for (let row = 0; row < 16; row += 1) {
      for (let column = -3; column < 8; column += 1) context.fillText('Abubu Dance', column * 125, row * 43);
    }
    context.restore();

    context.save();
    transformToCorner();
    context.beginPath();
    context.moveTo(start.x, 0);
    context.lineTo(end.x, end.y);
    context.strokeStyle = 'rgba(20, 24, 58, .32)';
    context.lineWidth = 5;
    context.stroke();
    context.strokeStyle = 'rgba(255, 255, 255, .9)';
    context.lineWidth = 1.5;
    context.stroke();
    context.beginPath();
    context.moveTo(start.x, 0);
    context.quadraticCurveTo(start.x - depth * .03, depth * .57, tip.x, tip.y);
    context.quadraticCurveTo(width - depth * .25, depth * 1.02, end.x, end.y);
    context.strokeStyle = 'rgba(255, 255, 255, .85)';
    context.lineWidth = 2;
    context.stroke();
    context.restore();
  };

  const setPeel = value => {
    peel = clamp(value, 0, 1);
    render();
  };

  const animateTo = (value, duration) => {
    cancelAnimationFrame(animation);
    if (reduceMotion.matches) {
      setPeel(value);
      return;
    }
    const initial = peel;
    const startTime = performance.now();
    const animate = time => {
      const progress = clamp((time - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setPeel(initial + (value - initial) * eased);
      if (progress < 1) animation = requestAnimationFrame(animate);
      else animation = 0;
    };
    animation = requestAnimationFrame(animate);
  };

  const setOpen = value => {
    open = value;
    card.setAttribute('aria-pressed', String(open));
    card.setAttribute('aria-label', open ? 'Place the studio sticker back' : 'Peel any corner of the studio sticker to reveal the Abubu Dance picture');
    animateTo(open ? 1 : hintPeel, 480);
  };

  const findCorner = (x, y) => {
    const horizontal = x < width * .32 ? 'left' : x > width * .68 ? 'right' : null;
    const vertical = y < height * .32 ? 'top' : y > height * .68 ? 'bottom' : null;
    return horizontal && vertical ? `${vertical}-${horizontal}` : null;
  };

  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    render();
  };

  card.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const bounds = card.getBoundingClientRect();
    const localX = (event.clientX - bounds.left) * width / bounds.width;
    const localY = (event.clientY - bounds.top) * height / bounds.height;
    const depth = peel * depthLimit();
    const [tipX, tipY] = mapPoint(width - depth * .94, depth * .92);
    const nearTip = open && Math.hypot(localX - tipX, localY - tipY) < Math.max(64, depthLimit() * .27);
    const nextCorner = nearTip ? corner : findCorner(localX, localY) || (open ? corner : null);
    if (!nextCorner) return;
    event.preventDefault();
    interacted = true;
    cancelAnimationFrame(animation);
    animation = 0;
    if (corner !== nextCorner) {
      corner = nextCorner;
      open = false;
      card.setAttribute('aria-pressed', 'false');
      setPeel(0);
    }
    dragStart = { x: event.clientX, y: event.clientY, depth: peel * depthLimit(), movement: 0 };
    card.classList.add('is-dragging');
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener('pointermove', event => {
    if (dragStart) {
      const inwardX = (event.clientX - dragStart.x) * (corner.endsWith('right') ? -1 : 1);
      const inwardY = (event.clientY - dragStart.y) * (corner.startsWith('top') ? 1 : -1);
      dragStart.movement = Math.max(dragStart.movement, Math.abs(inwardX) + Math.abs(inwardY));
      const depthChange = (inwardX * .94 + inwardY * .92) / (.94 * .94 + .92 * .92);
      setPeel((dragStart.depth + depthChange) / depthLimit());
      return;
    }
    if (event.pointerType !== 'mouse' || reduceMotion.matches) return;
    const bounds = card.getBoundingClientRect();
    glowX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    glowY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    card.classList.add('is-hovered');
    card.style.setProperty('--tilt-x', `${((.5 - glowY) * 12).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${((glowX - .5) * 12).toFixed(2)}deg`);
    render();
  });

  const endDrag = () => {
    if (!dragStart) return;
    const moved = dragStart.movement > 6;
    dragStart = null;
    card.classList.remove('is-dragging');
    setOpen(moved ? peel > .32 : !open);
  };

  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);
  card.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('pointerup', endDrag);

  card.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    interacted = true;
    corner = 'top-right';
    setOpen(!open);
  });

  card.addEventListener('pointerleave', () => {
    card.classList.remove('is-hovered');
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
    render();
  });

  front.addEventListener('load', () => {
    card.classList.add('is-ready');
    render();
  });
  front.src = 'assets/about-sticker.jpg';
  new ResizeObserver(resize).observe(canvas);

  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    if (!interacted) animateTo(hintPeel, 1500);
  }, { threshold: .35 });
  observer.observe(card);
})();
