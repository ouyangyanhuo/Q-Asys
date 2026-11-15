"use client";

import { useEffect, useRef } from "react";
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
}

const CARD_W = 1.34;
const CARD_H = 0.86;
const SPAN_Z = 210;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * 建场：一整片飘着空信封的纸场。
 * 滚动即前进——相机在纸场里穿行；越往下走，翻飞的信笺越趋于正面朝向，
 * 像散落的纸页最终被风排齐。指针带来轻微视差。
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

  /* ── 纸笺：每张只是四根线，俯仰翻飞时才看得出是一张纸 */
  const COUNT = small ? 110 : 220;
  // 每张信笺 = 外框四边 + 顶部折角两笔，共 6 段 12 个端点
  const PTS = 12;
  const linePositions = new Float32Array(COUNT * PTS * 3);
  const lineAlphas = new Float32Array(COUNT * PTS);
  const cards: Card[] = [];

  for (let i = 0; i < COUNT; i++) {
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
    });
  }

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

  /* ── 浮尘：极小的光点，给空间一点空气 */
  const MOTES = small ? 280 : 560;
  const motePositions = new Float32Array(MOTES * 3);
  const moteSizes = new Float32Array(MOTES);
  const moteAlphas = new Float32Array(MOTES);

  for (let i = 0; i < MOTES; i++) {
    motePositions[i * 3] = (Math.random() - 0.5) * 84;
    motePositions[i * 3 + 1] = (Math.random() - 0.5) * 52;
    motePositions[i * 3 + 2] = -Math.random() * SPAN_Z + 10;
    moteSizes[i] = 1.6 + Math.random() * 3.4;
    moteAlphas[i] = 0.12 + Math.random() * 0.3;
  }

  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  moteGeo.setAttribute("aSize", new THREE.BufferAttribute(moteSizes, 1));
  moteGeo.setAttribute("aAlpha", new THREE.BufferAttribute(moteAlphas, 1));

  const moteMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float d = -mv.z;
        vAlpha = aAlpha * (1.0 - smoothstep(30.0, 180.0, d));
        gl_PointSize = aSize * (170.0 / max(d, 1.0));
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
      moteMat.uniforms.uColor.value.setHex(0xf7c76a);
    } else {
      lineMat.uniforms.uColor.value.setHex(0x3a332a);
      moteMat.uniforms.uColor.value.setHex(0x8b7a5e);
    }
  };
  applyPalette();

  const tmpVec = new THREE.Vector3();
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

  let time = 0;

  const writeCards = () => {
    // 越往下滚，翻飞的信笺越趋于正面——散页被风排齐
    const align = smoothstep(0.45, 0.95, progress);

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

      const base = i * PTS;
      for (let c = 0; c < PTS; c++) {
        tmpVec.set(corners[c][0], corners[c][1], 0).applyQuaternion(tmpQuat);

        const idx = (base + c) * 3;
        linePositions[idx] = card.x + tmpVec.x;
        linePositions[idx + 1] = card.y + bobY + tmpVec.y;
        linePositions[idx + 2] = card.z + tmpVec.z;

        lineAlphas[base + c] = card.alpha * (1 - align * 0.25);
      }
    }

    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.aAlpha.needsUpdate = true;
  };

  const draw = () => {
    camZ += (targetZ - camZ) * 0.06;

    curPX += (pointerX - curPX) * 0.05;
    curPY += (pointerY - curPY) * 0.05;

    camera.position.set(curPX * 3.4, -curPY * 2.2, camZ);
    camera.lookAt(curPX * 1.1, -curPY * 0.7, camZ - 70);

    writeCards();
    renderer.render(scene, camera);
  };

  let raf = 0;
  let visible = true;

  const loop = () => {
    if (!visible) return;
    time += 0.016;
    draw();
    raf = requestAnimationFrame(loop);
  };

  const onResize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    draw();
  };

  const onVisibility = () => {
    visible = !document.hidden;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(loop);
  };

  readScroll();
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("qasys-theme-change", applyPalette);
  document.addEventListener("visibilitychange", onVisibility);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) {
    camZ = targetZ;
    writeCards();
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(loop);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", readScroll);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("qasys-theme-change", applyPalette);
    document.removeEventListener("visibilitychange", onVisibility);
    lineGeo.dispose();
    moteGeo.dispose();
    lineMat.dispose();
    moteMat.dispose();
    renderer.dispose();
  };
}

export function PaperScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const depthRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // three 体积不小，等首屏稳定后再异步载入；失败就保留纯 CSS 背景
    const timer = window.setTimeout(() => {
      import("three")
        .then((THREE) => {
          if (disposed) return;
          cleanup = buildScene(THREE, canvas);
        })
        .catch(() => undefined);
    }, 240);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      cleanup?.();
    };
  }, []);

  return (
    <div className="scene" aria-hidden="true">
      <div ref={depthRef} className="scene-depth">
        <div className="scene-wash scene-wash-a" />
        <div className="scene-wash scene-wash-b" />
        <div className="scene-bloom scene-bloom-a" />
        <div className="scene-bloom scene-bloom-b" />
      </div>
      <div className="scene-sweep" />
      <canvas ref={canvasRef} className="scene-webgl" />
      <div className="scene-vignette" />
    </div>
  );
}
