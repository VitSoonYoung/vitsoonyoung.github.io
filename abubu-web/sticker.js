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
  let fallPending = false;
  let flyingSticker = null;
  let glowX = .5;
  let glowY = .5;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const depthLimit = () => width + height;
  const mapPoint = (x, y) => [corner.endsWith('right') ? x : width - x, corner.startsWith('top') ? y : height - y];

  const clipPolygon = (points, depth, keepFront) => {
    const distance = ([x, y]) => width - x + y;
    const inside = point => keepFront ? distance(point) >= depth : distance(point) <= depth;
    const result = [];
    points.forEach((point, index) => {
      const previous = points[(index + points.length - 1) % points.length];
      const previousInside = inside(previous);
      const pointInside = inside(point);
      if (previousInside !== pointInside) {
        const previousDistance = distance(previous);
        const nextDistance = distance(point);
        const progress = (depth - previousDistance) / (nextDistance - previousDistance);
        result.push([previous[0] + (point[0] - previous[0]) * progress, previous[1] + (point[1] - previous[1]) * progress]);
      }
      if (pointInside) result.push(point);
    });
    return result;
  };

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
    const rectangle = [[0, 0], [width, 0], [width, height], [0, height]];
    const remaining = clipPolygon(rectangle, depth, true);
    context.clearRect(0, 0, width, height);

    if (remaining.length > 2) {
      context.save();
      tracePolygon(remaining.map(point => mapPoint(...point)));
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
    }

    if (depth < 1) return;
    const peeled = clipPolygon(rectangle, depth, false);
    const folded = peeled.map(([x, y]) => {
      const offset = depth - (width - x + y);
      return [x - offset, y + offset];
    });

    context.save();
    transformToCorner();
    context.beginPath();
    context.moveTo(width - depth, 0);
    context.lineTo(width - depth + height, height);
    context.shadowColor = 'rgba(5, 6, 36, .75)';
    context.shadowBlur = 16 + peel * 30;
    context.shadowOffsetX = 7;
    context.shadowOffsetY = 8;
    context.strokeStyle = 'rgba(10, 10, 45, .28)';
    context.lineWidth = 8;
    context.stroke();
    context.restore();

    if (folded.length > 2) {
      context.save();
      transformToCorner();
      tracePolygon(folded);
      context.shadowColor = 'rgba(5, 6, 36, .55)';
      context.shadowBlur = 12 + peel * 22;
      context.shadowOffsetX = 5;
      context.shadowOffsetY = 7;
      const paper = context.createLinearGradient(width - depth, 0, width, Math.min(depth, height));
      paper.addColorStop(0, '#fffefb');
      paper.addColorStop(.38, '#e6eaf1');
      paper.addColorStop(.7, '#faf9f5');
      paper.addColorStop(1, '#cdd6e5');
      context.fillStyle = paper;
      context.fill();
      context.shadowColor = 'transparent';
      context.clip();
      context.transform(0, 1, 1, 0, width - depth, depth - width);
      context.fillStyle = 'rgba(66, 77, 105, .13)';
      context.font = '600 12px system-ui';
      for (let row = -2; row * 43 < height + 86; row += 1) {
        for (let column = -2; column * 125 < width + 250; column += 1) context.fillText('Abubu Dance', column * 125, row * 43);
      }
      context.restore();
    }

    context.save();
    transformToCorner();
    context.beginPath();
    context.moveTo(width - depth, 0);
    context.lineTo(width - depth + height, height);
    context.strokeStyle = 'rgba(20, 24, 58, .32)';
    context.lineWidth = 4;
    context.stroke();
    context.strokeStyle = 'rgba(255, 255, 255, .9)';
    context.lineWidth = 1.5;
    context.stroke();
    context.restore();
  };

  const removeFlyingSticker = () => {
    if (!flyingSticker) return;
    flyingSticker.remove();
    flyingSticker = null;
  };

  const launchFlyaway = () => {
    if (reduceMotion.matches) return;
    removeFlyingSticker();
    const bounds = card.getBoundingClientRect();
    const horizontal = corner.endsWith('right') ? 1 : -1;
    const vertical = corner.startsWith('top') ? 0 : 100;
    const flyer = document.createElement('div');
    flyer.className = 'peel-card__flyaway';
    flyer.setAttribute('aria-hidden', 'true');
    flyer.style.left = `${bounds.left}px`;
    flyer.style.top = `${bounds.top}px`;
    flyer.style.width = `${bounds.width}px`;
    flyer.style.height = `${bounds.height}px`;
    flyer.style.transformOrigin = `${horizontal > 0 ? 100 : 0}% ${vertical}%`;
    document.body.append(flyer);
    flyingSticker = flyer;
    const drop = Math.max(innerHeight - bounds.top + bounds.height, 500);
    const flight = flyer.animate([
      { transform: `perspective(900px) translate3d(0, 0, 0) rotateY(${horizontal * 86}deg) rotateZ(${horizontal * 5}deg) scale(.91)`, opacity: 0, offset: 0 },
      { transform: `perspective(900px) translate3d(${horizontal * 24}px, -20px, 0) rotateY(${horizontal * 62}deg) rotateZ(${horizontal * 14}deg) scale(.86)`, opacity: .92, offset: .18 },
      { transform: `perspective(900px) translate3d(${horizontal * bounds.width * .32}px, -70px, 0) rotateY(${horizontal * 18}deg) rotateZ(${horizontal * 32}deg) scale(.74)`, opacity: 1, offset: .43 },
      { transform: `perspective(900px) translate3d(${horizontal * bounds.width * .68}px, ${drop}px, 0) rotateY(${horizontal * 175}deg) rotateZ(${horizontal * 140}deg) scale(.55)`, opacity: 0, offset: 1 }
    ], { duration: 1350, easing: 'cubic-bezier(.35, .12, .64, 1)', fill: 'forwards' });
    flight.finished.then(() => {
      if (flyingSticker === flyer) removeFlyingSticker();
    }).catch(() => {});
  };

  const setPeel = value => {
    peel = clamp(value, 0, 1);
    render();
    if (fallPending && peel >= .72) {
      fallPending = false;
      launchFlyaway();
    }
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
    fallPending = open;
    if (!open) removeFlyingSticker();
    animateTo(open ? 1 : hintPeel, open ? Math.max(650, (1 - peel) * 1300) : 650);
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
    const nextCorner = open ? corner : findCorner(localX, localY);
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
      const depthChange = (inwardX + inwardY) * .5;
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
