(() => {
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-open-tab]').forEach(link => {
    link.addEventListener('click', () => selectTab(link.dataset.openTab));
  });

  const copyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 4h9a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H8ZM4 8v9a4 4 0 0 0 4 4h9v2H8a6 6 0 0 1-6-6V8h2Z"/></svg>';
  document.querySelectorAll('button[data-copy]').forEach(button => {
    if (!button.querySelector('img')) button.insertAdjacentHTML('afterbegin', copyIcon);
  });

  const dialog = document.querySelector('#plugin-dialog');
  let lastTrigger = null;
  let closeTimer = 0;
  function closeDialog() {
    if (!dialog?.open) return;
    dialog.classList.remove('is-open');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      dialog.close();
      lastTrigger?.focus();
    }, prefersReducedMotion ? 0 : 360);
  }
  dialog?.querySelector('.dialog-close')?.addEventListener('click', closeDialog);
  dialog?.querySelector('.dialog-done')?.addEventListener('click', closeDialog);
  dialog?.querySelector('.dialog-copy')?.addEventListener('click', event => copyValue(event.currentTarget.dataset.copy));
  dialog?.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  dialog?.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  dialog?.addEventListener('close', () => { document.body.classList.remove('dialog-active'); });

  function openDialog(details, summary, body) {
    const card = details.closest('.resource');
    if (!card || !dialog?.showModal) return false;
    clearTimeout(closeTimer);
    lastTrigger = summary;
    const logo = card.querySelector('.plugin-logo');
    const action = card.querySelector('[data-copy]');
    const fallbackCode = '!megawio';
    const copyButton = dialog.querySelector('.dialog-copy');
    const manifest = dialog.querySelector('.dialog-manifest');
    dialog.style.setProperty('--logo-accent', getComputedStyle(card).getPropertyValue('--logo-accent'));
    dialog.querySelector('.dialog-logo').src = logo?.src || '';
    dialog.querySelector('.dialog-logo').alt = logo?.alt || '';
    dialog.querySelector('.dialog-kicker').textContent = card.closest('#panel-nuvio') ? 'Nuvio / Stremio' : 'CloudStream 3';
    dialog.querySelector('#dialog-title').textContent = card.querySelector('h3')?.textContent || 'Eklenti';
    dialog.querySelector('.dialog-summary').textContent = card.querySelector(':scope > p')?.textContent || '';
    dialog.querySelector('.dialog-content').replaceChildren(body.cloneNode(true));
    const address = card.querySelector('.manifest-url')?.textContent?.trim();
    manifest.hidden = !address;
    manifest.textContent = address || '';
    copyButton.dataset.copy = action?.dataset.copy || fallbackCode;
    copyButton.textContent = action ? action.textContent.trim() : '!megawio kopyala';
    copyButton.insertAdjacentHTML('afterbegin', copyIcon);
    dialog.showModal();
    document.body.classList.add('dialog-active');
    requestAnimationFrame(() => dialog.classList.add('is-open'));
    return true;
  }

  document.querySelectorAll('.plugin-details').forEach(details => {
    const summary = details.querySelector('summary');
    const body = details.querySelector('.details-body');
    if (!summary || !body) return;
    let motion;

    summary.addEventListener('click', event => {
      if (openDialog(details, summary, body)) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      motion?.cancel();
      const opening = !details.open;
      if (prefersReducedMotion || !body.animate) {
        details.open = opening;
        return;
      }
      if (opening) details.open = true;
      const height = body.scrollHeight;
      body.style.overflow = 'hidden';
      motion = body.animate([
        { height: opening ? '0px' : `${height}px`, opacity: opening ? 0 : 1, transform: opening ? 'translateY(-7px)' : 'translateY(0)' },
        { height: opening ? `${height}px` : '0px', opacity: opening ? 1 : 0, transform: opening ? 'translateY(0)' : 'translateY(-7px)' }
      ], { duration: opening ? 380 : 260, easing: 'cubic-bezier(.22,1,.36,1)' });
      motion.onfinish = () => {
        if (!opening) details.open = false;
        body.style.overflow = '';
        motion = null;
      };
    });
  });

  // The logo supplies each card's artwork and, where CORS permits, its accent colour.
  document.querySelectorAll('.plugin-art').forEach(art => {
    const logo = art.querySelector('.plugin-logo');
    if (!logo) return;
    art.style.setProperty('--logo-image', `url("${logo.src}")`);
    const sample = new Image();
    sample.crossOrigin = 'anonymous';
    sample.onload = () => {
      try {
        const probe = document.createElement('canvas');
        probe.width = probe.height = 24;
        const probeCtx = probe.getContext('2d', { willReadFrequently: true });
        probeCtx.drawImage(sample, 0, 0, 24, 24);
        const pixels = probeCtx.getImageData(0, 0, 24, 24).data;
        let r = 0, g = 0, b = 0, weight = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const [red, green, blue, alpha] = pixels.slice(i, i + 4);
          const vivid = Math.max(red, green, blue) - Math.min(red, green, blue);
          const light = (red + green + blue) / 3;
          if (alpha < 100 || vivid < 24 || light > 238 || light < 25) continue;
          const w = vivid * alpha / 255;
          r += red * w; g += green * w; b += blue * w; weight += w;
        }
        if (weight) art.closest('.resource').style.setProperty('--logo-accent', `${Math.round(r / weight)} ${Math.round(g / weight)} ${Math.round(b / weight)}`);
      } catch (_) { /* The designed fallback palette remains in place. */ }
    };
    sample.src = logo.src;
  });

  // Only transforms change while the pointer moves; there is no full-screen redraw loop.
  const sea = document.querySelector('.sea-scene');
  const waveFrame = sea?.querySelector('.sea-wave-frame');
  const light = sea?.querySelector('.sea-light');
  const rippleLayer = sea?.querySelector('.sea-ripples');
  if (!sea || !waveFrame || !light || !rippleLayer) return;
  let cursorX = innerWidth / 2;
  let cursorY = innerHeight / 2;
  let pointerFrame = 0;

  function moveSea() {
    pointerFrame = 0;
    const x = (cursorX / Math.max(innerWidth, 1) - .5) * 2;
    const y = (cursorY / Math.max(innerHeight, 1) - .5) * 2;
    waveFrame.style.transform = `translate3d(${(x * 19).toFixed(1)}px,${(y * 13).toFixed(1)}px,0)`;
    light.style.transform = `translate3d(${Math.round(cursorX - 230)}px,${Math.round(cursorY - 230)}px,0)`;
  }
  function scheduleMove() {
    if (!pointerFrame) pointerFrame = requestAnimationFrame(moveSea);
  }
  if (!prefersReducedMotion) {
    document.addEventListener('pointermove', event => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      scheduleMove();
    }, { passive: true });
    document.addEventListener('pointerleave', () => {
      cursorX = innerWidth / 2;
      cursorY = innerHeight / 2;
      scheduleMove();
    });
    document.addEventListener('pointerdown', event => {
      const ring = document.createElement('span');
      ring.className = 'sea-ripple';
      ring.style.left = `${event.clientX}px`;
      ring.style.top = `${event.clientY}px`;
      rippleLayer.append(ring);
      ring.addEventListener('animationend', () => ring.remove(), { once: true });
      if (rippleLayer.childElementCount > 5) rippleLayer.firstElementChild.remove();
    }, { passive: true });
    window.addEventListener('resize', scheduleMove, { passive: true });
    document.addEventListener('visibilitychange', () => sea.classList.toggle('is-paused', document.hidden));
    moveSea();
  }
})();
