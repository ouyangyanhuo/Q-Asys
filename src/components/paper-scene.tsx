"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type * as ThreeNS from "three";

type Three = typeof ThreeNS;

interface Card {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  wx: number;
  wy: number;
  wz: number;
  alpha: number;
  bob: number;
  hasSeal: boolean;
}

const CARD_W = 1.34;
const CARD_H = 0.86;
const SPAN_Z = 210;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * 建场：一整片飘着半透宣纸信笺的立体纸场。
 * 滚动即前进——相机在纸场里穿行；越往下走，翻飞的信笺越趋于正面朝向，
 * 像散落的纸页最终被风排齐；偶有几封带着朱砂印点，在光下轻闪。
 */
function buildScene(THREE: Three, canvas: HTMLCanvasElement) {
  THREE.ColorManagement.enabled = false;

  let width = window.innerWidth;
  let height = window.innerHeight;
  const small = width < 720;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(width, height, false);
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 520);

  /* ── 纸笺：半透纸面 + 折角线框 + 偶现朱砂小印 */
  const COUNT = small ? 108 : 216;
  // 外框四边 + 顶部折角两笔，共 6 段 12 个端点
  const PTS = 12;
  // 每张纸面 = 2 个三角形 6 个顶点
  const FILL_PTS = 6;
  const linePositions = new Float32Array(COUNT * PTS * 3);
  const lineAlphas = new Float32Array(COUNT * PTS);
  const fillPositions = new Float32Array(COUNT * FILL_PTS * 3);
  const fillAlphas = new Float32Array(COUNT * FILL_PTS);
  const cards: Card[] = [];
  const sealCardIndices: number[] = [];

  for (let i = 0; i < COUNT; i++) {
    const hasSeal = i % 6 === 0;
    if (hasSeal) sealCardIndices.push(i);
    cards.push({
      x: (Math.random() - 0.5) * 70,
      y: (Math.random() - 0.5) * 44,
      z: -Math.random() * SPAN_Z + 10,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rz: Math.random() * Math.PI,
      wx: (Math.random() - 0.5) * 0.0042,
      wy: (Math.random() - 0.5) * 0.0036,
      wz: (Math.random() - 0.5) * 0.003,
      alpha: 0.1 + Math.random() * 0.22,
      bob: Math.random() * Math.PI * 2,
      hasSeal,
    });
  }

  /* 纸面半透层：翻飞受光时隐约闪出宣纸的温润质地 */
  const fillGeo = new THREE.BufferGeometry();
  fillGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(fillPositions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  fillGeo.setAttribute(
    "aAlpha",
    new THREE.BufferAttribute(fillAlphas, 1).setUsage(THREE.DynamicDrawUsage),
  );

  const fillMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color() },
      uFillGain: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      uniform float uFillGain;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float d = -mv.z;
        vAlpha = aAlpha * uFillGain * (1.0 - smoothstep(32.0, 185.0, d));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        if (vAlpha < 0.003) discard;
        gl_FragColor = vec4(uColor, vAlpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
  });

  const cardFill = new THREE.Mesh(fillGeo, fillMat);
  cardFill.frustumCulled = false;
  scene.add(cardFill);

  /* 信封折线 */
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  lineGeo.setAttribute(
    "aAlpha",
    new THREE.BufferAttribute(lineAlphas, 1).setUsage(THREE.DynamicDrawUsage),
  );

  const lineMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() } },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float d = -mv.z;
        vAlpha = aAlpha * (1.0 - smoothstep(40.0, 200.0, d));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        if (vAlpha < 0.004) discard;
        gl_FragColor = vec4(uColor, vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  const cardLines = new THREE.LineSegments(lineGeo, lineMat);
  cardLines.frustumCulled = false;
  scene.add(cardLines);

  /* 朱砂印点：六分之一信笺右下角带一枚微小朱印，给素纸添一抹灵动 */
  const sealPositions = new Float32Array(sealCardIndices.length * 3);
  const sealAlphas = new Float32Array(sealCardIndices.length);
  const sealGeo = new THREE.BufferGeometry();
  sealGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(sealPositions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  sealGeo.setAttribute(
    "aAlpha",
    new THREE.BufferAttribute(sealAlphas, 1).setUsage(THREE.DynamicDrawUsage),
  );

  const sealMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color() },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float d = -mv.z;
        vAlpha = aAlpha * (1.0 - smoothstep(28.0, 165.0, d));
        gl_PointSize = clamp((135.0 / max(d, 1.0)) * uPixelRatio, 1.5, 6.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 p = abs(gl_PointCoord - vec2(0.5));
        float box = max(p.x, p.y);
        float a = smoothstep(0.46, 0.24, box) * vAlpha;
        if (a < 0.005) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  const sealPoints = new THREE.Points(sealGeo, sealMat);
  sealPoints.frustumCulled = false;
  scene.add(sealPoints);

  /* ── 浮尘：白昼是窗前微尘，夜里是烛火旁轻晃的金星 */
  const MOTES = small ? 280 : 560;
  const motePositions = new Float32Array(MOTES * 3);
  const moteSizes = new Float32Array(MOTES);
  const moteAlphas = new Float32Array(MOTES);
  const motePhases = new Float32Array(MOTES);

  for (let i = 0; i < MOTES; i++) {
    motePositions[i * 3] = (Math.random() - 0.5) * 84;
    motePositions[i * 3 + 1] = (Math.random() - 0.5) * 52;
    motePositions[i * 3 + 2] = -Math.random() * SPAN_Z + 10;
    moteSizes[i] = 1.6 + Math.random() * 3.4;
    moteAlphas[i] = 0.12 + Math.random() * 0.3;
    motePhases[i] = Math.random() * Math.PI * 2;
  }

  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  moteGeo.setAttribute("aSize", new THREE.BufferAttribute(moteSizes, 1));
  moteGeo.setAttribute("aAlpha", new THREE.BufferAttribute(moteAlphas, 1));
  moteGeo.setAttribute("aPhase", new THREE.BufferAttribute(motePhases, 1));

  const moteMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color() },
      uGain: { value: 1 },
      uScale: { value: 1 },
      uTime: { value: 0 },
      uTwinkle: { value: 0.2 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      attribute float aPhase;
      uniform float uGain;
      uniform float uScale;
      uniform float uTime;
      uniform float uTwinkle;
      varying float vAlpha;
      void main() {
        vec3 pos = position;
        pos.y += sin(uTime * 0.35 + aPhase) * 0.65;
        pos.x += cos(uTime * 0.22 + aPhase * 1.3) * 0.45;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        float d = -mv.z;
        float pulse = 1.0 - uTwinkle + uTwinkle * (0.5 + 0.5 * sin(uTime * 1.4 + aPhase * 3.0));
        vAlpha = aAlpha * uGain * pulse * (1.0 - smoothstep(30.0, 180.0, d));
        gl_PointSize = aSize * uScale * (170.0 / max(d, 1.0));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float r = length(gl_PointCoord - vec2(0.5));
        float a = smoothstep(0.5, 0.05, r) * vAlpha;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  scene.add(motes);

  /* ── 与页面配合：滚动即前进，指针即视差 */
  let progress = 0;
  let camZ = 0;
  let targetZ = 0;
  let pointerX = 0;
  let pointerY = 0;
  let curPX = 0;
  let curPY = 0;

  const readScroll = () => {
    const max = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    progress = Math.min(1, Math.max(0, window.scrollY / max));
    targetZ = -progress * 150;
  };

  const onPointer = (event: PointerEvent) => {
    pointerX = (event.clientX / width - 0.5) * 2;
    pointerY = (event.clientY / height - 0.5) * 2;
  };

  const applyPalette = () => {
    const night =
      document.documentElement.getAttribute("data-theme") === "night";
    if (night) {
      lineMat.uniforms.uColor.value.setHex(0xeed3a0);
      fillMat.uniforms.uColor.value.setHex(0xffe4b5);
      fillMat.uniforms.uFillGain.value = 0.16;
      sealMat.uniforms.uColor.value.setHex(0xe26450);
      moteMat.uniforms.uColor.value.setHex(0xf7c76a);
      moteMat.uniforms.uTwinkle.value = 0.42;
    } else {
      lineMat.uniforms.uColor.value.setHex(0x3a332a);
      fillMat.uniforms.uColor.value.setHex(0xfffcf4);
      fillMat.uniforms.uFillGain.value = 0.55;
      sealMat.uniforms.uColor.value.setHex(0xb83c2d);
      moteMat.uniforms.uColor.value.setHex(0xa8946f);
      moteMat.uniforms.uTwinkle.value = 0.16;
    }
    // 浅纸上深色的大光斑像污渍，白昼把浮尘收淡收小；夜里它们是烛火边的金尘
    moteMat.uniforms.uGain.value = night ? 1 : 0.42;
    moteMat.uniforms.uScale.value = night ? 1 : 0.62;
  };
  applyPalette();

  const tmpVec = new THREE.Vector3();
  const tmpNormal = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpEuler = new THREE.Euler();

  // 信封背面的折角：上两角各引一笔到中点
  const HW = CARD_W / 2;
  const HH = CARD_H / 2;
  const FLAP = HH * 0.12;
  const corners: Array<[number, number]> = [
    [-HW, -HH], [HW, -HH],
    [HW, -HH], [HW, HH],
    [HW, HH], [-HW, HH],
    [-HW, HH], [-HW, -HH],
    [-HW, HH], [0, FLAP],
    [0, FLAP], [HW, HH],
  ];
  const quadCorners: Array<[number, number]> = [
    [-HW, -HH], [HW, -HH], [HW, HH],
    [-HW, -HH], [HW, HH], [-HW, HH],
  ];

  let time = 0;

  const writeCards = () => {
    // 越往下滚，翻飞的信笺越趋于正面——散页被风排齐
    const align = smoothstep(0.45, 0.95, progress);
    let sealCursor = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      card.rx += card.wx * (1 - align);
      card.ry += card.wy * (1 - align);
      card.rz += card.wz * (1 - align);

      if (align > 0) {
        card.rx *= 1 - align * 0.02;
        card.ry *= 1 - align * 0.02;
        card.rz *= 1 - align * 0.02;
      }

      // 循环：落到相机身后就送到最远处，纸场永无尽头
      if (card.z > camZ + 10) {
        card.z -= SPAN_Z;
        card.x = (Math.random() - 0.5) * 70;
        card.y = (Math.random() - 0.5) * 44;
      } else if (card.z < camZ - SPAN_Z) {
        card.z += SPAN_Z;
      }

      const bobY = Math.sin(time * 0.5 + card.bob) * 0.4;

      tmpEuler.set(card.rx, card.ry, card.rz);
      tmpQuat.setFromEuler(tmpEuler);

      // 依据纸面朝向计算柔和受光：正面迎光时纸面微亮，侧翻时隐去
      tmpNormal.set(0, 0, 1).applyQuaternion(tmpQuat);
      const sheen = 0.25 + 0.75 * Math.abs(tmpNormal.z);
      const baseAlpha = card.alpha * (1 - align * 0.25);

      const lineBase = i * PTS;
      for (let c = 0; c < PTS; c++) {
        tmpVec.set(corners[c][0], corners[c][1], 0).applyQuaternion(tmpQuat);
        const idx = (lineBase + c) * 3;
        linePositions[idx] = card.x + tmpVec.x;
        linePositions[idx + 1] = card.y + bobY + tmpVec.y;
        linePositions[idx + 2] = card.z + tmpVec.z;
        lineAlphas[lineBase + c] = baseAlpha;
      }

      const fillBase = i * FILL_PTS;
      const faceAlpha = baseAlpha * 0.28 * sheen;
      for (let q = 0; q < FILL_PTS; q++) {
        tmpVec
          .set(quadCorners[q][0], quadCorners[q][1], 0)
          .applyQuaternion(tmpQuat);
        const idx = (fillBase + q) * 3;
        fillPositions[idx] = card.x + tmpVec.x;
        fillPositions[idx + 1] = card.y + bobY + tmpVec.y;
        fillPositions[idx + 2] = card.z + tmpVec.z;
        fillAlphas[fillBase + q] = faceAlpha;
      }

      if (card.hasSeal) {
        tmpVec.set(HW * 0.58, -HH * 0.46, 0.01).applyQuaternion(tmpQuat);
        const sIdx = sealCursor * 3;
        sealPositions[sIdx] = card.x + tmpVec.x;
        sealPositions[sIdx + 1] = card.y + bobY + tmpVec.y;
        sealPositions[sIdx + 2] = card.z + tmpVec.z;
        sealAlphas[sealCursor] = baseAlpha * 1.45 * sheen;
        sealCursor++;
      }
    }

    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.aAlpha.needsUpdate = true;
    fillGeo.attributes.position.needsUpdate = true;
    fillGeo.attributes.aAlpha.needsUpdate = true;
    sealGeo.attributes.position.needsUpdate = true;
    sealGeo.attributes.aAlpha.needsUpdate = true;
  };

  const draw = () => {
    camZ += (targetZ - camZ) * 0.06;

    curPX += (pointerX - curPX) * 0.05;
    curPY += (pointerY - curPY) * 0.05;

    camera.position.set(curPX * 3.4, -curPY * 2.2, camZ);
    camera.lookAt(curPX * 1.1, -curPY * 0.7, camZ - 70);

    moteMat.uniforms.uTime.value = time;
    writeCards();
    renderer.render(scene, camera);
  };

  let raf = 0;
  let visible = true;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  // 页脚「止风」：停在当前这一帧，滚动与换色时仍补画一帧
  const isStill = () =>
    reduce.matches ||
    document.documentElement.getAttribute("data-motion") === "still";

  const loop = () => {
    if (!visible || isStill()) return;
    time += 0.016;
    draw();
    raf = requestAnimationFrame(loop);
  };

  const settle = () => {
    camZ = targetZ;
    draw();
  };

  const onMotion = () => {
    cancelAnimationFrame(raf);
    if (isStill()) settle();
    else raf = requestAnimationFrame(loop);
  };

  const onStillScroll = () => {
    if (isStill()) settle();
  };

  const onResize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    sealMat.uniforms.uPixelRatio.value = dpr;
    renderer.setSize(width, height, false);
    draw();
  };

  const onVisibility = () => {
    visible = !document.hidden;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(loop);
  };

  const onPalette = () => {
    applyPalette();
    if (isStill()) settle();
  };

  readScroll();
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("scroll", onStillScroll, { passive: true });
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("qasys-theme-change", onPalette);
  window.addEventListener("qasys-motion-change", onMotion);
  reduce.addEventListener("change", onMotion);
  document.addEventListener("visibilitychange", onVisibility);

  onMotion();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", readScroll);
    window.removeEventListener("scroll", onStillScroll);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("qasys-theme-change", onPalette);
    window.removeEventListener("qasys-motion-change", onMotion);
    reduce.removeEventListener("change", onMotion);
    document.removeEventListener("visibilitychange", onVisibility);
    fillGeo.dispose();
    fillMat.dispose();
    lineGeo.dispose();
    lineMat.dispose();
    sealGeo.dispose();
    sealMat.dispose();
    moteGeo.dispose();
    moteMat.dispose();
    renderer.dispose();
  };
}

