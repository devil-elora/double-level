/* =====================================================================
   대표(CEO) 3D 캐릭터 — three.js 로 실제 3D 조명·그림자·반사로 그린다.
   두 가지 모드:
   ① 모델 파일(.glb) 모드: site-data.js 의 ceo.model(또는 주소 ?model=…) 에 적힌 사람 모델을 불러와
      DBLV 스피커 박스에 앉히고(다리 뼈를 굽힘), 오른팔을 들어 흔들고, 머리가 마우스를 따라간다.
      (Avaturn·Mixamo 계열 표준 뼈 이름을 쓴 GLB 면 된다: Hips/Spine/Head/RightArm/RightForeArm/LeftUpLeg …)
   ② 기본 모드: 모델이 없거나 못 불러오면 도형을 조립한 캐릭터(드레드·선글라스·후드·금 체인)를 그린다.
   · WebGL 이 안 되는 기기에서는 그림(SVG) 캐릭터가 그대로 남는다.
   · three 는 index.html 의 importmap 으로 연결된다 ('three', 'three/addons/').
   ===================================================================== */
window.DBLV3D = {
  async mount(host, opts = {}) {
    const THREE = await import('three');
    const BW = false;   // 흑백 톤에서도 캐릭터 조명·소품은 컬러 그대로 (대표 지시: 바탕만 흑백, 나머지는 컬러)
    const W = () => host.clientWidth || 300, H = () => host.clientHeight || 380;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W(), H());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'three-cv';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, W() / H(), .1, 50);
    camera.position.set(0, 1.45, 6.6);
    camera.lookAt(0, 1.25, 0);

    /* ---- 조명: 키(그림자) + 보라 림 + 핑크 필 + 하늘빛 ---- */
    scene.add(new THREE.HemisphereLight(0xd8ceff, 0x1a1430, .9));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 5;
    Object.assign(key.shadow.camera, { near: 1, far: 20, left: -3, right: 3, top: 4.5, bottom: -1 });
    scene.add(key);
    const rim = new THREE.PointLight(BW ? 0xffffff : 0x8c6bff, 34, 16); rim.position.set(-3.5, 2.6, -2); scene.add(rim);
    const fill = new THREE.PointLight(BW ? 0xbbbbbb : 0xe44dff, 14, 16); fill.position.set(3.2, 1.4, -2.5); scene.add(fill);
    const front = new THREE.PointLight(0xffffff, 6, 12); front.position.set(0, 2.2, 4); scene.add(front);

    /* ---- 재질 ---- */
    const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .7, metalness: 0 }, o));
    const skin = M(0xf1c7a8, { roughness: .5 });
    const cloth = M(0x1d1636, { roughness: .92 });
    const jeans = M(0x14102a, { roughness: .95 });
    const hair = M(0x110b1a, { roughness: .6 });
    const white = M(0xf6f3ff, { roughness: .35 });
    const violet = BW ? M(0xd9d9d9, { roughness: .3, emissive: 0x444444, emissiveIntensity: .4 })
                      : M(0x8c6bff, { roughness: .3, emissive: 0x3a2a80, emissiveIntensity: .4 });
    const gold = M(0xe9d77a, { metalness: 1, roughness: .22 });
    const lens = new THREE.MeshPhysicalMaterial({ color: 0x0b0914, roughness: .06, metalness: .25, clearcoat: 1, clearcoatRoughness: .04 });
    const boxM = M(0x100c1c, { roughness: .55, metalness: .1 });
    const dark = M(0x06050a, { roughness: .8 });
    const lips = M(0xa85a48, { roughness: .6 });

    const root = new THREE.Group();
    scene.add(root);
    const add = (geo, mat, x = 0, y = 0, z = 0, parent = root) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    };
    const cap = (a, b, r, mat, parent = root) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const d = B.clone().sub(A), len = d.length();
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), mat);
      m.position.copy(A.clone().add(B).multiplyScalar(.5));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      m.castShadow = m.receiveShadow = true; parent.add(m); return m;
    };
    const canvasText = (txt, w, h, px) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.font = `900 ${px}px "Be Vietnam Pro", "Pretendard", sans-serif`;
      cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(txt, w / 2, h / 2 + 2);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; return tex;
    };

    /* ---- 바닥: 그림자 받는 판 + 빛 원 ---- */
    const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: .55 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.8, 48), new THREE.MeshBasicMaterial({ color: BW ? 0xffffff : 0x8c6bff, transparent: true, opacity: BW ? .08 : .14 }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = .004; scene.add(disc);

    /* ---- 앉은 자리: DBLV 스피커 박스 (두 모드 공통) ---- */
    const BOX_TOP = .95;
    add(new THREE.BoxGeometry(1.5, BOX_TOP, 1.0), boxM, 0, BOX_TOP / 2, 0);
    const cone = add(new THREE.CylinderGeometry(.24, .3, .08, 32), dark, 0, .5, .5); cone.rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(.3, .025, 10, 40), violet, 0, .5, .54);
    add(new THREE.SphereGeometry(.1, 20, 20), M(0x2a2144, { roughness: .4 }), 0, .5, .5);
    const tag = add(new THREE.PlaneGeometry(.5, .12), new THREE.MeshBasicMaterial({ map: canvasText('DBLV', 256, 64, 48), transparent: true, opacity: .8 }), 0, .86, .501);
    tag.castShadow = false;

    /* ================= ① 모델(.glb) 모드 ================= */
    let rig = null;   // { head, head0, fore, fore0 } — 매 프레임 움직일 뼈
    if (opts.model) {
      try {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const gltf = await new GLTFLoader().loadAsync(opts.model);
        const av = gltf.scene;
        av.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
        // 키를 1.75 로 맞추고 발을 바닥(0)에
        const bb = new THREE.Box3().setFromObject(av);
        const s = 1.75 / Math.max(.01, bb.max.y - bb.min.y);
        av.scale.setScalar(s);
        av.position.y = -bb.min.y * s;
        // 뼈 찾기 (mixamorig 접두어·대소문자 무시)
        const bones = {};
        av.traverse(o => { if (o.isBone) bones[o.name.replace(/^mixamorig[:_]?/i, '').toLowerCase()] = o; });
        const B = n => bones[n.toLowerCase()] || null;
        const P = opts.pose || {};   // 각도 미세조정 (site-data.js ceo.pose 로 덮어쓸 수 있다)
        const rot = (n, x, y, z) => { const b = B(n); if (!b) return; if (x) b.rotateX(x); if (y) b.rotateY(y); if (z) b.rotateZ(z); };
        const D = Math.PI / 180;
        // 앉기: 허벅지 앞으로, 무릎 굽히기
        rot('LeftUpLeg',  (P.thigh ?? -85) * D, 0, (P.thighOut ?? 6) * D);
        rot('RightUpLeg', (P.thigh ?? -85) * D, 0, -(P.thighOut ?? 6) * D);
        rot('LeftLeg',    (P.knee ?? 90) * D, 0, 0);
        rot('RightLeg',   (P.knee ?? 90) * D, 0, 0);
        rot('LeftFoot',   (P.foot ?? -10) * D, 0, 0);
        rot('RightFoot',  (P.foot ?? -10) * D, 0, 0);
        // 왼팔은 편하게 내리고, 오른팔은 옆으로 들어 아래팔을 위로 (인사)
        rot('LeftArm',  0, 0, (P.leftArm ?? 65) * D);
        rot('LeftForeArm', 0, 0, (P.leftFore ?? 15) * D);
        rot('RightArm', (P.rightArmX ?? 0) * D, (P.rightArmY ?? 0) * D, (P.rightArm ?? -20) * D);
        rot('RightForeArm', (P.rightForeX ?? 0) * D, (P.rightForeY ?? 0) * D, (P.rightFore ?? -110) * D);
        rot('Spine', (P.spine ?? 6) * D, 0, 0);
        // 엉덩이가 박스 위에 오도록 전체를 옮긴다
        av.updateMatrixWorld(true);
        const hips = B('Hips');
        if (hips) {
          const hp = new THREE.Vector3(); hips.getWorldPosition(hp);
          av.position.y += (BOX_TOP + (P.seat ?? .08)) - hp.y;
          av.position.z += (P.forward ?? .12) - hp.z;
        }
        root.add(av);
        const head = B('Head'), fore = B('RightForeArm');
        rig = { head, head0: head && head.quaternion.clone(), fore, fore0: fore && fore.quaternion.clone() };
        host.dataset.model = 'ok';
      } catch (e) {
        console.warn('[DBLV 3D] 모델을 불러오지 못해 기본 캐릭터를 씁니다:', e && e.message);
        host.dataset.model = 'fail';
      }
    }

    /* ================= ② 기본 모드: 도형 캐릭터 ================= */
    let elbow = null, head = null;
    if (!rig) {
      /* 다리(앉은 자세): 허벅지 앞으로, 정강이 아래로, 청키 스니커즈 */
      for (const s of [-1, 1]) {
        cap([s * .24, 1.05, 0], [s * .31, .98, .58], .16, jeans);
        cap([s * .31, .98, .58], [s * .33, .2, .62], .13, jeans);
        const shoe = add(new THREE.SphereGeometry(.2, 24, 16), white, s * .33, .16, .8); shoe.scale.set(1, .62, 1.55);
        add(new THREE.BoxGeometry(.4, .05, .6), violet, s * .33, .07, .82);
      }
      /* 몸통(후드) + 끈 + 금 체인 + 가슴 로고 */
      const torso = cap([0, 1.12, 0], [0, 1.74, 0], .45, cloth); torso.scale.z = .74;
      const hood = add(new THREE.SphereGeometry(.52, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), cloth, 0, 1.66, -.1); hood.scale.set(1, .55, .92);
      const string = M(BW ? 0xcccccc : 0x9b8cff);
      cap([-.08, 1.78, .33], [-.11, 1.42, .36], .016, string, root);
      cap([.08, 1.78, .33], [.11, 1.42, .36], .016, string, root);
      const chain = add(new THREE.TorusGeometry(.3, .022, 8, 48, Math.PI), gold, 0, 1.86, .3); chain.rotation.set(-.35, 0, Math.PI);
      add(new THREE.OctahedronGeometry(.065), gold, 0, 1.55, .37);
      const logo = add(new THREE.PlaneGeometry(.46, .17), new THREE.MeshBasicMaterial({ map: canvasText('DBLV', 256, 96, 64), transparent: true, opacity: .92 }), 0, 1.36, .35);
      logo.castShadow = false;
      /* 팔: 왼팔은 무릎에, 오른팔은 팔꿈치 옆으로 올려 브이 인사(흔들림) */
      cap([-.5, 1.62, 0], [-.68, 1.25, .12], .13, cloth);
      cap([-.68, 1.25, .12], [-.42, 1.05, .5], .115, cloth);
      add(new THREE.SphereGeometry(.12, 20, 16), skin, -.38, 1.06, .58);
      cap([.5, 1.62, 0], [.76, 1.3, .1], .13, cloth);
      elbow = new THREE.Group(); elbow.position.set(.76, 1.3, .1); root.add(elbow);
      cap([0, 0, 0], [.12, .62, .18], .115, cloth, elbow);
      add(new THREE.SphereGeometry(.125, 20, 16), skin, .13, .68, .2, elbow);
      cap([.13, .68, .2], [.06, .92, .22], .035, skin, elbow);
      cap([.13, .68, .2], [.23, .9, .22], .035, skin, elbow);
      /* 목 + 머리 + 얼굴 */
      cap([0, 1.7, 0], [0, 1.96, 0], .12, skin);
      head = new THREE.Group(); head.position.set(0, 2.24, 0); root.add(head);
      add(new THREE.SphereGeometry(.4, 40, 28), skin, 0, 0, 0, head);
      for (const s of [-1, 1]) add(new THREE.SphereGeometry(.09, 16, 12), skin, s * .4, -.03, 0, head);
      const ring = add(new THREE.TorusGeometry(.05, .012, 8, 20), gold, -.42, -.14, .02, head); ring.rotation.y = Math.PI / 2;
      add(new THREE.BoxGeometry(.7, .17, .1), lens, 0, .04, .35, head);
      for (const s of [-1, 1]) cap([s * .34, .04, .33], [s * .41, .02, -.06], .013, dark, head);
      add(new THREE.SphereGeometry(.055, 12, 10), skin, 0, -.08, .4, head);
      const mouth = add(new THREE.TorusGeometry(.09, .013, 8, 20, Math.PI), lips, 0, -.19, .37, head); mouth.rotation.z = Math.PI;
      /* 드레드: 머리 위 뭉치 + 옆·뒤로 늘어진 가닥 + 구슬 */
      const N = 18;
      for (let i = 0; i < N; i++) {
        const th = (38 + i * (284 / (N - 1))) * Math.PI / 180;
        const sx = Math.sin(th), sz = Math.cos(th);
        const len = .5 + ((i * 7) % 4) * .08;
        const a = [sx * .3, .24, sz * .3], b = [sx * .5, .24 - len, sz * .5];
        cap(a, b, .046, hair, head);
        if (i % 3 === 0) add(new THREE.SphereGeometry(.05, 12, 10), i % 2 ? gold : violet, b[0], b[1] - .02, b[2], head);
      }
      for (let i = 0; i < 9; i++) {
        const th = i / 9 * Math.PI * 2;
        cap([Math.sin(th) * .12, .3, Math.cos(th) * .12], [Math.sin(th) * .26, .62 + (i % 3) * .05, Math.cos(th) * .26 - .05], .05, hair, head);
      }
      add(new THREE.SphereGeometry(.34, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), hair, 0, .18, -.02, head).scale.set(1.15, .7, 1.1);
    }

    /* ---- 움직임: 마우스 따라 회전, 숨쉬듯 들썩, 손 흔들기 ---- */
    let mx = 0, my = 0, tx = 0, ty = 0, running = true, raf = 0;
    if (!opts.reduce && matchMedia('(hover:hover)').matches) {
      window.addEventListener('mousemove', e => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
    }
    const clock = new THREE.Clock();
    let t = 0;
    const qTmp = new THREE.Quaternion(), axZ = new THREE.Vector3(0, 0, 1), axY = new THREE.Vector3(0, 1, 0), axX = new THREE.Vector3(1, 0, 0);
    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), .05);
      if (!opts.reduce) t += dt;
      tx += (mx - tx) * .06; ty += (my - ty) * .06;
      root.rotation.y = tx * .5 + Math.sin(t * .5) * .06;
      root.rotation.x = ty * .1;
      root.position.y = Math.sin(t * 1.6) * .025;
      if (rig) {
        if (rig.head) { rig.head.quaternion.copy(rig.head0).multiply(qTmp.setFromAxisAngle(axY, tx * .35)).multiply(qTmp.setFromAxisAngle(axX, ty * .15)); }
        if (rig.fore) { rig.fore.quaternion.copy(rig.fore0).multiply(qTmp.setFromAxisAngle(axZ, Math.sin(t * 4.2) * (opts.pose && opts.pose.wave != null ? opts.pose.wave : .3))); }
      } else {
        head.rotation.y = tx * .35; head.rotation.x = ty * .18 + Math.sin(t * .9) * .03;
        elbow.rotation.z = -.3 + Math.sin(t * 4.2) * .3;
        elbow.rotation.x = Math.sin(t * 4.2) * .06;
      }
      renderer.render(scene, camera);
    };
    const start = () => { if (!running) { running = true; clock.getDelta(); loop(); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); }).observe(host);
    new IntersectionObserver(es => { es[0].isIntersecting ? start() : stop(); }).observe(host);
    host.appendChild(renderer.domElement);
    loop();
    return { renderer, scene, model: !!rig };
  },
};
