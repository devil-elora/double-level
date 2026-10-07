/* =====================================================================
   DOUBLE LEVEL 홈페이지 동작
   · site-data.js 의 내용을 화면에 채운다 (비어 있는 목록은 그 장면을 숨긴다)
   · 스크롤 장면(pin): 진행도 0~1 을 계산해 로고 열림 → 대표 등장, 글자 열림 → 오선지 → 음표
   · 헤더 배경 / 등장 / 모바일 메뉴 / 맨 위로
   ===================================================================== */
(function () {
  const S = window.SITE || {};
  const $ = (q, el) => (el || document).querySelector(q);
  const $$ = (q, el) => [...(el || document).querySelectorAll(q)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* 사진 주소: 폴더 구분(/)과 캐시 번호(?v=2)는 그대로 두고 파일 이름만 안전하게 바꾼다
     (예전엔 통째로 인코딩해서 'covers/a.jpg' 의 / 까지 %2F 가 됐다) */
  const img = name => {
    if (!name) return '';
    const [p, q] = String(name).split('?');
    return 'site/img/' + p.split('/').map(encodeURIComponent).join('/') + (q ? '?' + q : '');
  };
  const ini = name => esc(String(name || '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '·');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const range = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const ease = t => (t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 첫 진입 인트로: 로고 외곽선을 펜으로 긋듯 그린 뒤,
     안쪽은 볼륨 미터처럼 세로 막대들이 음악에 반응하듯 출렁이며 아래서부터 차오른다(대표 지시). 다 차면 걷어낸다. ---------- */
  (function intro() {
    const box = document.getElementById('intro');
    if (!box) return;
    const L = window.DBLV_LOGO;
    let ended = false;
    const done = () => {
      if (ended) return; ended = true;
      document.body.classList.add('intro-done');
      box.classList.add('out');
      setTimeout(() => box.remove(), 900);
    };
    if (!L || !Array.isArray(L.d) || reduce) { done(); return; }
    const svg = box.querySelector('svg');
    svg.setAttribute('viewBox', `0 0 ${L.w} ${L.h}`);
    const N = 60, bw = L.w / N;
    /* 막대는 로고 모양(모든 윤곽을 한 path 로 합쳐 evenodd → 글자 속 구멍도 구멍)으로 잘라낸다 */
    svg.innerHTML = `<defs><clipPath id="lclip"><path d="${L.d.join(' ')}" clip-rule="evenodd"/></clipPath></defs>
      <g clip-path="url(#lclip)">${Array.from({ length: N }, (_, i) => `<rect x="${(i * bw).toFixed(1)}" y="${L.h}" width="${(bw - 1.6).toFixed(1)}" height="0" fill="#fff"/>`).join('')}</g>
      ${L.d.map(d => `<path class="ol" d="${d}"/>`).join('')}`;
    /* 사인처럼 '직접 쓰는' 모션: 획을 한 번에 다 긋지 않고, 펜이 한 획씩 순서대로 지나간다(대표 지시).
       펜 끝에는 불빛이 따라다니고, 다 쓰면 불빛이 사라진다. */
    const paths = [...svg.querySelectorAll('path.ol')];
    const lens = paths.map(p => p.getTotalLength());
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    paths.forEach((p, i) => { p.style.strokeDasharray = lens[i]; p.style.strokeDashoffset = lens[i]; });
    const pen = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pen.setAttribute('class', 'pen'); pen.setAttribute('r', (L.h * .022).toFixed(1)); pen.setAttribute('cx', '-99'); pen.setAttribute('cy', '-99');
    svg.appendChild(pen);
    const WRITE = 2000, w0 = performance.now();
    const write = now => {
      if (ended) return;
      const u = Math.min(1, (now - w0) / WRITE);
      let want = u * total, px = null, py = null;
      for (let i = 0; i < paths.length; i++) {
        const l = lens[i], drawn = Math.max(0, Math.min(l, want));
        paths[i].style.strokeDashoffset = l - drawn;
        if (drawn > 0 && drawn < l) { const pt = paths[i].getPointAtLength(drawn); px = pt.x; py = pt.y; }
        want -= l;
      }
      if (px !== null) { pen.setAttribute('cx', px.toFixed(1)); pen.setAttribute('cy', py.toFixed(1)); }
      if (u < 1) requestAnimationFrame(write); else svg.classList.add('written');
    };
    requestAnimationFrame(write);
    /* 다 쓴 뒤 볼륨 막대: 음악 이퀄라이저처럼 막대마다 키가 제각각으로 튀면서 차오른다.
       · 왼쪽은 저음(크고 느리게), 오른쪽으로 갈수록 고음(작고 빠르게)
       · 막대마다 타고난 키 차이(jit)와 서로 다른 두 박자를 겹쳐 일정해 보이지 않게
       · 초당 두 번 '킥'이 들어와 전체가 한 번씩 솟는다
       · 마지막 순간에만 편차를 0 으로 좁혀 글자를 꽉 채운다 */
    const rects = [...svg.querySelectorAll('rect')];
    const NB = rects.length;
    const ph = rects.map(() => Math.random() * 6.283);
    const ph2 = rects.map(() => Math.random() * 6.283);
    const jit = rects.map(() => .7 + Math.random() * .6);
    const T0 = WRITE + 120, T1 = 1600, t0 = performance.now();
    const tick = now => {
      if (ended) return;
      const t = now - t0 - T0;
      if (t < 0) { requestAnimationFrame(tick); return; }
      const u = Math.min(1, t / T1), l = 1 - Math.pow(1 - u, 3);
      const v = Math.pow(1 - u, 1.5);                                     // 편차: 끝에서만 사그라든다
      const kick = Math.pow(Math.max(0, Math.sin(t / 1000 * Math.PI * 4)), 8);   // 초당 2번
      for (let i = 0; i < NB; i++) {
        const x = NB > 1 ? i / (NB - 1) : 0;
        const sp = 5 + 15 * x;                                            // 고음일수록 빠른 떨림
        const s1 = .5 + .5 * Math.sin(t / 1000 * sp + ph[i]);
        const s2 = .5 + .5 * Math.sin(t / 1000 * sp * 2.3 + ph2[i]);
        const wave = (.6 * s1 + .4 * s2) * (1 - .3 * x) * jit[i] + kick * .3 * (1 - .5 * x);
        const h = L.h * l * Math.max(0, Math.min(1, (1 - v) + v * wave * 1.45));
        rects[i].setAttribute('height', h.toFixed(1));
        rects[i].setAttribute('y', (L.h - h).toFixed(1));
      }
      if (u < 1) requestAnimationFrame(tick); else svg.classList.add('filled');
    };
    requestAnimationFrame(tick);
    setTimeout(done, WRITE + 1950);
    setTimeout(done, WRITE + 3600);   // 안전장치
  })();
  /* 색 톤 버튼은 대표 지시로 제거(2026-09-11). 바탕은 흑백 고정, 주소에 ?theme=color 를 붙이면 컬러로 볼 수 있다 */

  /* ---------- 마우스 포인터: 7·7·7·G 네 잎 클로버 + Y 줄기 ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cur = document.createElement('div');
    cur.id = 'cur';
    /* 대표 스케치대로: 선은 원래 모양(7·7·7·G 획 잎 + Y 줄기), 그 바로 뒤에 네잎클로버 모양의 빛이 선에서 살짝만 번진다. 돌지 않고 고정. */
    const SEVEN = 'M-13 -12 L13 -12 L-2 16';                                   // 7
    const GEE = 'M13 -8 A13 13 0 1 0 13 6 L2 6';                                // G
    const leaf = (d, a, g = 0) => `<path d="${d}" transform="translate(50 50) rotate(${a}) translate(0 -24) rotate(${g})"/>`; // g: 잎 위치는 그대로 두고 글자만 되돌려 세우는 각도
    cur.innerHTML = `<svg viewBox="0 0 100 130" aria-hidden="true" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
      ${leaf(SEVEN, 315)}${leaf(SEVEN, 45)}${leaf(GEE, 135, -135)}${leaf(SEVEN, 225)}
      <path d="M40 92 L50 106 L60 92 M50 106 L50 126"/>
    </svg>`;
    document.body.appendChild(cur);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, shown = false;
    addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; x = tx; y = ty; cur.classList.add('on'); }
      const hot = e.target && e.target.closest && e.target.closest('a,button,[role="button"],input,select,textarea,label');
      cur.classList.toggle('hot', !!hot);
    }, { passive: true });
    addEventListener('mousedown', () => cur.classList.add('down'));
    addEventListener('mouseup', () => cur.classList.remove('down'));
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
    document.addEventListener('mouseenter', () => { if (shown) cur.classList.add('on'); });
    const follow = () => { x += (tx - x) * .4; y += (ty - y) * .4; cur.style.transform = ''; cur.style.left = x + 'px'; cur.style.top = y + 'px'; requestAnimationFrame(follow); };
    follow();
  }

  /* ---------- 첫 화면 연출: 이퀄라이저 막대 + 떠다니는 먼지·음표·7 ---------- */
  const eq = $('#eq');
  if (eq) {
    let h = '';
    for (let i = 0; i < 56; i++) h += `<i style="animation-duration:${(.9 + Math.random() * 1.2).toFixed(2)}s;animation-delay:${(-Math.random() * 2).toFixed(2)}s"></i>`;
    eq.innerHTML = h;
  }
  const warp = { k: 0 };   // (예전 워프 연출용, 지금은 0 고정)
  const dust = $('#dust');
  if (dust && dust.getContext && !reduce) {
    const ctx = dust.getContext('2d');
    let W = 0, H = 0, ps = [], mx = 0, my = 0;
    /* 은은한 먼지만 (글자·음표는 번잡해서 뺐다 — 대표 지시) */
    const mk = () => ({
      x: Math.random(), y: Math.random(), r: .5 + Math.random() * 1.4, a: .06 + Math.random() * .22,
      vx: (Math.random() - .5) * .0002, vy: -.00008 - Math.random() * .0002, d: .3 + Math.random() * .7,
      g: null, s: 0,
    });
    const size = () => { W = dust.width = dust.offsetWidth * Math.min(devicePixelRatio || 1, 2); H = dust.height = dust.offsetHeight * Math.min(devicePixelRatio || 1, 2); };
    size();
    ps = Array.from({ length: Math.round(Math.min(140, W / 14)) }, mk);
    addEventListener('resize', size, { passive: true });
    addEventListener('mousemove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      const k = W / 1280;
      const wk = warp.k;
      if (wk > 0) {
        /* 워프: 화면 중심에서 바깥으로 뻗는 빛줄기 — 진행도가 클수록 빠르고 길게 */
        const cx = W / 2, cy = H * .48;
        ctx.strokeStyle = '#fff'; ctx.lineCap = 'round';
        for (const p of ps) {
          if (p.wa === undefined) { p.wa = Math.random() * Math.PI * 2; p.wr = Math.random(); }
          p.wr += (.004 + .05 * wk * wk) * (1 + p.d);
          if (p.wr > 1) p.wr = Math.random() * .1;
          const r0 = p.wr * Math.max(W, H) * .75, len = (6 + 260 * wk * wk) * k * (.5 + p.wr);
          const x1 = cx + Math.cos(p.wa) * r0, y1 = cy + Math.sin(p.wa) * r0;
          ctx.globalAlpha = Math.min(1, (.15 + wk) * (.3 + p.wr));
          ctx.lineWidth = (1 + 2.2 * wk * p.wr) * k;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + Math.cos(p.wa) * len, y1 + Math.sin(p.wa) * len); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        return;
      }
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -.05 || p.x < -.05 || p.x > 1.05) Object.assign(p, mk(), { y: 1.05 });
        const px = (p.x + mx * .04 * p.d) * W, py = (p.y + my * .04 * p.d) * H;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(px, py, p.r * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    draw();
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else draw(); });
  }

  /* ---------- 회사 정보 ---------- */
  const c = S.company || {};
  $$('[data-company]').forEach(el => { const v = c[el.dataset.company]; if (v) el.textContent = v; });
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- 대표(CEO) ---------- */
  const ceo = S.ceo || {};
  const cm = $('#ceo-meta');
  if (cm) {
    cm.innerHTML = `
      <div class="role">CEO</div>
      <h2>${esc(ceo.en || ceo.name || '')}<small>${esc(ceo.name || '')}${ceo.title ? ' · ' + esc(ceo.title) : ''}</small></h2>
      ${ceo.bio ? `<p>${esc(ceo.bio)}</p>` : ''}
      ${ceo.instagram ? `<a href="${esc(ceo.instagram)}" target="_blank" rel="noopener">INSTAGRAM <span aria-hidden="true">↗</span></a>` : ''}`;
  }
  const bubble = $('#ceo-bubble');
  if (bubble) { if (ceo.greeting) bubble.textContent = ceo.greeting; else bubble.remove(); }
  /* 첫 화면의 대표 모습: 3D 모델(.glb) > heroPhoto(사진 3D 카드) > 그림 캐릭터(기본).
     (ceo.photo 는 오선지 프로필 카드에 쓰인다 — 첫 화면은 대표 지시대로 캐릭터가 기본) */
  const av = $('#avatar');
  /* 3D 모델 파일: site-data.js 의 ceo.model, 또는 시험용으로 주소 뒤에 ?model=<glb 주소> */
  let modelUrl = '';
  try { modelUrl = new URLSearchParams(location.search).get('model') || ceo.model || ''; } catch (e) { modelUrl = ceo.model || ''; }
  if (av && ceo.heroPhoto) {
    av.classList.add('photo');
    $('svg', av).remove();
    av.insertAdjacentHTML('afterbegin', `<div class="pcard"><div class="glow"></div><img src="${img(ceo.heroPhoto)}" alt="${esc(ceo.name || 'CEO')}"><div class="tint"></div><div class="shine"></div></div>`);
  }

  /* ---------- 오선지 만들기 ----------
     items 를 한 줄에 몇 개씩 나눠 오선지 여러 단으로. 음표 위치(x=칸, y=음높이)는 멜로디처럼 오르내린다. */
  /* 낮은 음(0~3)과 높은 음(4~8)이 번갈아 나오게 — 이름표가 아래/위로 번갈아 붙어 이웃끼리 겹치지 않는다 */
  const PITCH = [3, 6, 2, 7, 3, 5, 1, 6, 3, 7, 2, 5, 3, 6, 2, 8];
  function buildStaves(root, items, kind) {
    root.innerHTML = '';
    const cap = kind === 'songs' ? (innerWidth < 600 ? 2 : 4) : (innerWidth < 600 ? 4 : innerWidth < 900 ? 5 : 6);   // 곡은 한 줄에 4개 (대표 지시; 좁은 폰은 2개 — 이름표가 겹치지 않게)
    const rows = [];
    for (let i = 0; i < items.length; i += cap) rows.push(items.slice(i, i + cap));
    const notes = [];
    let idx = 0;
    const capEl = document.createElement('div');
    capEl.className = 'cap';
    capEl.textContent = kind === 'people' ? '♪  MEET THE ROSTER' : '♪  DISCOGRAPHY · SELECTED WORKS';
    root.appendChild(capEl);
    rows.forEach(row => {
      const st = document.createElement('div');
      st.className = 'staff';
      /* 오선 5줄: 예전엔 SVG 점선(stroke-dasharray)으로 그렸는데, 폭이 넓어지면 선이 중간에서 끊겼다
         (non-scaling-stroke 는 점선 길이를 화면 기준으로 재는데 pathLength 는 좌표 기준이라 어긋난다).
         그래서 그냥 가로 막대를 왼쪽부터 늘리는 방식으로 바꿈 — 어떤 폭에서도 끝까지 이어진다. */
      st.innerHTML = [10, 30, 50, 70, 90].map(y => `<i class="ln" style="top:${y}%"></i>`).join('') + '<i class="bar"></i>';
      row.forEach((it, j) => {
        const k = PITCH[idx % PITCH.length];
        const x = (7 + (j + .5) / row.length * 86).toFixed(2) + '%';   // 양끝 이름표가 잘리지 않게 좌우 7% 여백
        const y = ((20 + k * 20) / 2) + '%';
        const link = it.link || it.instagram || '';
        const el = document.createElement(link ? 'a' : 'div');
        if (link) { el.href = link; el.target = '_blank'; el.rel = 'noopener'; }
        // 사진이 있는 사람은 동그란 음표 대신 세로 프로필 카드로 (대표 지시: 꼭 원일 필요 없음)
        el.className = 'note' + (kind === 'people' ? (it.photo ? ' ph' : '') : ' song lp') + (k >= 4 ? ' down' : '');
        el.style.setProperty('--x', x);
        el.style.setProperty('--y', y);
        el.innerHTML = kind === 'people'
          ? `<div class="head">${it.photo ? `<img src="${img(it.photo)}" alt="${esc(it.name)}" loading="lazy">` : ini(it.name)}</div><i class="stem"></i>
             <div class="lab"><b>${esc(it.name)}</b><small>${esc(it.role || it.ko || '')}</small></div>`
          /* LP 음반: 재킷(앨범 커버) 뒤에 두고, 검은 바이닐 가운데 라벨에도 커버 — 커버가 없으면 ♪ 라벨 */
          /* 네모 앨범 커버(재킷)만 크게 보이고, 마우스를 올리면 뒤의 LP 판이 오른쪽으로 빠져나온다 */
          : `<div class="head">
               <span class="disc">${it.cover ? `<img src="${img(it.cover)}" alt="" loading="lazy">` : '<span class="lbl">♪</span>'}<i class="hole"></i><i class="gloss"></i></span>
               <span class="sleeve">${it.cover ? `<img src="${img(it.cover)}" alt="${esc(it.album || it.title)}" loading="lazy">` : '<span class="lbl">♪</span>'}</span>
             </div><i class="stem"></i>
             <div class="lab"><b>${esc(it.title)}</b><small>${esc(it.artist || '')}</small></div>`;
        st.appendChild(el);
        notes.push(el);
        idx++;
      });
      root.appendChild(st);
    });
    return notes;
  }

  /* ---------- 장면 등록 ---------- */
  const pins = [];
  /* reg(sec, fn, a, b): 고정 구간(sec)의 진행도 중 [a,b] 구간을 0~1 로 바꿔 fn 에 준다 — 한 화면 안에서 여러 장면이 이어진다 */
  const reg = (sec, fn, a = 0, b = 1) => { if (sec && !sec.hidden) pins.push({ sec, fn: p => fn(range(p, a, b)), raw: fn, top: 0, len: 1, p: -1 }); };
  /* 한 세계의 구간표(hero --len:16): 문 열림 → 통로를 걸어 PRODUCER 부스(정지, 페이지 열림) → 다시 걸어 SONGS 부스(정지, 페이지 열림) → 무대까지 걸어가 무대 화면에 CONTACT */
  const WORLD = { prompt: [.04, .09], doors: [.09, .2], walk: [.09, .4], producer: [.4, .55], walk2: [.55, .6], songs: [.6, .84], walk3: [.84, .89], contact: [.89, 1] };
  const STOPS = [{ key: 'producer', label: 'ROSTER', at: .5, side: -1 }, { key: 'songs', label: 'DISCOGRAPHY', at: .86, side: 1 }];
  /* 스크롤 진행도 → 통로 위 캐릭터 위치(0~1): 부스 앞에서는 멈춰 서 있고, 마지막엔 무대 앞(1)까지 간다 */
  const walkOf = p => {
    if (p < WORLD.producer[0]) return range(p, WORLD.walk[0], WORLD.walk[1]) * STOPS[0].at;
    if (p < WORLD.walk2[0]) return STOPS[0].at;
    if (p < WORLD.songs[0]) return STOPS[0].at + range(p, WORLD.walk2[0], WORLD.walk2[1]) * (STOPS[1].at - STOPS[0].at);
    if (p < WORLD.walk3[0]) return STOPS[1].at;
    return STOPS[1].at + range(p, WORLD.walk3[0], WORLD.walk3[1]) * (1 - STOPS[1].at);
  };

  // 첫 화면: 로고(문 두 짝)가 열리며 대표 등장
  const hero = $('#hero');
  if (hero) {
    const doors = $('#doors'), dl = $('.door.l', hero), dr = $('.door.r', hero);
    /* 3D 두께: 로고 모양 판을 여러 장 겹쳐(뒤로 갈수록 어둡게) 입체로 보이게 한다 */
    const LAYERS = 14;
    [dl, dr].forEach(d => {
      let h = '';
      for (let i = LAYERS; i >= 1; i--) h += `<div class="layer${i <= 6 ? ' mid' : ''}" style="--i:${i}"></div>`;
      d.innerHTML = h + '<div class="layer face" style="--i:0"></div>';
    });
    const enter = $('#enter'), cue = $('.scroll-cue', hero), venue = $('#venue');
    const atWorld = f => hero.offsetTop + (hero.offsetHeight - innerHeight) * f + 2;
    const btn = $('#enter-btn');
    if (btn) btn.addEventListener('click', () => window.scrollTo({ top: atWorld(WORLD.walk[0] + .02), behavior: 'smooth' }));
    /* 공연장 3D: 준비되면 붙는다. 실패하면(WebGL 없음) 문만 열리고 다음 장면으로 간다 */
    let world = null;
    if (venue && window.DBLV3D && !reduce) {
      window.DBLV3D.mount(venue, { stops: STOPS }).then(w => { world = w; venue.classList.add('on'); }).catch(e => console.warn('[DBLV 3D] failed to load the venue', e && e.message));
    }
    reg(hero, p => {
      const ask = ease(range(p, WORLD.prompt[0], WORLD.prompt[1])) * (1 - range(p, WORLD.doors[0], WORLD.doors[0] + .06));
      if (enter) { enter.style.opacity = ask; enter.style.transform = `translate(-50%, ${(1 - ease(range(p, WORLD.prompt[0], WORLD.prompt[1]))) * 24}px)`; enter.style.pointerEvents = ask > .5 ? 'auto' : 'none'; }
      const o = ease(range(p, WORLD.doors[0], WORLD.doors[1]));
      dl.style.transform = `translateX(${-o * 46}vw) rotateY(${-o * 74}deg)`;
      dr.style.transform = `translateX(${o * 46}vw) rotateY(${o * 74}deg)`;
      doors.style.opacity = 1 - range(p, WORLD.doors[0] + .06, WORLD.doors[1]);
      if (venue) venue.style.opacity = range(p, WORLD.doors[0], WORLD.doors[0] + .08) * (1 - range(p, WORLD.songs[0] + .06, WORLD.songs[0] + .16) * .0);
      if (world) {
        world.setProgress(walkOf(p));
        const dimP = range(p, WORLD.producer[0], WORLD.producer[0] + .06) * (1 - range(p, WORLD.walk2[0], WORLD.walk2[0] + .04));
        const dimS = range(p, WORLD.songs[0], WORLD.songs[0] + .06) * (1 - range(p, WORLD.walk3[0], WORLD.walk3[0] + .04));
        const dimC = range(p, WORLD.contact[0], WORLD.contact[0] + .06) * .5;   // 무대 위에서는 공연장이 뒤에 계속 보인다
        world.setDim(Math.max(dimP, dimS, dimC));
      }
      if (cue) cue.style.opacity = 1 - range(p, 0, .05);
      hero.classList.toggle('opened', p > WORLD.doors[0] + .05);
      /* 장면 켜고 끄기: 공연장 안에서 PRODUCER → SONGS → (무대에 닿으면) CONTACT 가 열린다 */
      const pr = $('#producer'), so = $('#songs'), co = $('#contact');
      if (pr) pr.classList.toggle('active', p >= WORLD.producer[0] - .01 && p < WORLD.walk2[0] + .02);
      if (so) so.classList.toggle('active', p >= WORLD.songs[0] - .01 && p < WORLD.walk3[0] + .02);
      if (co) { co.classList.toggle('active', p >= WORLD.contact[0] - .01); co.style.setProperty('--on', ease(range(p, WORLD.contact[0], WORLD.contact[0] + .045)).toFixed(3)); }
    });
    /* 메뉴: PRODUCER / SONGS / CONTACT 는 같은 화면 안의 지점으로 이동 */
    $$('a[href="#producer"], a[href="#songs"], a[href="#contact"]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); document.body.classList.remove('menu-open');
      const h = a.getAttribute('href');
      const f = h === '#producer' ? WORLD.producer[0] + .045 : h === '#songs' ? WORLD.songs[0] + .05 : WORLD.contact[0] + .06;
      window.scrollTo({ top: atWorld(f), behavior: 'smooth' });
    }));
    // 마우스를 따라 살짝 기우는 3D
    if (!reduce && matchMedia('(hover:hover)').matches) {
      hero.addEventListener('mousemove', e => {
        hero.style.setProperty('--mx', ((e.clientX / innerWidth) - .5).toFixed(3));
        hero.style.setProperty('--my', ((e.clientY / innerHeight) - .5).toFixed(3));
      });
      hero.addEventListener('mouseleave', () => { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
    }
  }

  // PRODUCER / SONGS: 글자가 위아래로 열리며 오선지가 그려지고 음표가 차례로 올라온다
  const staffHolders = [];
  function staffScene(id, items, kind) {
    const sec = $('#' + id);
    if (!sec) return;
    if (!items || !items.length) { sec.hidden = true; return; }
    const root = $('.staffs', sec), t = $('.bigword .t', sec), b = $('.bigword .b', sec);
    const holder = { root, items, kind, notes: buildStaves(root, items, kind), win: $('.staffwin', sec) };
    groupRows(holder);
    if (kind === 'songs') holder.deck = setupDeck(sec, items, holder.notes);
    staffHolders.push(holder);
    reg($('#hero'), p => {
      if (p < .08 && holder.deck) holder.deck.stop();   // 화면을 벗어나면 소리도 멈춘다
      const s = .88 + .12 * range(p, 0, .12);
      const o = ease(range(p, .1, .26));
      t.style.transform = `translate(-50%,-50%) translateY(${-o * 44}vh) scale(${s})`;
      b.style.transform = `translate(-50%,-50%) translateY(${o * 44}vh) scale(${s})`;
      t.style.opacity = b.style.opacity = (p < .01 ? 0 : 1) * (1 - .88 * o);
      const deckEl = $('.deck', sec); if (deckEl) deckEl.style.opacity = range(p, .12, .22);
      root.style.opacity = range(p, .14, .22);
      root.style.setProperty('--draw', range(p, .15, .25).toFixed(3));   // 오선지는 음표가 나오기 전에 끝까지 그어진다(중간에 끊기지 않게)
      /* 음표 채우기·스크롤(대표 지시): 지금 보이는 줄들을 차례로 다 채우고, 다 차면 다음 줄이 보이게 올라간 뒤 그 줄을 채운다 */
      const win = holder.win, rows = holder.rows || [];
      const winH = win ? win.clientHeight : 1e9;
      const max = win ? Math.max(0, root.offsetHeight - winH) : 0;
      const head = holder.notes[0] && $('.head', holder.notes[0]);
      const extra = (head && rows[0] ? (head.offsetHeight - rows[0].offsetHeight) / 2 : 0) + 64;   // 줄 아래로 삐져나온 커버 + 이름표
      const segs = []; let cur = 0;
      rows.forEach((row, r) => {
        const need = Math.min(max, Math.max(0, row.offsetTop + row.offsetHeight + extra - winH));
        if (need > cur + 1) { segs.push({ from: cur, to: need, len: .08 }); cur = need; }
        segs.push({ row: r, len: .04 * Math.max(1, (holder.byRow[r] || []).length) });
      });
      const total = segs.reduce((a, g) => a + g.len, 0) || 1;
      let q = range(p, .26, .95) * total, scroll = 0;
      segs.forEach(g => {
        const k = q <= 0 ? 0 : Math.max(0, Math.min(1, q / g.len)); q -= g.len;
        /* 아직 오지 않은 구간은 건드리지 않는다 (건드리면 나중 구간의 시작값이 먼저 적용돼 미리 올라가 버린다) */
        if (g.row === undefined) { if (k > 0) scroll = g.from + (g.to - g.from) * ease(k); }
        else (holder.byRow[g.row] || []).forEach((el, j, arr) => el.classList.toggle('on', k * arr.length >= j + .6));
      });
      root.style.transform = `translateY(${(-scroll).toFixed(1)}px)`;
    }, WORLD.songs[0], WORLD.songs[1]);
  }
  /* 줄별 음표 묶음 (채우기·스크롤 순서용) */
  function groupRows(h) {
    h.rows = Array.from(h.root.querySelectorAll('.staff'));
    h.byRow = h.rows.map(r => h.notes.filter(n => n.parentElement === r));
  }
  /* ---------- SONGS 플레이어: 왼쪽 실사풍 턴테이블 + 오른쪽 Now playing ----------
     · 앨범 커버를 턴테이블에 끌어다 놓으면 그 곡(공식 30초 미리듣기)이 재생된다 (pointer 드래그: 마우스·터치 공통)
     · 오른쪽: 곡 정보, 진행 바, 반복·이전·재생/일시정지·다음·무작위 버튼 */
  function setupDeck(sec, items, notes) {
    const root = $('.staffs', sec);
    if (!root) return null;
    const deck = document.createElement('div');
    deck.className = 'deck';
    /* 바이닐 그루브: 촘촘한 홈 + 곡과 곡 사이 굵은 띠, 바깥은 리드인 여백 */
    /* 바이닐 홈: 촘촘한 미세 홈 + 곡과 곡 사이 굵은 띠 (라벨 바깥 ~ 리드인 여백까지) */
    const grooves = Array.from({ length: 66 }, (_, i) => {
      const r = 70 + i * 1.82, band = i % 15 === 0;
      return `<circle cx="200" cy="200" r="${r.toFixed(1)}" fill="none" stroke="rgba(255,255,255,${(band ? .17 : .05 + (i % 3) * .013).toFixed(3)})" stroke-width="${band ? 1.7 : .9}"/>`;
    }).join('');
    const I = {
      rep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
      shuf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
      prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
      next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
      play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
      pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    };
    deck.innerHTML = `
      <div class="player">
        <div class="tt" title="Drop an album cover here to play">
          <svg viewBox="0 0 400 400" aria-hidden="true">
            <defs>
              <radialGradient id="ttPl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#2B2B31"/><stop offset=".34" stop-color="#17171B"/><stop offset=".78" stop-color="#0C0C0F"/><stop offset=".97" stop-color="#141419"/><stop offset="1" stop-color="#050506"/></radialGradient>
              <radialGradient id="ttLb" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9D9D9"/></radialGradient>
              <clipPath id="ttLbl"><circle cx="200" cy="200" r="54"/></clipPath>
              <linearGradient id="ttSheen" x1=".05" x2=".95" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".3" stop-color="#fff" stop-opacity=".07"/><stop offset=".52" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></linearGradient>
              <radialGradient id="ttSpot" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".55" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
              <radialGradient id="ttEdge" cx="50%" cy="50%" r="50%"><stop offset=".9" stop-color="#fff" stop-opacity="0"/><stop offset=".97" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
              <linearGradient id="ttPinS" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#F4F4F4"/><stop offset=".35" stop-color="#9C9C9C"/><stop offset=".62" stop-color="#3C3C3C"/><stop offset="1" stop-color="#A8A8A8"/></linearGradient>
              <radialGradient id="ttPinT" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#8E8E8E"/></radialGradient>
              <linearGradient id="ttArm" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ECECEF"/><stop offset=".5" stop-color="#A0A0A6"/><stop offset="1" stop-color="#57575D"/></linearGradient>
              <radialGradient id="ttArmB" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#9A9AA0"/><stop offset="1" stop-color="#26262A"/></radialGradient>
            </defs>
            <!-- 바이닐 판 (도는 부분) -->
            <g class="disc">
              <circle cx="200" cy="200" r="196" fill="url(#ttPl)"/>
              ${grooves}
              <circle cx="200" cy="200" r="192" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="2.4"/>
              <circle cx="200" cy="200" r="68" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.6"/>
              <circle cx="200" cy="200" r="62" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="3"/>
              <circle cx="200" cy="200" r="58" fill="url(#ttLb)"/>
              <image class="lblimg" x="147" y="147" width="106" height="106" clip-path="url(#ttLbl)" preserveAspectRatio="xMidYMid slice"/>
              <circle cx="200" cy="200" r="58" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.4"/>
              <circle cx="200" cy="200" r="9.5" fill="#08080A"/>
            </g>
            <!-- 고정 반사광: 판이 돌아도 빛은 제자리에 있어야 진짜처럼 보인다 -->
            <g style="pointer-events:none">
              <circle cx="200" cy="200" r="196" fill="url(#ttSheen)"/>
              <circle cx="200" cy="200" r="196" fill="url(#ttEdge)"/>
              <ellipse cx="132" cy="118" rx="120" ry="52" transform="rotate(-38 132 118)" fill="url(#ttSpot)" opacity=".5"/>
              <ellipse cx="286" cy="292" rx="86" ry="34" transform="rotate(-38 286 292)" fill="url(#ttSpot)" opacity=".2"/>
            </g>
            <!-- 스핀들(가운데 핀): 판은 돌고 핀은 그대로 — 판을 올리면 이 핀에 꽂혀 돌아간다 -->
            <g class="spindle" aria-hidden="true">
              <ellipse cx="200" cy="206" rx="15" ry="6" fill="#000" opacity=".4"/>
              <rect x="192" y="178" width="16" height="27" rx="2" fill="url(#ttPinS)"/>
              <ellipse cx="200" cy="178" rx="8" ry="3.6" fill="url(#ttPinT)"/>
              <ellipse cx="198" cy="177.5" rx="2.6" ry="1.1" fill="#fff" opacity=".95"/>
            </g>
            <!-- 톤암(막대): 곡을 올려 재생하면 막대가 판 위로 내려와 바늘이 닿고, 멈추면 다시 들려 나간다 (.deck.playing .arm) -->
            <g class="arm" aria-hidden="true">
              <!-- 뒤쪽 무게추(카운터웨이트) + 안티스케이팅 다이얼 -->
              <g transform="rotate(-44 368 34)">
                <rect x="366" y="16" width="40" height="21" rx="10" fill="#2E2E34"/>
                <rect x="366" y="19" width="40" height="7" rx="3.5" fill="#fff" fill-opacity=".2"/>
                <circle cx="404" cy="26.5" r="5" fill="#1A1A1E"/>
              </g>
              <!-- 암 튜브 -->
              <path d="M368 34 L302 102" stroke="url(#ttArm)" stroke-width="11" stroke-linecap="round"/>
              <path d="M366 32.6 L300 100.6" stroke="#fff" stroke-opacity=".4" stroke-width="2.6" stroke-linecap="round"/>
              <!-- 헤드셸 + 바늘 -->
              <g transform="rotate(-30 302 102)">
                <rect x="287" y="95" width="31" height="23" rx="5" fill="#232327"/>
                <rect x="291" y="99" width="23" height="6" rx="3" fill="#fff" fill-opacity=".18"/>
                <rect x="295" y="118" width="14" height="7" rx="2" fill="#8E8E96"/>
                <path d="M302 125 L302 133" stroke="#E4E4EA" stroke-width="3" stroke-linecap="round"/>
              </g>
              <!-- 피벗 베이스 -->
              <circle cx="368" cy="34" r="24" fill="url(#ttArmB)"/>
              <circle cx="368" cy="34" r="24" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.2"/>
              <circle cx="368" cy="34" r="10" fill="#141416"/>
              <circle cx="361" cy="26" r="3.4" fill="#fff" fill-opacity=".5"/>
            </g>
          </svg>
          <i class="ring"></i><i class="demo"></i>
        </div>
        <div class="info">
          <div class="hint"><span class="arrow">←</span>Drag an album onto the record to play</div>
          <div class="npl">Now playing</div>
          <div class="artist">DOUBLE LEVEL — song previews</div>
          <div class="title">Put a record on</div>
          <div class="credits" aria-live="polite"></div>
          <div class="prog"><span class="t0">0:00</span><div class="bar"><i></i></div><span class="t1">0:30</span></div>
          <div class="ctl">
            <button type="button" data-a="rep" title="Repeat">${I.rep}</button>
            <button type="button" data-a="prev" title="Previous">${I.prev}</button>
            <button type="button" data-a="play" class="big" title="Play / Pause">${I.play}</button>
            <button type="button" data-a="next" title="Next">${I.next}</button>
            <button type="button" data-a="shuf" title="Shuffle">${I.shuf}</button>
          </div>
        </div>
      </div>`;
    /* 처음 오는 사람이 '앨범을 판에 올린다'를 바로 알도록: 데모 조각에 실제 첫 앨범 커버를 넣어
       판 위로 올라가는 모션이 진짜 앨범처럼 보이게 한다 (대표 지시: 많은 방문자가 처음 본다) */
    const demoEl = $('.demo', deck);
    if (demoEl && items[0] && items[0].cover) { demoEl.style.backgroundImage = `url("${img(items[0].cover)}")`; demoEl.style.backgroundSize = 'cover'; demoEl.style.backgroundPosition = 'center'; }
    const old = $('.deck', sec); if (old) old.remove();   // 다시 그릴 때 이전 카드 제거
    const win = $('.staffwin', sec);
    if (win) sec.insertBefore(deck, win); else root.prepend(deck);   // 카드는 앨범 창 위에 고정
    const tt = $('.tt', deck), lblimg = $('.lblimg', deck), artistEl = $('.artist', deck), titleEl = $('.title', deck);
    const t0 = $('.t0', deck), t1 = $('.t1', deck), bar = $('.bar i', deck), playBtn = $('[data-a="play"]', deck), creditEl = $('.credits', deck);
    const st = { i: -1, loop: false, shuf: false, src: '', tok: 0 };
    const fmt = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
    /* 오디오 요소는 딱 하나만 만들어 재사용한다. 모바일(iOS)은 '요소마다' 자동재생을 막아서,
       매번 new Audio() 를 만들면 판에 LP 를 올려도 소리가 안 나고 ▶ 를 눌러야 한다.
       하나만 재사용하면 첫 사용자 동작으로 잠금이 풀린 뒤 계속 자동재생된다. */
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = .9;
    let unlocked = false;
    audio.addEventListener('loadedmetadata', () => { if (isFinite(audio.duration)) t1.textContent = fmt(audio.duration); });
    audio.addEventListener('timeupdate', () => { if (!audio.duration) return; bar.style.width = (audio.currentTime / audio.duration * 100).toFixed(1) + '%'; t0.textContent = fmt(audio.currentTime); });
    audio.addEventListener('ended', () => { if (st.loop) { try { audio.currentTime = 0; } catch (e) {} audio.play().catch(() => {}); } else load(nextIndex(), true); });
    const setPlaying = on => { deck.classList.toggle('playing', on); playBtn.innerHTML = on ? I.pause : I.play; };
    const stop = () => { try { audio.pause(); } catch (e) {} setPlaying(false); };
    const nextIndex = () => {
      if (!items.length) return -1;
      if (st.shuf && items.length > 1) { let r; do { r = Math.floor(Math.random() * items.length); } while (r === st.i); return r; }
      return (st.i + 1) % items.length;
    };
    /* 모바일 잠금 풀기: 드래그를 '시작하는' 순간(확실한 사용자 동작)에 이 곡을 물려 음소거로 살짝 재생했다가 멈춘다.
       그러면 판에 올리는(드롭) 순간 소리가 자동으로 난다. 이미 재생 중이면(잠금이 풀린 상태) 아무것도 하지 않는다. */
    const prime = it => {
      if (unlocked || !it || !it.preview) return;
      const myTok = ++st.tok;
      try {
        if (st.src !== it.preview) { audio.src = it.preview; st.src = it.preview; }
        audio.muted = true;
        const p = audio.play();
        if (p && p.then) p.then(() => { unlocked = true; if (st.tok === myTok) { try { audio.pause(); audio.currentTime = 0; } catch (e) {} } audio.muted = false; }).catch(() => { try { audio.muted = false; } catch (e) {} });
        else audio.muted = false;
      } catch (e) { try { audio.muted = false; } catch (_) {} }
    };
    const load = (i, autoplay) => {
      const it = items[i];
      if (!it) return;
      ++st.tok;                        // prime 의 지연 콜백이 이 재생을 건드리지 않도록 토큰을 올린다
      st.i = i;
      st.srcEl = notes[i] || null;   // 정지할 때 이 앨범 카드로 LP 를 되돌려 보낸다
      deck.classList.add('played');   // 한 번 올리면 안내 표시는 치운다
      if (it.cover) lblimg.setAttribute('href', img(it.cover)); else lblimg.removeAttribute('href');
      artistEl.textContent = `${it.artist || ''}${it.album ? ' — ' + it.album : ''}`;
      titleEl.textContent = it.title || '';
      /* 이 곡에서 더블레벨이 맡은 일 (작사·작곡·편곡) */
      creditEl.innerHTML = (it.credit || []).length
        ? `<b>DOUBLE LEVEL</b>${(it.credit || []).map(c => `<i>${esc(c)}</i>`).join('')}` : '';
      bar.style.width = '0%'; t0.textContent = '0:00'; t1.textContent = '0:30';
      if (!it.preview) { try { audio.pause(); } catch (e) {} setPlaying(false); titleEl.textContent = `${it.title} · no preview available`; return; }
      audio.muted = false;
      if (st.src !== it.preview) { audio.src = it.preview; st.src = it.preview; }   // 미리 물려 둔 곡이면 다시 받지 않는다
      try { audio.currentTime = 0; } catch (e) {}
      applyRate();   // 회전수(33/45)·피치 설정 적용
      if (autoplay) audio.play().then(() => { unlocked = true; setPlaying(true); }).catch(() => { setPlaying(false); titleEl.textContent = `${it.title} · press ▶ to play`; });
      else setPlaying(false);
    };
    $$('.ctl button', deck).forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const a = b.dataset.a;
      if (a === 'play') {
        if (st.i < 0) { load(0, true); return; }
        if (audio.paused) audio.play().then(() => setPlaying(true)).catch(() => {}); else { audio.pause(); setPlaying(false); }
      } else if (a === 'next') load(nextIndex(), true);
      else if (a === 'prev') load(st.i <= 0 ? items.length - 1 : st.i - 1, true);
      else if (a === 'rep') { st.loop = !st.loop; b.classList.toggle('on', st.loop); }
      else if (a === 'shuf') { st.shuf = !st.shuf; b.classList.toggle('on', st.shuf); }
    }));
    // 진행 바를 누르면 그 위치로
    $('.bar', deck).addEventListener('click', e => { if (!audio.duration) return; const r = e.currentTarget.getBoundingClientRect(); audio.currentTime = audio.duration * clamp((e.clientX - r.left) / r.width, 0, 1); });
    tt.addEventListener('click', () => stopEject());   // 판(레코드) 클릭 = 정지하고 LP 를 앨범으로 되돌린다 (재생/일시정지는 가운데 ▶ 버튼)
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

    /* 회전수(33/45)·피치 조작부는 제거됨 → 재생은 항상 정상 속도 */
    function applyRate() { try { audio.playbackRate = 1; } catch (e) {} }
    /* 정지: 소리를 멈추고, 판 위의 LP 가 원래 앨범 카드로 도로 들어가는 모션 후 판을 비운다 */
    function ejectToAlbum() {
      if (!deck.classList.contains('played')) return;
      const it = items[st.i] || {};
      const rr = tt.getBoundingClientRect();
      const tgt = st.srcEl ? st.srcEl.getBoundingClientRect() : { left: rr.left, top: rr.bottom + 60, width: 120, height: 120 };
      const fly = document.createElement('div');
      fly.className = 'lp-eject';
      fly.style.cssText = `left:${rr.left}px;top:${rr.top}px;width:${rr.width}px;height:${rr.width}px`;
      fly.innerHTML = `<div class="lp-eject-disc"${it.cover ? ` style="--cv:url('${img(it.cover)}')"` : ''}></div>`;
      document.body.appendChild(fly);
      const cx = rr.left + rr.width / 2, cy = rr.top + rr.width / 2;   // 판(출발) 중심
      const dx = (tgt.left + tgt.width / 2) - cx;
      const dy = (tgt.top + tgt.height / 2) - cy;
      const scale = Math.max(.16, Math.min(.6, tgt.width / rr.width));
      /* '앨범들 위에서부터 가져가는' 느낌: 앨범 줄보다 높이 한 번 들어 올렸다가(peak) 앨범 속으로 내려 꽂는 곡선 궤적 */
      const peakY = (Math.min(cy, tgt.top) - Math.max(70, tgt.height * .62)) - cy;
      const peakX = dx * .66;
      const midScale = scale + (1 - scale) * .5;
      const DUR = 760;
      if (fly.animate) {
        fly.animate([
          { transform: 'translate(0px,0px) scale(1) rotate(0deg)', opacity: 1, easing: 'cubic-bezier(.25,.6,.3,1)' },      // 위로 들어 올려 앨범 위를 지난다
          { transform: `translate(${peakX}px, ${peakY}px) scale(${midScale}) rotate(-18deg)`, opacity: 1, offset: .44, easing: 'cubic-bezier(.5,0,.72,1)' },
          { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(-45deg)`, opacity: 0 }                          // 앨범 속으로 내려 꽂힌다
        ], { duration: DUR, fill: 'forwards' }).onfinish = () => fly.remove();
      } else {
        requestAnimationFrame(() => {
          fly.style.transition = `transform ${DUR}ms cubic-bezier(.5,0,.2,1), opacity ${DUR}ms ease-in`;
          fly.style.transform = `translate(${dx}px, ${dy}px) scale(${scale}) rotate(-45deg)`;
          fly.style.opacity = '0';
        });
        setTimeout(() => fly.remove(), DUR + 60);
      }
      /* 앨범 카드가 LP 를 되받는 순간의 튐 — 디스크가 앨범에 닿을 즈음(막바지)에 맞춘다 */
      if (st.srcEl) {
        const card = st.srcEl;
        setTimeout(() => { card.classList.remove('caught'); void card.offsetWidth; card.classList.add('caught'); setTimeout(() => card.classList.remove('caught'), 700); }, DUR - 150);
      }
    }
    /* 판(레코드)을 누르면: 소리를 멈추고 LP 가 원래 앨범으로 되돌아간다 (조작부를 없앤 대신 이 동작으로 옮김) */
    function stopEject() {
      if (st.i < 0 && !deck.classList.contains('played')) return;
      try { audio.pause(); } catch (e) {}
      ejectToAlbum();                       // LP 를 앨범으로 되돌리는 모션 (판이 비기 전에 현재 곡 정보를 읽는다)
      try { audio.currentTime = 0; } catch (e) {}
      setPlaying(false);                    // 회전 멈추고 톤암이 들려 나간다
      deck.classList.remove('played');      // 판을 비우고 안내 문구로
      lblimg.removeAttribute('href');
      titleEl.textContent = 'Put a record on';
      artistEl.textContent = 'DOUBLE LEVEL — song previews';
      creditEl.innerHTML = '';
      bar.style.width = '0%'; t0.textContent = '0:00';
      st.i = -1; st.srcEl = null;           // 다음에 다시 올리면 재생. 오디오 요소는 재사용(잠금 유지)
    }
    /* 끌어 놓기 (pointer 이벤트: 마우스·터치 공통) — 턴테이블 위에 놓으면 그 곡 재생 */
    notes.forEach((el, i) => {
      el.style.touchAction = 'none';
      el.addEventListener('pointerdown', e => {
        if (e.button && e.button !== 0) return;
        e.preventDefault();
        const it = items[i];
        prime(it);                 // 모바일: 드래그 시작(사용자 동작) 때 오디오 잠금을 풀어 둔다 → 드롭 시 자동재생
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        if (it.cover) ghost.style.backgroundImage = `url("${img(it.cover)}")`; else ghost.textContent = '♪';
        document.body.appendChild(ghost);
        let over = false, moved = false;
        const x0 = e.clientX, y0 = e.clientY;
        const move = ev => {
          if (Math.abs(ev.clientX - x0) > 4 || Math.abs(ev.clientY - y0) > 4) moved = true;
          ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
          const pr = tt.getBoundingClientRect();
          over = ev.clientX > pr.left - 24 && ev.clientX < pr.right + 24 && ev.clientY > pr.top - 24 && ev.clientY < pr.bottom + 24;
          deck.classList.toggle('over', over);
        };
        const up = () => {
          window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
          ghost.remove(); deck.classList.remove('over');
          if (over) load(i, true);   // 판 위에 놓았을 때만 재생 (그냥 클릭으로는 재생하지 않는다 — 대표 지시)
          else if (!deck.classList.contains('played')) { try { audio.pause(); } catch (e) {} }   // 판에 못 올렸고 재생 중도 아니면 prime 으로 물린 소리 정리
        };
        move(e);
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      });
    });

    /* '앨범을 판에 올리는' 사용법 시연: 오선지 위 첫 앨범에서 앨범 크기로 떠올라 판(레코드) 위로 작아지며 안착.
       판·앨범은 스크롤에 따라 상대 위치가 바뀌므로 매 회 위치를 다시 잰다. 판이 화면에 보일 때만 돈다. */
    if (demoEl) {
      const demoGeom = () => {
        const rec = tt.getBoundingClientRect();
        if (!rec.width) return null;
        const dw = rec.width * 0.26;                                                    // demo 조각의 기본 폭
        const dcx = rec.left + rec.width * 0.83, dcy = rec.top + rec.height * 0.73;     // demo 정지 중심(left70%/top60% + 26%의 절반)
        const rcx = rec.left + rec.width * 0.5,  rcy = rec.top + rec.height * 0.5;      // 판 중심(도착)
        let acx, acy, ss = 1.15;
        const disc = notes[0] && (notes[0].querySelector('.disc') || notes[0]);
        const a = disc && disc.getBoundingClientRect();
        if (a && a.width && a.top > rcy + rec.height * 0.28) {                          // 첫 앨범이 판 아래(정상 배치)일 때 그 앨범에서 시작
          acx = a.left + a.width / 2; acy = a.top + a.height / 2;
          ss = clamp(a.width / dw, 0.85, 2.6);                                          // 시작 크기 = 실제 앨범 크기
        } else { acx = dcx - rec.width * 0.12; acy = rcy + rec.height * 1.05; }         // 못 찾으면 판 아래(오선지 쪽)에서 시작
        return { sx: acx - dcx, sy: acy - dcy, ex: rcx - dcx, ey: rcy - dcy, ss };
      };
      let demoOn = false, demoBusy = false;
      const runDemo = () => {
        if (!demoOn || demoBusy || deck.classList.contains('played') || !document.body.contains(demoEl)) return;
        const g = demoGeom();
        if (!g) { setTimeout(runDemo, 400); return; }
        const mx = g.sx + (g.ex - g.sx) * 0.5, my = g.sy + (g.ey - g.sy) * 0.46 - Math.abs(g.sy - g.ey) * 0.05;
        const ms = Math.max(0.6, g.ss * 0.55);
        try {
          demoBusy = true;
          const anim = demoEl.animate([
            { transform: `translate(${g.sx}px, ${g.sy}px) scale(${g.ss}) rotate(-3deg)`, opacity: 0, offset: 0 },
            { transform: `translate(${g.sx}px, ${g.sy}px) scale(${g.ss}) rotate(-3deg)`, opacity: 1, offset: .16, easing: 'cubic-bezier(.3,0,.3,1)' },   // 앨범 위에 나타나 살짝 떠오른다
            { transform: `translate(${mx}px, ${my}px) scale(${ms}) rotate(-9deg)`, opacity: 1, offset: .56, easing: 'cubic-bezier(.5,0,.35,1)' },        // 판 쪽으로 올라가며
            { transform: `translate(${g.ex}px, ${g.ey}px) scale(.4) rotate(-15deg)`, opacity: 1, offset: .87 },                                          // 판 위에 안착(작아짐)
            { transform: `translate(${g.ex}px, ${g.ey}px) scale(.3) rotate(-15deg)`, opacity: 0, offset: 1 }
          ], { duration: 2800 });
          anim.onfinish = () => { demoBusy = false; if (demoOn && !deck.classList.contains('played')) setTimeout(runDemo, 650); };
          anim.oncancel = () => { demoBusy = false; };
        } catch (e) { demoBusy = false; }
      };
      try {
        const io = new IntersectionObserver(es => { demoOn = es.some(en => en.isIntersecting); if (demoOn) runDemo(); }, { threshold: 0.2 });
        io.observe(tt);
      } catch (e) { demoOn = true; requestAnimationFrame(() => requestAnimationFrame(runDemo)); }
    }
    return { stop };
  }

  /* PRODUCER: 글자가 열리면 KMR 로스터처럼 큰 사진 타일이 차례로 올라온다 (대표 지시: 프로듀서는 크게) */
  function gridScene(id, items) {
    const sec = $('#' + id);
    if (!sec) return;
    if (!items || !items.length) { sec.hidden = true; return; }
    const root = $('.staffs', sec);
    root.className = 'roster';
    /* 한 줄에 5명까지, 넘으면 다음 줄로 (대표 지시).
       타일은 줄이지 않는다 — 두 줄이 화면을 넘으면 스크롤에 따라 위로 올라가며 아랫줄이 보인다. */
    const cols = Math.min(items.length, 5);
    root.style.setProperty('--cols', cols);
    const win = document.createElement('div');
    win.className = 'rosterwin';
    sec.insertBefore(win, root); win.appendChild(root);
    /* 두 줄 이상이면 위에서부터 쌓고 스크롤로 내려 본다. 이 판정은 사람 수로 한 번만 한다 —
       높이를 재서 정하면 '줄였다 늘렸다'가 매 프레임 뒤집힌다(레이아웃이 판정에 다시 영향을 준다). */
    if (items.length > cols) sec.classList.add('tall');
    root.innerHTML = items.map(p => {
      const tag = p.instagram ? 'a' : 'div';
      return `<${tag} class="tile" ${p.instagram ? `href="${esc(p.instagram)}" target="_blank" rel="noopener"` : ''}>
        ${p.photo ? `<img src="${img(p.photo)}" alt="${esc(p.name)}" data-ini="${ini(p.name)}" loading="lazy">` : `<div class="noimg">${ini(p.name)}</div>`}
        <div class="tl"><b>${esc(p.name)}</b><span>${esc(p.role || p.ko || '')}</span></div>
      </${tag}>`;
    }).join('');
    /* 사진 파일이 아직 없으면 깨진 그림 대신 이름 머리글자 칸으로 바꾼다 */
    $$('img', root).forEach(im => { im.onerror = () => {
      const d = document.createElement('div'); d.className = 'noimg'; d.textContent = im.dataset.ini || '?'; im.replaceWith(d);
    }; });
    const tiles = [...root.children];
    const t = $('.bigword .t', sec), b = $('.bigword .b', sec);
    reg($('#hero'), p => {
      const s = .88 + .12 * range(p, 0, .18);
      const o = ease(range(p, .2, .46));
      t.style.transform = `translate(-50%,-50%) translateY(${-o * 44}vh) scale(${s})`;
      b.style.transform = `translate(-50%,-50%) translateY(${o * 44}vh) scale(${s})`;
      t.style.opacity = b.style.opacity = (p < .01 ? 0 : 1) * (1 - .88 * o);
      root.style.opacity = range(p, .3, .5);
      tiles.forEach((el, i) => el.classList.toggle('on', p >= .42 + .4 * (i / Math.max(1, tiles.length))));
      /* 한 화면을 넘치는 만큼만 위로 밀어 올려 아랫줄을 보여 준다 (넘치지 않으면 0) */
      const max = Math.max(0, root.offsetHeight - win.clientHeight);
      root.style.transform = `translateY(${(-max * ease(range(p, .84, 1))).toFixed(1)}px)`;
    }, WORLD.producer[0], WORLD.producer[1]);
  }
  gridScene('producer', S.producers);
  staffScene('songs', S.songs, 'songs');

  /* ---------- 스크롤 진행도 → 장면 ---------- */
  function measure() {
    pins.forEach(o => {
      const r = o.sec.getBoundingClientRect();
      o.top = r.top + scrollY;
      o.len = Math.max(1, o.sec.offsetHeight - innerHeight);
    });
  }
  let ticking = false;
  function frame() {
    ticking = false;
    const y = scrollY;
    pins.forEach(o => {
      const p = clamp((y - o.top) / o.len, 0, 1);
      if (p !== o.p) { o.p = p; o.fn(p); }
    });
  }
  const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', kick, { passive: true });
  let rT = 0;
  addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      staffHolders.forEach(h => {
        if (h.deck) h.deck.stop();
        h.notes = buildStaves(h.root, h.items, h.kind); groupRows(h);
        if (h.kind === 'songs') h.deck = setupDeck(h.root.closest('.staff-sec'), h.items, h.notes);   // 다시 그리면 턴테이블도 다시
      });
      measure(); pins.forEach(o => { o.p = -1; }); frame();
    }, 150);
  }, { passive: true });
  addEventListener('load', () => { measure(); pins.forEach(o => { o.p = -1; }); frame(); });
  measure(); frame();
  // 점검용: 콘솔에서 __dblv.scene('producer', .8) 처럼 장면 진행도를 직접 넣어볼 수 있다
  window.__dblv = { scene(id, p) {
    const r = WORLD[id]; const wp = r ? r[0] + (r[1] - r[0]) * p : p;
    pins.filter(x => x.sec.id === 'hero').forEach(o => { o.p = wp; o.fn(wp); });
  }, WORLD };

  /* ---------- ABOUT ---------- */
  const ab = S.about || {};
  if ($('#about-head') && ab.headline) $('#about-head').textContent = ab.headline;
  if ($('#about-body')) $('#about-body').innerHTML = (ab.body || []).map(p => `<p class="lead reveal">${esc(p)}</p>`).join('');
  const facts = $('#facts');
  if (facts) {
    const songs = S.songs || [];
    const artists = new Set(songs.map(s => s.artist).filter(Boolean));
    const rows = [];
    if (c.founded) rows.push({ b: c.founded, s: 'FOUNDED' });
    if (ceo.name) rows.push({ b: `${ceo.name}${ceo.en ? ' (' + ceo.en + ')' : ''}`, s: 'CEO', ko: true });
    if (songs.length) rows.push({ b: songs.length + '+', s: 'SONGS' });
    if (artists.size) rows.push({ b: artists.size + '+', s: 'ARTISTS' });
    if (c.business) rows.push({ b: c.business, s: 'BUSINESS', ko: true });
    facts.innerHTML = rows.map((x, i) => `<div class="reveal d${i % 4}"><b class="${x.ko ? 'ko' : ''}">${esc(x.b)}</b><span>${esc(x.s)}</span></div>`).join('');
  }

  /* ---------- CONTACT ---------- */
  const ICON = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>',
    tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    yt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/></svg>',
  };
  const ARROW = '<svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 13 13 3M5 3h8v8"/></svg>';
  const card = (ic, k, v, href) => {
    const ext = /^https?:/.test(href || '');
    const open = href ? `<a class="ccard" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>` : '<div class="ccard static">';
    return `${open}<span class="ic">${ICON[ic]}</span><span class="tx"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></span>${href ? ARROW : ''}${href ? '</a>' : '</div>'}`;
  };
  const instas = () => { const v = c.instagram; if (!v) return []; return (Array.isArray(v) ? v : [{ label: '', url: v }]).filter(g => g && g.url); };
  const handle = url => String(url).replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/[/?].*$/, '');
  const cl = $('#contact-list');
  if (cl) {
    const rows = [];
    if (c.email) rows.push(card('mail', 'MAIL', c.email, 'mailto:' + c.email));
    instas().forEach(g => rows.push(card('insta', 'INSTAGRAM' + (g.label ? ' · ' + g.label : ''), '@' + handle(g.url), g.url)));
    if (c.youtube) rows.push(card('yt', 'YOUTUBE', c.youtube.replace(/^https?:\/\/(www\.)?/, ''), c.youtube));
    if (c.tel) rows.push(card('tel', 'TEL', c.tel, 'tel:' + c.tel.replace(/[^0-9+]/g, '')));
    if (c.address) rows.push(card('pin', 'ADDRESS', c.address, ''));
    cl.innerHTML = rows.join('');
    /* 카드 클릭을 확실하게 — 화면 전환(스크롤 잠금 구간)에서 앵커 클릭이 씹히는 일이 없도록
       'Send a mail' 버튼과 똑같이 눌리게 직접 이동시킨다. (mail·tel 은 현재 창, 외부 링크는 새 창) */
    cl.addEventListener('click', e => {
      const a = e.target.closest('.ccard'); if (!a) return;
      const href = a.getAttribute('href'); if (!href) return;
      e.preventDefault();
      if (/^https?:/i.test(href)) window.open(href, '_blank', 'noopener');
      else window.location.href = href;   // mailto: · tel:
    });
  }
  const mb = $('#mail-big');
  if (mb) { if (c.email) mb.href = 'mailto:' + c.email; else mb.hidden = true; }
  const fl = $('#foot-links');
  if (fl) {
    const links = [];
    instas().forEach(g => links.push(`<a href="${esc(g.url)}" target="_blank" rel="noopener">Instagram${g.label ? ' · ' + esc(g.label) : ''}</a>`));
    if (c.youtube) links.push(`<a href="${esc(c.youtube)}" target="_blank" rel="noopener">YouTube</a>`);
    if (c.email) links.push(`<a href="mailto:${esc(c.email)}">Mail</a>`);
    fl.innerHTML = links.join('');
  }
  // 메뉴: 숨겨진 장면의 링크는 지운다
  $$('#gnb a, #mobile-menu a').forEach(a => {
    const id = (a.getAttribute('href') || '').replace('#', '');
    const sec = id && document.getElementById(id);
    if (sec && sec.hidden) a.remove();
  });

  /* ---------- 헤더 / 맨 위로 / 모바일 메뉴 ---------- */
  const header = $('#header'), top = $('#top-btn');
  const onScroll = () => {
    const y = scrollY || 0;
    header.classList.toggle('scrolled', y > 40);
    if (top) top.classList.toggle('show', y > innerHeight);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (top) top.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
  const ham = $('#ham');
  if (ham) {
    ham.onclick = () => document.body.classList.toggle('menu-open');
    $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  }

  /* ---------- 등장 ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- 옛 서비스워커 정리 ----------
     예전에 협업앱이 '/' 범위로 등록해둔 서비스워커가 남아 있으면 홈페이지가 옛 화면으로 보인다.
     /app 범위는 협업앱이 쓰므로 건드리지 않는다. */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => {
      let cleaned = false;
      rs.forEach(r => { const scope = (r.scope || '').replace(location.origin, ''); if (!scope.startsWith('/app')) { r.unregister(); cleaned = true; } });
      if (cleaned && 'caches' in window) {
        caches.keys().then(ks => Promise.all(ks.filter(k => !/^dblv-v|^dblv-auth/.test(k)).map(k => caches.delete(k)))).then(() => {
          if (!sessionStorage.getItem('dblv_sw_cleaned')) { sessionStorage.setItem('dblv_sw_cleaned', '1'); location.reload(); }
        });
      }
    }).catch(() => {});
  }
})();

/* ---------- 베끼기 억제 ----------
   완전한 차단은 웹에서 불가능하다(화면을 그리려면 브라우저가 코드를 받아야 한다).
   대신 '가볍게 가져가는 길'을 막는다: 사진·3D 화면에서 우클릭 저장, 끌어서 복사.
   글자 선택·확대·읽기는 그대로 둔다(접근성). 배포본은 tools/build-dist.mjs 가 주석을 걷고 압축한다. */
(() => {
  const guard = e => { if (e.target && e.target.closest && e.target.closest('img, canvas, video, picture')) e.preventDefault(); };
  document.addEventListener('contextmenu', guard);
  document.addEventListener('dragstart', guard);
})();
