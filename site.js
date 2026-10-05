(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = {cloudstream: document.querySelector('#panel-cloudstream'), nuvio: document.querySelector('#panel-nuvio')};
  const themeButton = document.querySelector('#theme-toggle');
  const paletteButton = document.querySelector('#palette-toggle');
  const paletteMenu = document.querySelector('#palette-menu');
  const paletteChoices = [...document.querySelectorAll('[data-palette-choice]')];
  const header = document.querySelector('.site-header');
  const toast = document.querySelector('#toast');
  let fieldRgb = '225,231,243';
  let activeCard = null;
  const layoutAnimations = new WeakMap();
  let cardScrollFrame = 0;
  let toastTimer;
  const stopCardScroll = () => {
    if (cardScrollFrame) cancelAnimationFrame(cardScrollFrame);
    cardScrollFrame = 0;
  };
  addEventListener('wheel', stopCardScroll, {passive:true});
  addEventListener('touchstart', stopCardScroll, {passive:true});

  try { if (localStorage.getItem('wiostream-theme-v2') === 'light') root.dataset.theme = 'light'; } catch (_) {}
  try {
    const savedPalette = localStorage.getItem('wiostream-palette');
    if (paletteChoices.some(choice => choice.dataset.paletteChoice === savedPalette)) root.dataset.palette = savedPalette;
  } catch (_) {}
  function updateThemeLabel() { themeButton.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'); }
  function updatePalette() {
    paletteChoices.forEach(choice => choice.setAttribute('aria-pressed', String(choice.dataset.paletteChoice === root.dataset.palette)));
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--bg').trim();
    fieldRgb = getComputedStyle(root).getPropertyValue('--field-rgb').trim();
  }
  function closePalette() { paletteMenu.hidden = true; paletteButton.setAttribute('aria-expanded', 'false'); }
  paletteButton.addEventListener('click', () => {
    paletteMenu.hidden = !paletteMenu.hidden;
    paletteButton.setAttribute('aria-expanded', String(!paletteMenu.hidden));
  });
  paletteChoices.forEach(choice => choice.addEventListener('click', () => {
    root.dataset.palette = choice.dataset.paletteChoice;
    updatePalette();
    closePalette();
    try { localStorage.setItem('wiostream-palette', root.dataset.palette); } catch (_) {}
  }));
  document.addEventListener('click', event => { if (!event.target.closest('.theme-controls')) closePalette(); });
  updateThemeLabel();
  updatePalette();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    updateThemeLabel();
    updatePalette();
    try { localStorage.setItem('wiostream-theme-v2', root.dataset.theme); } catch (_) {}
  });

  let scrollFrame = 0;
  function updateHeader() {
    header.classList.toggle('is-scrolled', scrollY > 28);
    scrollFrame = 0;
  }
  addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateHeader); }, {passive:true});
  updateHeader();

  function showTab(id, scroll = false) {
    if (!panels[id]) return;
    if (activeCard && !panels[id].contains(activeCard)) setExpanded(activeCard, false);
    tabs.forEach(tab => { tab.setAttribute('aria-selected', String(tab.id === `tab-${id}`)); tab.tabIndex = tab.id === `tab-${id}` ? 0 : -1; });
    document.querySelectorAll('[data-tab-link]').forEach(link => link.classList.toggle('is-active', link.dataset.tabLink === id));
    Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== id; });
    if (scroll) document.querySelector('#platforms').scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'start'});
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { const id = tab.id.slice(4); showTab(id); history.replaceState(null, '', `#${id}`); });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); next.click();
    });
  });
  document.querySelectorAll('[data-tab-link]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const id = link.dataset.tabLink;
    showTab(id, true);
    history.replaceState(null, '', `#${id}`);
  }));
  window.addEventListener('hashchange', () => { if (panels[location.hash.slice(1)]) showTab(location.hash.slice(1)); });
  showTab(panels[location.hash.slice(1)] ? location.hash.slice(1) : 'cloudstream');

  async function copyValue(value) {
    let copied = false;
    try { await navigator.clipboard.writeText(value); copied = true; }
    catch (_) {
      const field = document.createElement('textarea');
      field.value = value; field.style.cssText = 'position:fixed;opacity:0;left:0;top:0';
      document.body.append(field);
      field.focus(); field.select(); copied = document.execCommand('copy'); field.remove();
    }
    toast.textContent = copied ? 'Kopyalandı' : 'Kopyalanamadı — bağlantıyı seçip kopyala';
    toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2100);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (button) copyValue(button.dataset.copy);
  });

  function addLinkRow(container, label, value, isUrl) {
    const row = document.createElement('div');
    row.className = 'detail-link-row';
    const caption = document.createElement('span');
    caption.className = 'detail-link-label';
    caption.textContent = label;
    const line = document.createElement('div');
    line.className = 'detail-link-line';
    const content = document.createElement(isUrl ? 'a' : 'code');
    content.className = 'detail-link-value';
    content.textContent = value;
    if (isUrl) {
      content.href = value;
      content.target = '_blank';
      content.rel = 'noopener';
    }
    const copy = document.createElement('button');
    copy.className = 'detail-link-copy';
    copy.type = 'button';
    copy.dataset.copy = value;
    copy.setAttribute('aria-label', isUrl ? `${label} kopyala` : 'Kısa kodu kopyala');
    copy.title = 'Kopyala';
    copy.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
    line.append(content, copy);
    row.append(caption, line);
    container.append(row);
  }
  function setExpanded(card, expanded) {
    card.classList.toggle('is-expanded', expanded);
    const button = card.querySelector('.card-open');
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', `${card.dataset.name} içeriğini ${expanded ? 'kapat' : 'gör'}`);
    button.childNodes[0].nodeValue = expanded ? 'İçeriği kapat ' : `${button.dataset.closedLabel} `;
    button.querySelector('span').textContent = expanded ? '−' : '↗';
    const detail = card.querySelector('.card-detail');
    detail.inert = !expanded;
    detail.setAttribute('aria-hidden', String(!expanded));
    if (!expanded && activeCard === card) activeCard = null;
  }
  function toggleCard(card) {
    stopCardScroll();
    const grid = card.parentElement;
    const cards = [...grid.querySelectorAll(':scope > .plugin-card')];
    cards.forEach(item => layoutAnimations.get(item)?.cancel());
    const before = new Map(cards.map(item => [item, item.getBoundingClientRect()]));
    const expanding = !card.classList.contains('is-expanded');
    if (activeCard && activeCard !== card) setExpanded(activeCard, false);
    setExpanded(card, expanding);
    activeCard = expanding ? card : null;
    const expandedTop = expanding ? Math.max(0, card.getBoundingClientRect().top + scrollY - 84) : 0;
    if (!reduced) {
      cards.forEach(item => {
        const oldRect = before.get(item);
        const newRect = item.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        const widthChange = item === card && expanding && newRect.width > oldRect.width + 30;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && !widthChange) return;
        const start = {translate: `${dx}px ${dy}px`};
        const end = {translate: '0px 0px'};
        if (widthChange) {
          start.clipPath = `inset(0 ${Math.max(0, (1 - oldRect.width / newRect.width) * 100)}% 0 0 round 22px)`;
          end.clipPath = 'inset(0 0 0 0 round 22px)';
        }
        item.style.willChange = 'translate, clip-path';
        const animation = item.animate([start, end], {duration:1080, easing:'cubic-bezier(.22,.72,.18,1)'});
        layoutAnimations.set(item, animation);
        animation.onfinish = animation.oncancel = () => {
          if (layoutAnimations.get(item) === animation) {
            layoutAnimations.delete(item);
            item.style.willChange = '';
          }
        };
      });
    }
    if (expanding && !document.hidden && Math.abs(scrollY - expandedTop) > 8) {
      if (reduced) scrollTo(0, expandedTop);
      else {
        const from = scrollY;
        const distance = expandedTop - from;
        let startTime = 0;
        const step = time => {
          if (activeCard !== card) return;
          if (!startTime) startTime = time;
          const progress = Math.min(1, (time - startTime) / 1080);
          const eased = progress * progress * (3 - 2 * progress);
          scrollTo(0, from + distance * eased);
          cardScrollFrame = progress < 1 ? requestAnimationFrame(step) : 0;
        };
        cardScrollFrame = requestAnimationFrame(step);
      }
    }
  }
  document.querySelectorAll('.plugin-card').forEach((card, index) => {
    const button = card.querySelector('.card-open');
    button.dataset.closedLabel = button.childNodes[0].nodeValue.trim();
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', `${card.dataset.name} içeriğini gör`);
    const detail = document.createElement('div');
    detail.className = 'card-detail';
    detail.id = `card-detail-${index}`;
    detail.inert = true;
    detail.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-controls', detail.id);
    const inner = document.createElement('div');
    inner.className = 'card-detail-inner';
    const content = document.createElement('div');
    content.className = 'card-detail-content';
    content.append(card.querySelector('template').content.cloneNode(true));
    const links = document.createElement('div');
    links.className = 'detail-links';
    if (card.dataset.repo) {
      if (card.dataset.code) addLinkRow(links, 'Kısa kod', card.dataset.code, false);
      addLinkRow(links, 'GitHub depo bağlantısı', card.dataset.repo, true);
    } else if (card.dataset.code) {
      addLinkRow(links, 'Manifest bağlantısı', card.dataset.code, true);
    }
    if (links.childElementCount) content.append(links);
    inner.append(content);
    detail.append(inner);
    card.append(detail);
    button.addEventListener('click', event => { event.stopPropagation(); toggleCard(card); });
    card.addEventListener('click', event => {
      if (event.target.closest('.card-detail, button, a')) return;
      toggleCard(card);
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !paletteMenu.hidden) {
      closePalette();
      paletteButton.focus({preventScroll:true});
      return;
    }
    if (event.key === 'Escape' && activeCard) {
      const button = activeCard.querySelector('.card-open');
      toggleCard(activeCard);
      button.focus({preventScroll:true});
    }
  });
  document.querySelector('#year').textContent = new Date().getFullYear();

  let pointerFrame = 0;
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const x = event.clientX, y = event.clientY;
    document.body.classList.add('has-pointer');
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
      root.style.setProperty('--pointer-x', `${x}px`);
      root.style.setProperty('--pointer-y', `${y}px`);
      const sceneX = Math.round((x / innerWidth - .5) * 30);
      const sceneY = Math.round((y / innerHeight - .5) * 24);
      root.style.setProperty('--scene-x', `${sceneX}px`);
      root.style.setProperty('--scene-y', `${sceneY}px`);
      root.style.setProperty('--scene-x-opposite', `${Math.round(sceneX * -.6)}px`);
      root.style.setProperty('--scene-y-opposite', `${Math.round(sceneY * -.6)}px`);
      pointerFrame = 0;
    });
  }, {passive:true});
  document.addEventListener('pointerleave', () => document.body.classList.remove('has-pointer'));
  document.querySelectorAll('.glow-card').forEach(card => card.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--cx', `${event.clientX - box.left}px`);
    card.style.setProperty('--cy', `${event.clientY - box.top}px`);
  }, {passive:true}));
  if (!reduced) document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') return;
    const dot = document.createElement('span');
    dot.className = 'click-flash'; dot.style.left = `${event.clientX}px`; dot.style.top = `${event.clientY}px`;
    document.body.append(dot); dot.addEventListener('animationend', () => dot.remove(), {once:true});
  }, {passive:true});

  // A small, capped 2D field keeps the background responsive without a shader or full-resolution blur pass.
  const canvas = document.querySelector('#field');
  const ctx = canvas.getContext('2d', {alpha:true});
  if (!ctx) return;
  let width = 0, height = 0, points = [], mouse = {x:-1000,y:-1000}, running = false, last = 0;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    width = innerWidth; height = innerHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = Math.min(46, Math.max(18, Math.round(width * height / 21000)));
    points = Array.from({length:count}, (_,i) => ({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.11,vy:(Math.random()-.5)*.11,r:i%7===0?1.6:.9}));
    draw(0);
  }
  function draw(delta) {
    ctx.clearRect(0,0,width,height);
    const rgb = fieldRgb;
    for (let i=0;i<points.length;i++) {
      const p=points[i];
      if (delta && !reduced) {p.x+=p.vx*delta;p.y+=p.vy*delta;if(p.x<0||p.x>width)p.vx*=-1;if(p.y<0||p.y>height)p.vy*=-1;}
      const cursorDistance=Math.hypot(p.x-mouse.x,p.y-mouse.y);
      const boost=Math.max(0,1-cursorDistance/170);
      ctx.beginPath();ctx.arc(p.x,p.y,p.r+boost*.8,0,Math.PI*2);
      ctx.fillStyle=`rgba(${rgb},${.3+boost*.56})`;ctx.fill();
      for(let j=i+1;j<points.length;j++){
        const q=points[j];const distance=Math.hypot(p.x-q.x,p.y-q.y);
        if(distance>130)continue;
        const near=Math.max(0,1-Math.min(cursorDistance,Math.hypot(q.x-mouse.x,q.y-mouse.y))/210);
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
        ctx.strokeStyle=`rgba(${rgb},${(.048+near*.2)*(1-distance/130)})`;ctx.lineWidth=.8;ctx.stroke();
      }
      if(boost>.1){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(mouse.x,mouse.y);ctx.strokeStyle=`rgba(${rgb},${boost*.12})`;ctx.lineWidth=.7;ctx.stroke();}
    }
  }
  function frame(now) {
    if (!running) return;
    if (now-last>=35) { draw(Math.min(40,now-last)); last=now; }
    requestAnimationFrame(frame);
  }
  function start() { if (running || reduced || document.hidden) return; running=true;last=performance.now();requestAnimationFrame(frame); }
  function stop() { running=false; }
  window.addEventListener('resize', resize, {passive:true});
  window.addEventListener('pointermove', event => {mouse.x=event.clientX;mouse.y=event.clientY;}, {passive:true});
  window.addEventListener('pointerleave', () => {mouse.x=-1000;mouse.y=-1000;});
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  resize();start();
})();