export function PaperScene() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const depthRef = useRef<HTMLDivElement | null>(null);

  // 纸场 WebGL 只在首页跑：详情页、后台省下几百 KB 与每帧开销，但仍享有纯 CSS 的晴窗、竹影与远山
  const enableScene = usePathname() === "/";

  // 全站轻量级微互动：远山滚动手卷视差 + 持烛/案头微光跟随指针
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let scrollRaf = 0;
    let pointerRaf = 0;
    let nextX = 0;
    let nextY = 0;

    const updateScroll = () => {
      scrollRaf = 0;
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      el.style.setProperty("--scroll-p", p.toFixed(4));
    };

    const onScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(updateScroll);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduce.matches) return;
      nextX = e.clientX;
      nextY = e.clientY;
      if (!pointerRaf) {
        pointerRaf = requestAnimationFrame(() => {
          pointerRaf = 0;
          el.style.setProperty("--mx", `${nextX}px`);
          el.style.setProperty("--my", `${nextY}px`);
          if (el.getAttribute("data-pointer") !== "active") {
            el.setAttribute("data-pointer", "active");
          }
        });
      }
    };

    const onPointerLeave = () => {
      el.removeAttribute("data-pointer");
    };

    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(scrollRaf);
      cancelAnimationFrame(pointerRaf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  useEffect(() => {
    if (!enableScene) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // three 体积不小，且建场景是一次 200ms 级的长任务。
    // 避开开屏 3D 折叠动画与首屏水墨显影的高帧率关键期，等开屏完成并在浏览器空闲时再装配。
    const start = () => {
      if (disposed) return;
      import("three")
        .then((THREE) => {
          if (disposed) return;
          cleanup = buildScene(THREE, canvas);
          // 场景就绪后标记 data-ready，平滑淡入纸笺微粒，如晨雾初凝
          canvas.setAttribute("data-ready", "true");
        })
        .catch(() => undefined);
    };

    const scheduleStart = () => {
      if (disposed) return;
      if (window.requestIdleCallback) {
        window.requestIdleCallback(start, { timeout: 3000 });
      } else {
        window.setTimeout(start, 500);
      }
    };

    const doc = document.documentElement;
    if (doc.hasAttribute("data-screen")) {
      let fired = false;
      const onDone = () => {
        if (fired || disposed) return;
        fired = true;
        window.removeEventListener("qasys-screen-done", onDone);
        window.clearTimeout(fallback);
        scheduleStart();
      };

      window.addEventListener("qasys-screen-done", onDone);
      // 兜底：若开屏因某些原因未能触发事件，至多等 6 秒后自行建场
      const fallback = window.setTimeout(onDone, 6000);

      return () => {
        disposed = true;
        window.removeEventListener("qasys-screen-done", onDone);
        window.clearTimeout(fallback);
        cleanup?.();
      };
    }

    scheduleStart();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [enableScene]);

  return (
    <div ref={sceneRef} className="scene" aria-hidden="true">
      {/* 1. 宣纸乌丝栏底纹 */}
      <div className="scene-ruling" />

      {/* 2. 远景水彩晕染与晴窗斜光 */}
      <div ref={depthRef} className="scene-depth">
        <div className="scene-wash scene-wash-a" />
        <div className="scene-wash scene-wash-b" />
        <div className="scene-bloom scene-bloom-a" />
        <div className="scene-bloom scene-bloom-b" />
        <div className="scene-sunbeam" />
      </div>

      {/* 3. 窗外竹影：投于宣纸右上角的写意疏竹 */}
      <svg
        className="scene-bamboo"
        viewBox="0 0 640 520"
        fill="currentColor"
        preserveAspectRatio="xMaxYMin meet"
      >
        <g className="scene-bamboo-a">
          {/* 主竿：自右上角斜垂，带两处竹节 */}
          <path
            d="M652 -12 C 578 44, 512 104, 450 176 C 396 238, 356 298, 318 366"
            fill="none"
            stroke="currentColor"
            strokeWidth="5.2"
            strokeLinecap="round"
            opacity="0.72"
          />
          <path
            d="M524 88 L 537 98 M428 202 L 440 211"
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.65"
          />
          {/* 细枝一 */}
          <path
            d="M528 92 C 472 108, 418 118, 366 134"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.65"
          />
          {/* 竹叶群一（个字叶） */}
          <path d="M466 108 C 430 82, 378 72, 326 78 C 378 90, 424 102, 466 108 Z" />
          <path d="M454 114 C 414 118, 362 132, 310 156 C 368 148, 416 134, 454 114 Z" />
          <path d="M424 118 C 402 152, 378 190, 352 228 C 390 194, 414 158, 424 118 Z" />
          {/* 竹叶群二（中段疏叶） */}
          <path d="M432 206 C 392 184, 342 178, 286 188 C 344 198, 392 204, 432 206 Z" />
          <path d="M426 212 C 378 228, 324 252, 272 288 C 334 268, 384 244, 426 212 Z" />
          <path d="M416 218 C 398 262, 378 308, 360 356 C 392 310, 410 264, 416 218 Z" />
          {/* 梢头新叶 */}
          <path d="M352 308 C 314 316, 268 334, 224 362 C 276 348, 318 332, 352 308 Z" />
          <path d="M332 342 C 308 378, 286 418, 268 456 C 302 420, 322 382, 332 342 Z" />
        </g>

        <g className="scene-bamboo-b" opacity="0.72">
          {/* 副枝：更轻盈的一笔，错落迎风 */}
          <path
            d="M648 96 C 584 134, 530 182, 480 248"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path d="M578 142 C 540 120, 494 116, 444 128 C 496 134, 540 140, 578 142 Z" />
          <path d="M558 158 C 522 178, 478 206, 436 244 C 488 218, 528 190, 558 158 Z" />
          <path d="M524 196 C 508 240, 492 288, 480 338 C 506 290, 520 242, 524 196 Z" />
          <path d="M492 234 C 450 248, 404 274, 362 308 C 414 286, 456 262, 492 234 Z" />
        </g>
      </svg>

      {/* 4. 远山淡墨：页面底缘三叠烟岚 */}
      <svg
        className="scene-mountains"
        viewBox="0 0 1440 280"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chisu-mt-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--scene-mountain-far)" />
            <stop offset="85%" stopColor="var(--scene-mountain-far)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--scene-mountain-far)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="chisu-mt-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--scene-mountain-mid)" />
            <stop offset="88%" stopColor="var(--scene-mountain-mid)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--scene-mountain-mid)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="chisu-mt-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--scene-mountain-near)" />
            <stop offset="90%" stopColor="var(--scene-mountain-near)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--scene-mountain-near)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 远峰 */}
        <path
          className="scene-mountain-far"
          fill="url(#chisu-mt-far)"
          d="M0 280 L0 128 C 115 86, 205 44, 325 76 C 455 110, 555 162, 715 144 C 865 128, 965 56, 1115 38 C 1248 22, 1348 76, 1440 106 L1440 280 Z"
        />
        {/* 中峦 */}
        <path
          className="scene-mountain-mid"
          fill="url(#chisu-mt-mid)"
          d="M0 280 L0 170 C 145 138, 250 96, 398 128 C 538 158, 650 198, 822 170 C 972 146, 1085 92, 1235 112 C 1332 124, 1396 152, 1440 166 L1440 280 Z"
        />
        {/* 近岫 */}
        <path
          className="scene-mountain-near"
          fill="url(#chisu-mt-near)"
          d="M0 280 L0 212 C 180 182, 342 206, 522 190 C 712 174, 872 216, 1072 192 C 1222 174, 1342 198, 1440 206 L1440 280 Z"
        />
      </svg>

      {/* 5. 缓掠光带 */}
      <div className="scene-sweep" />

      {/* 6. 持烛夜读 / 案头暖光 */}
      <div className="scene-cursor" />

      {/* 7. WebGL 立体宣纸纸场 */}
      <canvas ref={canvasRef} className="scene-webgl" />

      {/* 8. 四周纸缘暗角 */}
      <div className="scene-vignette" />
    </div>
  );
}
