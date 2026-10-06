/* =====================================================================
   공연장 입장 3D (three.js)
   · 로고 문이 열리면 관객 사이 통로를 따라 대표 캐릭터(드레드·선글라스·후드)가 무대를 향해 걸어 들어간다.
   · 카메라는 캐릭터 뒤를 따라간다. 무대 위엔 DBLV 로고 백드롭과 흔들리는 조명 빔, 객석엔 관객 실루엣과 안개.
   · setProgress(0~1): 스크롤 진행도 → 캐릭터 위치·걸음. setDim(0~1): 다음 장면(PRODUCER/SONGS)이 열릴 때 어둡게.
   · WebGL 이 안 되면 mount 가 실패하고 화면은 로고·안내만으로 진행된다.
   ===================================================================== */
window.DBLV3D = {
  async mount(host, opts = {}) {
    const THREE = await import('three');
    const W = () => host.clientWidth || 300, H = () => host.clientHeight || 300;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W(), H());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'three-cv';

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06060c, .028);
    const camera = new THREE.PerspectiveCamera(44, W() / H(), .1, 120);

    /* ---------- 재질 ---------- */
    const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .7, metalness: 0 }, o));
    const skin = M(0xf1c7a8, { roughness: .5 });
    const cloth = M(0x1d1636, { roughness: .92 });
    const jeans = M(0x14102a, { roughness: .95 });
    const hair = M(0x110b1a, { roughness: .6 });
    const white = M(0xf6f3ff, { roughness: .35 });
    const violet = M(0x8c6bff, { roughness: .3, emissive: 0x3a2a80, emissiveIntensity: .4 });
    const gold = M(0xe9d77a, { metalness: 1, roughness: .22 });
    const lens = new THREE.MeshPhysicalMaterial({ color: 0x0b0914, roughness: .06, metalness: .25, clearcoat: 1, clearcoatRoughness: .04 });
    const dark = M(0x06050a, { roughness: .8 });

    const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    };
    const cap = (a, b, r, mat, parent) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const d = B.clone().sub(A), len = d.length();
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 5, 12), mat);
      m.position.copy(A.clone().add(B).multiplyScalar(.5));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      m.castShadow = m.receiveShadow = true; parent.add(m); return m;
    };

    /* ---------- 공연장: 바닥·무대·백드롭·조명 빔·관객·안개 ---------- */
    const STAGE_Z = -34;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 120), M(0x0d0d13, { roughness: .28, metalness: .35 }));
    floor.rotation.x = -Math.PI / 2; floor.position.z = -20; floor.receiveShadow = true; scene.add(floor);
    // 통로(캐릭터가 걷는 길) — 살짝 밝은 띠
    const aisle = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 70), M(0x16161e, { roughness: .35, metalness: .2 }));
    aisle.rotation.x = -Math.PI / 2; aisle.position.set(0, .005, -8); aisle.receiveShadow = true; scene.add(aisle);
    add(new THREE.BoxGeometry(30, 1.3, 10), M(0x141418, { roughness: .6 }), 0, .65, STAGE_Z - 2);
    add(new THREE.BoxGeometry(30.4, .12, 10.4), M(0x2a2a33, { roughness: .4, metalness: .3 }), 0, 1.32, STAGE_Z - 2);
    // 백드롭: 보라 글로우 판 + DBLV 로고
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(26, 11), new THREE.MeshBasicMaterial({ color: 0x2a1a5a }));
    glow.position.set(0, 6.8, STAGE_Z - 7.2); scene.add(glow);
    const glow2 = new THREE.Mesh(new THREE.PlaneGeometry(22, 7), new THREE.MeshBasicMaterial({ color: 0x8c6bff, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow2.position.set(0, 6.8, STAGE_Z - 7.1); scene.add(glow2);
    try {
      const tex = await new THREE.TextureLoader().loadAsync('assets/dblv-white.png?v=2');
      tex.colorSpace = THREE.SRGBColorSpace;
      const logo = new THREE.Mesh(new THREE.PlaneGeometry(14, 14 * 325 / 1200), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      logo.position.set(0, 6.9, STAGE_Z - 7); scene.add(logo);
    } catch (e) { /* 로고 없이 진행 */ }
    // 트러스 위 조명 + 눈에 보이는 빔(원뿔)
    scene.add(new THREE.HemisphereLight(0x7a6aa8, 0x050508, .35));
    const beams = [];
    const COLS = [0x8c6bff, 0xe44dff, 0xffffff, 0x4fc3ff, 0x8c6bff, 0xffb3f0, 0x9d84ff];
    const coneGeo = new THREE.ConeGeometry(3.2, 18, 28, 1, true); coneGeo.translate(0, -9, 0);   // 꼭짓점을 원점에 (조명 위치에서 아래로 뻗는다)
    COLS.forEach((c, i) => {
      const x = -12 + i * 4;
      const sp = new THREE.SpotLight(c, 320, 46, .34, .6, 1.1);
      sp.position.set(x, 12.5, STAGE_Z + 4); sp.target.position.set(x * .3, 0, STAGE_Z - 3); scene.add(sp); scene.add(sp.target);
      const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .065, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      cone.position.set(x, 12.5, STAGE_Z + 4); scene.add(cone);
      beams.push({ cone, sp, base: x, i });
    });
    // 백드롭 위 라이트 바(맥동) + 트러스
    const bars = [];
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .22), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xe44dff : 0x8c6bff, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
      b.position.set(-10 + i * 2.5, 12.2, STAGE_Z - 6.9); scene.add(b); bars.push(b);
    }
    add(new THREE.BoxGeometry(32, .25, .25), M(0x2b2b33, { metalness: .7, roughness: .3 }), 0, 12.8, STAGE_Z + 4);
    const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 10, 6); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { near: 1, far: 40, left: -8, right: 8, top: 8, bottom: -8 }); scene.add(key);
    const follow = new THREE.PointLight(0x8c6bff, 30, 12); scene.add(follow);
    // 관객 실루엣 (통로는 비워 둔다)
    const crowdN = 240;
    const crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.24, .9, 4, 8), M(0x0a0a10, { roughness: .9 }), crowdN);
    const crowdPos = [];
    for (let i = 0; i < crowdN; i++) {
      let x; do { x = (Math.random() - .5) * 30; } while (Math.abs(x) < 1.7);
      const z = -3 - Math.random() * 27;
      crowdPos.push({ x, z, ph: Math.random() * 6.28, h: .9 + Math.random() * .3, arm: Math.random() < .35 });
    }
    crowd.castShadow = true; scene.add(crowd);
    for (let i = 0; i < crowdN; i++) crowd.setColorAt(i, new THREE.Color().setHSL(.7 + Math.random() * .1, .3, .05 + Math.random() * .08));
    crowd.instanceColor.needsUpdate = true;
    // 관객이 든 휴대폰 불빛
    const phones = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0xdfe6ff }), crowdN);
    scene.add(phones);
    const arms = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.06, .6, 3, 6), M(0x0a0a10), crowdN);
    scene.add(arms);
    const dummy = new THREE.Object3D();
    // 안개 입자
    const hazeN = 900, hp = new Float32Array(hazeN * 3);
    for (let i = 0; i < hazeN; i++) { hp[i * 3] = (Math.random() - .5) * 34; hp[i * 3 + 1] = Math.random() * 9; hp[i * 3 + 2] = -Math.random() * 42 + 4; }
    const hazeG = new THREE.BufferGeometry(); hazeG.setAttribute('position', new THREE.BufferAttribute(hp, 3));
    const haze = new THREE.Points(hazeG, new THREE.PointsMaterial({ color: 0xc9bfff, size: .11, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(haze);

    /* ---------- 통로 옆 3D 간판(부스): PRODUCER · SONGS — 캐릭터가 닿으면 그 페이지가 열린다 ---------- */
    const Z0 = 4, Z1 = STAGE_Z + 6;   // 캐릭터 출발/도착 z
    const signTex = (label) => {
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256;
      const cx = cv.getContext('2d');
      cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillRect(0, 0, 1024, 256);
      // 긴 이름(DISCOGRAPHY)도 간판 폭 안에 들어가도록 글자 크기를 줄여 맞춘다
      let size = 150;
      const font = n => '900 ' + n + 'px "Be Vietnam Pro", "Pretendard", sans-serif';
      cx.font = font(size);
      while (cx.measureText(label).width > 940 && size > 60) { size -= 6; cx.font = font(size); }
      cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(label, 512, 138);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
    };
    const stops = (opts.stops || []).map(st => {
      const z = Z0 + (Z1 - Z0) * st.at, x = (st.side || 1) * 3.6;
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -(st.side || 1) * .35; scene.add(g);
      // 받침대 + 기둥 + 간판(뒤판 · 글자 · 보라 테두리 빛)
      add(new THREE.BoxGeometry(2.4, .3, 2.4), M(0x101016, { roughness: .6 }), 0, .15, 0, g);
      add(new THREE.CylinderGeometry(.08, .1, 2.6, 12), M(0x2a2a33, { metalness: .6, roughness: .3 }), 0, 1.6, 0, g);
      add(new THREE.BoxGeometry(5.4, 1.6, .28), M(0x15151c, { roughness: .5, metalness: .2 }), 0, 3.3, 0, g);
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 1.9), new THREE.MeshBasicMaterial({ color: 0x8c6bff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false }));
      edge.position.set(0, 3.3, -.16); g.add(edge);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), new THREE.MeshBasicMaterial({ map: signTex(st.label), transparent: true }));
      face.position.set(0, 3.3, .15); g.add(face);
      const lamp = new THREE.PointLight(0x8c6bff, 18, 9); lamp.position.set(0, 4.4, .8); g.add(lamp);
      // 통로 쪽 바닥의 빛 고리 (여기서 열린다는 표시)
      const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.15, 40), new THREE.MeshBasicMaterial({ color: 0x8c6bff, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0, .01, z); scene.add(ring);
      return { g, ring, z, at: st.at, side: st.side || 1, key: st.key };
    });
    /* (무대 위 CONTACT 간판은 대표 지시로 없앰 — 무대에는 연락처 패널만 뜬다) */

    /* ---------- 캐릭터: 관절(엉덩이·무릎·어깨·팔꿈치)이 있는 걷는 사람 ---------- */
    const ch = new THREE.Group(); scene.add(ch);
    const hips = new THREE.Group(); hips.position.y = 1.0; ch.add(hips);
    const torso = cap([0, 0, 0], [0, .62, 0], .3, cloth, hips); torso.scale.z = .75;
    const hood = add(new THREE.SphereGeometry(.36, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), cloth, 0, .55, -.08, hips); hood.scale.set(1, .5, .9);
    const chain = add(new THREE.TorusGeometry(.2, .016, 8, 40, Math.PI), gold, 0, .58, .2, hips); chain.rotation.set(-.35, 0, Math.PI);
    add(new THREE.OctahedronGeometry(.045), gold, 0, .38, .25, hips);
    const neck = cap([0, .62, 0], [0, .78, 0], .08, skin, hips);
    const head = new THREE.Group(); head.position.set(0, 1.02, 0); hips.add(head);
    add(new THREE.SphereGeometry(.27, 28, 20), skin, 0, 0, 0, head);
    add(new THREE.BoxGeometry(.48, .12, .07), lens, 0, .03, .24, head);
    add(new THREE.SphereGeometry(.04, 10, 8), skin, 0, -.05, .27, head);
    add(new THREE.SphereGeometry(.23, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), hair, 0, .12, -.02, head).scale.set(1.15, .7, 1.1);
    for (let i = 0; i < 14; i++) {
      const th = (40 + i * (280 / 13)) * Math.PI / 180, sx = Math.sin(th), sz = Math.cos(th), len = .34 + ((i * 7) % 4) * .06;
      cap([sx * .2, .16, sz * .2], [sx * .34, .16 - len, sz * .34], .032, hair, head);
      if (i % 3 === 0) add(new THREE.SphereGeometry(.035, 10, 8), i % 2 ? gold : violet, sx * .34, .16 - len - .02, sz * .34, head);
    }
    const legs = {}, armsG = {};
    for (const s of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(s * .15, .02, 0); hips.add(hip);
      cap([0, 0, 0], [0, -.46, 0], .11, jeans, hip);
      const knee = new THREE.Group(); knee.position.set(0, -.46, 0); hip.add(knee);
      cap([0, 0, 0], [0, -.42, 0], .09, jeans, knee);
      const shoe = add(new THREE.SphereGeometry(.13, 16, 12), white, 0, -.5, .06, knee); shoe.scale.set(1, .55, 1.6);
      add(new THREE.BoxGeometry(.24, .04, .38), violet, 0, -.56, .07, knee);
      legs[s] = { hip, knee };
      const sh = new THREE.Group(); sh.position.set(s * .36, .56, 0); hips.add(sh);
      cap([0, 0, 0], [s * .06, -.34, 0], .09, cloth, sh);
      const el = new THREE.Group(); el.position.set(s * .06, -.34, 0); sh.add(el);
      cap([0, 0, 0], [0, -.3, .06], .08, cloth, el);
      add(new THREE.SphereGeometry(.085, 14, 10), skin, 0, -.34, .08, el);
      armsG[s] = { sh, el };
    }

    /* ---------- 진행도 → 장면 ---------- */
    let prog = 0, dim = 0, running = true, raf = 0, t = 0, phase = 0, lastProg = 0, bobAmt = 0, lookX = 0;
    ch.visible = false;   // 1인칭: 내 몸은 보이지 않는다
    const clock = new THREE.Clock();
    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), .05);
      t += dt;
      /* 걸음: 스크롤이 진행되는 만큼 걷고(진행도 차이), 멈추면 제자리에서 숨만 쉰다 */
      const dz = (prog - lastProg) * (Z0 - Z1); lastProg = prog;
      phase += Math.abs(dz) * 2.6;
      const z = Z0 + (Z1 - Z0) * prog;
      ch.position.set(0, 0, z);
      const sw = Math.sin(phase), sw2 = Math.sin(phase + Math.PI);
      legs[1].hip.rotation.x = sw * .7; legs[-1].hip.rotation.x = sw2 * .7;
      legs[1].knee.rotation.x = Math.max(0, -Math.sin(phase - .9)) * 1.1; legs[-1].knee.rotation.x = Math.max(0, -Math.sin(phase + Math.PI - .9)) * 1.1;
      armsG[1].sh.rotation.x = sw2 * .55; armsG[-1].sh.rotation.x = sw * .55;
      armsG[1].el.rotation.x = -.35 - Math.max(0, sw2) * .3; armsG[-1].el.rotation.x = -.35 - Math.max(0, sw) * .3;
      hips.position.y = 1.0 + Math.abs(Math.sin(phase)) * .045 + Math.sin(t * 1.4) * .01;
      hips.rotation.z = Math.sin(phase) * .04;   // (몸 방향은 아래에서 정한다: 기본은 무대(-z) 쪽)
      head.rotation.y = Math.sin(t * .7) * .12; head.rotation.x = Math.sin(t * .9) * .04;
      let turn = 0;
      stops.forEach(st => {
        const near = Math.max(0, 1 - Math.abs(prog - st.at) / .05);   // 부스 앞 0~1
        st.ring.material.opacity = .35 + .35 * Math.abs(Math.sin(t * 2.2)) * (1 + near);
        st.ring.scale.setScalar(1 + near * .15);
        turn += near * st.side * .9;
      });
      hips.rotation.y = Math.PI + turn;   // 부스 쪽으로 몸을 돌려 본다
      /* 1인칭: 대표의 눈높이에서 통로를 걸어 들어간다 (걸을 때만 머리가 흔들리고, 부스 앞에선 그쪽을 본다) */
      const moving = Math.min(1, Math.abs(dz) * 60);
      bobAmt += (moving - bobAmt) * .08;
      const bob = Math.sin(phase * 2) * .035 * bobAmt, sway = Math.sin(phase) * .05 * bobAmt;
      camera.position.set(sway + Math.sin(t * .4) * .04, 1.62 + bob + Math.sin(t * .9) * .015, z);
      lookX += (turn * 3.2 - lookX) * .06;
      /* 무대 도착(진행도 .9~1): 시선이 무대 화면(백드롭)으로 올라가고 화면이 밝아진다 */
      const arrive = Math.max(0, Math.min(1, (prog - .9) / .1));
      camera.lookAt(lookX * (1 - arrive), 1.55 + arrive * 4.2 + Math.sin(t * .6) * .03, z - 10 - arrive * 3);
      glow2.material.opacity = .25 + arrive * .3;
      follow.position.set(1.2, 2.4, z + .6);
      /* 조명 빔 흔들림 · 관객 들썩임 · 안개 흐름 */
      beams.forEach(b => {
        const rz = Math.sin(t * .55 + b.i * .9) * .42, rx = Math.cos(t * .4 + b.i * 1.3) * .3;
        b.cone.rotation.set(rx, 0, rz);
        b.sp.target.position.set(b.base + Math.sin(t * .55 + b.i * .9) * 9, 0, STAGE_Z - 3 + Math.cos(t * .4 + b.i * 1.3) * 10);
      });
      bars.forEach((b, i) => { b.material.opacity = .35 + .55 * Math.abs(Math.sin(t * 2.4 + i * .7)); });
      for (let i = 0; i < crowdN; i++) {
        const c = crowdPos[i];
        const bob = Math.abs(Math.sin(t * 2.2 + c.ph)) * .12;
        dummy.position.set(c.x, .45 + bob, c.z); dummy.scale.set(1, c.h, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
        crowd.setMatrixAt(i, dummy.matrix);
        if (c.arm) {
          const ay = 1.25 + bob + Math.sin(t * 3 + c.ph) * .08;
          dummy.position.set(c.x + .18, ay, c.z); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, -.2); dummy.updateMatrix(); arms.setMatrixAt(i, dummy.matrix);
          dummy.position.set(c.x + .24, ay + .34, c.z); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); phones.setMatrixAt(i, dummy.matrix);
        } else { dummy.position.set(0, -10, 0); dummy.updateMatrix(); arms.setMatrixAt(i, dummy.matrix); phones.setMatrixAt(i, dummy.matrix); }
      }
      crowd.instanceMatrix.needsUpdate = true; arms.instanceMatrix.needsUpdate = true; phones.instanceMatrix.needsUpdate = true;
      haze.rotation.y = Math.sin(t * .05) * .05; haze.position.x = Math.sin(t * .2) * .6;
      renderer.render(scene, camera);
    };
    const start = () => { if (!running) { running = true; clock.getDelta(); loop(); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); }).observe(host);
    new IntersectionObserver(es => { es[0].isIntersecting ? start() : stop(); }).observe(host);
    host.appendChild(renderer.domElement);
    loop();
    return {
      setProgress(p) { prog = Math.max(0, Math.min(1, p)); },
      setDim(d) { dim = d; renderer.domElement.style.opacity = String(1 - .9 * Math.max(0, Math.min(1, d))); },
      stop,
    };
  },
};
