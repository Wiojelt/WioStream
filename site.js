(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = {cloudstream: document.querySelector('#panel-cloudstream'), nuvio: document.querySelector('#panel-nuvio')};
  const themeButton = document.querySelector('#theme-toggle');
  const dialog = document.querySelector('#plugin-dialog');
  const toast = document.querySelector('#toast');
  let toastTimer;

  try { if (localStorage.getItem('wiostream-theme') === 'light') root.dataset.theme = 'light'; } catch (_) {}
  function updateThemeLabel() { themeButton.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'); }
  updateThemeLabel();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    updateThemeLabel();
    try { localStorage.setItem('wiostream-theme', root.dataset.theme); } catch (_) {}
  });

  function showTab(id, scroll = false) {
    if (!panels[id]) return;
    tabs.forEach(tab => { tab.setAttribute('aria-selected', String(tab.id === `tab-${id}`)); tab.tabIndex = tab.id === `tab-${id}` ? 0 : -1; });
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
  if (panels[location.hash.slice(1)]) showTab(location.hash.slice(1));

  async function copyValue(value) {
    try { await navigator.clipboard.writeText(value); }
    catch (_) {
      const field = document.createElement('textarea');
      field.value = value; field.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.append(field); field.select(); document.execCommand('copy'); field.remove();
    }
    toast.textContent = 'Kopyalandı'; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2100);
  }
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => copyValue(button.dataset.copy)));

  let lastCardButton;
  function openCard(card) {
    lastCardButton = card.querySelector('.card-open');
    const accent = card.style.getPropertyValue('--accent').trim() || '255 255 255';
    dialog.style.setProperty('--dialog-accent', accent);
    const img = card.querySelector('.card-art img');
    const dialogLogo = document.querySelector('#dialog-logo');
    dialogLogo.src = img?.getAttribute('src') || 'assets/logos/LiveHub.svg';
    dialogLogo.alt = img?.alt || `${card.dataset.name} logosu`;
    document.querySelector('#dialog-category').textContent = card.dataset.category || '';
    document.querySelector('#dialog-title').textContent = card.dataset.name || '';
    document.querySelector('#dialog-description').textContent = card.dataset.description || '';
    document.querySelector('#dialog-detail').replaceChildren(card.querySelector('template').content.cloneNode(true));
    const code = card.dataset.code;
    const codeBox = document.querySelector('#dialog-code');
    const copyButton = document.querySelector('#dialog-copy');
    codeBox.hidden = !code;
    codeBox.textContent = code || '';
    copyButton.dataset.value = code || '!megawio';
    copyButton.textContent = code ? (code.startsWith('http') ? 'Manifesti kopyala' : `${code} kopyala`) : '!megawio kopyala';
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
  document.querySelectorAll('.plugin-card').forEach(card => {
    card.addEventListener('click', () => openCard(card));
    card.querySelector('.card-open').setAttribute('aria-label', `${card.dataset.name} içeriğini gör`);
  });
  document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
  document.querySelector('#dialog-done').addEventListener('click', () => dialog.close());
  document.querySelector('#dialog-copy').addEventListener('click', event => copyValue(event.currentTarget.dataset.value));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastCardButton?.focus({preventScroll:true}); });
  document.querySelector('#year').textContent = new Date().getFullYear();

  let pointerFrame = 0;
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const x = event.clientX, y = event.clientY;
    document.body.classList.add('has-pointer');
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
      root.style.setProperty('--pointer-x', `${x}px`);
      root.style.setProperty('--pointer-y', `${y}px`);
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
    const light = root.dataset.theme === 'light';
    const rgb = light ? '49,58,82' : '225,231,243';
    for (let i=0;i<points.length;i++) {
      const p=points[i];
      if (delta && !reduced) {p.x+=p.vx*delta;p.y+=p.vy*delta;if(p.x<0||p.x>width)p.vx*=-1;if(p.y<0||p.y>height)p.vy*=-1;}
      const cursorDistance=Math.hypot(p.x-mouse.x,p.y-mouse.y);
      const boost=Math.max(0,1-cursorDistance/170);
      ctx.beginPath();ctx.arc(p.x,p.y,p.r+boost*.8,0,Math.PI*2);
      ctx.fillStyle=`rgba(${rgb},${.22+boost*.56})`;ctx.fill();
      for(let j=i+1;j<points.length;j++){
        const q=points[j];const distance=Math.hypot(p.x-q.x,p.y-q.y);
        if(distance>130)continue;
        const near=Math.max(0,1-Math.min(cursorDistance,Math.hypot(q.x-mouse.x,q.y-mouse.y))/210);
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
        ctx.strokeStyle=`rgba(${rgb},${(.025+near*.17)*(1-distance/130)})`;ctx.lineWidth=.8;ctx.stroke();
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
