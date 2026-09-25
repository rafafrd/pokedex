import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ThemePalette } from "../../types/pokemon";

interface ThreeBackgroundProps {
  theme: ThemePalette;
}

type BallType = "poke" | "great" | "ultra";

interface FloatingBall {
  mesh: THREE.Mesh;
  /** Soft quad sitting just behind the ball, standing in for a cast shadow. */
  shadow: THREE.Mesh;
  radius: number;
  baseY: number;
  amplitude: number;
  phase: number;
  speed: number;
  rotationSpeed: number;
}

const BALL_COUNT = 16;
const BALL_TYPES: BallType[] = ["poke", "great", "ultra"];

// Equirectangular maps are 2:1 so a circle drawn near the equator (the
// button) stays circular once it's wrapped onto the sphere.
const TEX_W = 1024;
const TEX_H = 512;

// Shared feature layout, in fractions of the texture height, so the colour,
// bump, roughness and AO maps all line up on the same seam and button.
const BAND_TOP = 0.45;
const BAND_BOTTOM = 0.55;
const BUTTON_R = 0.115;

function createSurface(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d") as CanvasRenderingContext2D };
}

/**
 * Non-colour maps (bump/roughness/AO) must stay in linear space — tagging
 * them sRGB would gamma-shift the values the shader reads as heights and
 * roughness, not as colours.
 */
function toTexture(canvas: HTMLCanvasElement, isColor: boolean) {
  const texture = new THREE.CanvasTexture(canvas);
  if (isColor) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/** Fine plastic grain: ± specks, so it reads as a moulded surface. */
function addGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  alpha: number,
) {
  for (let i = 0; i < count; i += 1) {
    const size = 1 + Math.random() * 1.5;
    ctx.fillStyle =
      Math.random() > 0.5
        ? `rgba(255,255,255,${alpha})`
        : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, size, size);
  }
}

/**
 * Albedo for one variant: shaded shells, the accent blobs, the seam with its
 * contact darkening, a lit button, a baked curvature falloff toward the poles
 * and a light grain pass.
 */
function createColorMap(type: BallType): THREE.CanvasTexture {
  const { canvas, ctx } = createSurface(TEX_W, TEX_H);
  const w = TEX_W;
  const h = TEX_H;

  const palettes: Record<
    BallType,
    { top: string; topDark: string; accent: string | null }
  > = {
    poke: { top: "#EE1515", topDark: "#9E0C0C", accent: null },
    great: { top: "#3A6ED8", topDark: "#1F4189", accent: "#EE1515" },
    ultra: { top: "#1F1F1F", topDark: "#080808", accent: "#F4C90C" },
  };
  const { top, topDark, accent } = palettes[type];

  // Lower shell, shaded from the equator down to the pole.
  const bottomGrad = ctx.createLinearGradient(0, h * BAND_BOTTOM, 0, h);
  bottomGrad.addColorStop(0, "#F7F7F7");
  bottomGrad.addColorStop(0.7, "#EDEDF0");
  bottomGrad.addColorStop(1, "#C2C2CB");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, 0, w, h);

  // Upper shell, likewise darkened toward its pole.
  const topGrad = ctx.createLinearGradient(0, 0, 0, h * BAND_TOP);
  topGrad.addColorStop(0, topDark);
  topGrad.addColorStop(0.35, top);
  topGrad.addColorStop(1, top);
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, h * BAND_TOP);

  // Great/Ultra Ball accent blobs flanking the button.
  if (accent) {
    ctx.fillStyle = accent;
    [w * 0.26, w * 0.74].forEach((cx) => {
      ctx.beginPath();
      ctx.ellipse(cx, h * BAND_TOP, w * 0.12, h * 0.1, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    });
  }

  // The seam itself, then the occlusion pooling along both of its edges —
  // that gradient is what makes it read as a recess instead of a stripe.
  ctx.fillStyle = "#151515";
  ctx.fillRect(0, h * BAND_TOP, w, h * (BAND_BOTTOM - BAND_TOP));

  const seamTop = ctx.createLinearGradient(0, h * (BAND_TOP - 0.085), 0, h * BAND_TOP);
  seamTop.addColorStop(0, "rgba(0,0,0,0)");
  seamTop.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = seamTop;
  ctx.fillRect(0, h * (BAND_TOP - 0.085), w, h * 0.085);

  const seamBottom = ctx.createLinearGradient(
    0,
    h * BAND_BOTTOM,
    0,
    h * (BAND_BOTTOM + 0.085),
  );
  seamBottom.addColorStop(0, "rgba(0,0,0,0.5)");
  seamBottom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = seamBottom;
  ctx.fillRect(0, h * BAND_BOTTOM, w, h * 0.085);

  // Thin chamfer catching light along the seam edges.
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h * BAND_TOP + 1);
  ctx.lineTo(w, h * BAND_TOP + 1);
  ctx.moveTo(0, h * BAND_BOTTOM - 1);
  ctx.lineTo(w, h * BAND_BOTTOM - 1);
  ctx.stroke();

  const cx = w / 2;
  const cy = h / 2;
  const outerR = h * BUTTON_R;

  // Occlusion pooling in the button's housing.
  const socket = ctx.createRadialGradient(
    cx,
    cy,
    outerR * 0.9,
    cx,
    cy,
    outerR * 2,
  );
  socket.addColorStop(0, "rgba(0,0,0,0.55)");
  socket.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = socket;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 2, 0, Math.PI * 2);
  ctx.fill();

  // Button, lit from the upper left to match the key light.
  const button = ctx.createRadialGradient(
    cx - outerR * 0.35,
    cy - outerR * 0.35,
    outerR * 0.08,
    cx,
    cy,
    outerR,
  );
  button.addColorStop(0, "#FFFFFF");
  button.addColorStop(0.65, "#EAEAEE");
  button.addColorStop(1, "#B9B9C4");
  ctx.fillStyle = button;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#151515";
  ctx.lineWidth = h * 0.022;
  ctx.stroke();

  ctx.fillStyle = "#1A1A1A";
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Baked curvature falloff: the poles face away from any light in the scene,
  // so darkening them in the albedo keeps the silhouette from reading flat.
  ctx.globalCompositeOperation = "multiply";
  const curvature = ctx.createLinearGradient(0, 0, 0, h);
  curvature.addColorStop(0, "#C2C2C2");
  curvature.addColorStop(0.22, "#E6E6E6");
  curvature.addColorStop(0.5, "#FFFFFF");
  curvature.addColorStop(0.78, "#E6E6E6");
  curvature.addColorStop(1, "#C2C2C2");
  ctx.fillStyle = curvature;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  addGrain(ctx, w, h, 9000, 0.05);

  return toTexture(canvas, true);
}

/**
 * Height relief shared by every variant: the seam is a channel, the button a
 * raised dome inside a groove, plus micro-grain over the whole shell.
 */
function createBumpMap(): THREE.CanvasTexture {
  const { canvas, ctx } = createSurface(TEX_W, TEX_H);
  const w = TEX_W;
  const h = TEX_H;

  ctx.fillStyle = "#808080"; // neutral height
  ctx.fillRect(0, 0, w, h);

  const seam = ctx.createLinearGradient(
    0,
    h * (BAND_TOP - 0.035),
    0,
    h * (BAND_BOTTOM + 0.035),
  );
  seam.addColorStop(0, "#8C8C8C");
  seam.addColorStop(0.2, "#3A3A3A");
  seam.addColorStop(0.8, "#3A3A3A");
  seam.addColorStop(1, "#8C8C8C");
  ctx.fillStyle = seam;
  ctx.fillRect(
    0,
    h * (BAND_TOP - 0.035),
    w,
    h * (BAND_BOTTOM - BAND_TOP + 0.07),
  );

  const cx = w / 2;
  const cy = h / 2;
  const outerR = h * BUTTON_R;

  ctx.fillStyle = "#484848"; // groove around the housing
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 1.25, 0, Math.PI * 2);
  ctx.fill();

  const dome = ctx.createRadialGradient(cx, cy, outerR * 0.1, cx, cy, outerR);
  dome.addColorStop(0, "#EDEDED");
  dome.addColorStop(0.7, "#CFCFCF");
  dome.addColorStop(1, "#9C9C9C");
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6E6E6E";
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 0.45, 0, Math.PI * 2);
  ctx.fill();

  addGrain(ctx, w, h, 26000, 0.09);

  return toTexture(canvas, false);
}

/** Polished shell, matte rubber seam, glossy button. */
function createRoughnessMap(): THREE.CanvasTexture {
  const { canvas, ctx } = createSurface(TEX_W, TEX_H);
  const w = TEX_W;
  const h = TEX_H;

  ctx.fillStyle = "#5C5C5C"; // ~0.36 — polished plastic
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#B8B8B8"; // ~0.72 — the seam eats highlights
  ctx.fillRect(0, h * BAND_TOP, w, h * (BAND_BOTTOM - BAND_TOP));

  const cx = w / 2;
  const cy = h / 2;
  const outerR = h * BUTTON_R;

  ctx.fillStyle = "#8E8E8E";
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 1.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3A3A3A"; // ~0.23 — glossy button
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fill();

  addGrain(ctx, w, h, 20000, 0.08);

  return toTexture(canvas, false);
}

/**
 * Ambient occlusion: white where light reaches freely, dark in the crevices
 * (seam, button housing) and slightly dark at the poles. Only affects
 * ambient/environment light, which is exactly where a smooth shell would
 * otherwise look washed out and shapeless.
 */
function createAoMap(): THREE.CanvasTexture {
  const { canvas, ctx } = createSurface(TEX_W, TEX_H);
  const w = TEX_W;
  const h = TEX_H;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  const seam = ctx.createLinearGradient(
    0,
    h * (BAND_TOP - 0.1),
    0,
    h * (BAND_BOTTOM + 0.1),
  );
  seam.addColorStop(0, "#FFFFFF");
  seam.addColorStop(0.3, "#3C3C3C");
  seam.addColorStop(0.7, "#3C3C3C");
  seam.addColorStop(1, "#FFFFFF");
  ctx.fillStyle = seam;
  ctx.fillRect(0, h * (BAND_TOP - 0.1), w, h * (BAND_BOTTOM - BAND_TOP + 0.2));

  const cx = w / 2;
  const cy = h / 2;
  const outerR = h * BUTTON_R;

  const socket = ctx.createRadialGradient(
    cx,
    cy,
    outerR * 0.85,
    cx,
    cy,
    outerR * 1.8,
  );
  socket.addColorStop(0, "rgba(0,0,0,0.65)");
  socket.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = socket;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Button face itself is exposed — lift it back out of the socket shading.
  ctx.fillStyle = "#F0F0F0";
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 0.92, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "multiply";
  const poles = ctx.createLinearGradient(0, 0, 0, h);
  poles.addColorStop(0, "#A8A8A8");
  poles.addColorStop(0.25, "#FFFFFF");
  poles.addColorStop(0.75, "#FFFFFF");
  poles.addColorStop(1, "#A8A8A8");
  ctx.fillStyle = poles;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  return toTexture(canvas, false);
}

/**
 * Radial falloff used by the contact shadows — dense in the middle where the
 * ball is closest to whatever is behind it, dissolving quickly outward.
 */
function createContactShadowMap(): THREE.CanvasTexture {
  const size = 256;
  const { canvas, ctx } = createSurface(size, size);
  const half = size / 2;

  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.32, "rgba(255,255,255,0.62)");
  gradient.addColorStop(0.62, "rgba(255,255,255,0.2)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return toTexture(canvas, true);
}

/**
 * Procedural studio environment (bright softbox above, dark floor below).
 * Assigned to `scene.environment` it gives the plastic something to reflect,
 * which is most of what reads as depth on an otherwise smooth sphere.
 */
function createEnvironmentMap(): THREE.CanvasTexture {
  const { canvas, ctx } = createSurface(512, 256);

  // The "floor" stays fairly light on purpose: it's the only thing bouncing
  // light back up into the lower half of each ball, and that half is the
  // white one — let it go dark and the Pokéball stops reading as a Pokéball.
  const sky = ctx.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, "#FFFFFF");
  sky.addColorStop(0.42, "#B4BCD2");
  sky.addColorStop(0.58, "#7A8092");
  sky.addColorStop(1, "#4A4A57");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 256);

  // A defined softbox so highlights have shape rather than a flat wash.
  const softbox = ctx.createRadialGradient(150, 58, 4, 150, 58, 95);
  softbox.addColorStop(0, "rgba(255,255,255,1)");
  softbox.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = softbox;
  ctx.fillRect(0, 0, 512, 256);

  const texture = toTexture(canvas, true);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

/**
 * Fundo 3D fica atrás da UI. Montamos a cena 1 vez e animamos via refs;
 * o tema só repinta luzes/neblina, sem reconstruir as 16 Pokébolas.
 * No cleanup libero geometria, texturas e renderer p/ não acumular GPU.
 */
export function ThreeBackground({ theme }: ThreeBackgroundProps) {
  // Refs seguram cena/renderer fora do estado React: animação não pede render da página.
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const ballsRef = useRef<FloatingBall[]>([]);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const shadowMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Filmic tone mapping keeps the clearcoat highlights from clipping to
    // flat white now that an environment map is lighting the shells.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const envMap = createEnvironmentMap();
    scene.environment = envMap;

    // Enough ambient to keep the shells' unlit (lower, white) half readable,
    // but well below the original 0.7 so the environment map and the AO map
    // still have room to sculpt the form instead of being flattened by it.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.25);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    // Rim light from behind picks out the silhouette against the page
    // gradient and carries the theme's accent colour.
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rimLight.position.set(-5, 2, -4);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const colorMaps: Record<BallType, THREE.CanvasTexture> = {
      poke: createColorMap("poke"),
      great: createColorMap("great"),
      ultra: createColorMap("ultra"),
    };
    // Relief, roughness and occlusion are identical across variants (only the
    // paint differs), so they're built once and shared by all three.
    const bumpMap = createBumpMap();
    const roughnessMap = createRoughnessMap();
    const aoMap = createAoMap();
    const shadowMap = createContactShadowMap();

    // One unit sphere, scaled per ball — 16 copies of the same geometry would
    // just be 16 uploads of identical vertex data.
    const sphereGeometry = new THREE.SphereGeometry(1, 48, 32);
    // aoMap reads UV channel 0 on current three, but declaring uv1 keeps it
    // working if the material is ever switched to a second channel.
    sphereGeometry.setAttribute("uv1", sphereGeometry.attributes.uv);

    const createMaterial = (type: BallType) =>
      new THREE.MeshPhysicalMaterial({
        map: colorMaps[type],
        bumpMap,
        bumpScale: 0.8,
        roughnessMap,
        roughness: 1, // scaled by the map, which holds the real values
        aoMap,
        aoMapIntensity: 0.9,
        metalness: 0.05,
        // Clearcoat is what makes it read as moulded plastic: a second,
        // smoother specular layer over the painted shell. Kept moderate —
        // pushed higher, the environment reflections wash the paint out and
        // the balls start reading as glass bubbles instead of Pokéballs.
        clearcoat: 0.45,
        clearcoatRoughness: 0.25,
        envMapIntensity: 0.35,
      });

    const materials: Record<BallType, THREE.MeshPhysicalMaterial> = {
      poke: createMaterial("poke"),
      great: createMaterial("great"),
      ultra: createMaterial("ultra"),
    };

    const shadowGeometry = new THREE.PlaneGeometry(1, 1);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowMap,
      color: 0x000000,
      transparent: true,
      opacity: 0.38,
      // The quads live behind the spheres and must never occlude each other,
      // so they test depth but never write it.
      depthWrite: false,
    });
    shadowMaterialRef.current = shadowMaterial;

    const balls: FloatingBall[] = [];
    for (let i = 0; i < BALL_COUNT; i += 1) {
      const type = BALL_TYPES[i % BALL_TYPES.length];
      const radius = 0.7 + Math.random() * 0.55;

      const mesh = new THREE.Mesh(sphereGeometry, materials[type]);
      mesh.scale.setScalar(radius);

      const y = (Math.random() - 0.5) * 14;
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        y,
        -Math.random() * 8 - 1,
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(mesh);

      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      group.add(shadow);

      balls.push({
        mesh,
        shadow,
        radius,
        baseY: y,
        amplitude: 0.35 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.35,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
    ballsRef.current = balls;

    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      for (const ball of ballsRef.current) {
        const float = Math.sin(elapsed * ball.speed + ball.phase);
        const y = ball.baseY + float * ball.amplitude;
        ball.mesh.position.y = y;
        ball.mesh.rotation.y += ball.rotationSpeed * 0.01;
        ball.mesh.rotation.x += ball.rotationSpeed * 0.005;

        // Contact shadow: parked just behind the ball and pushed away from
        // the key light, so it stays anchored to the sphere instead of
        // drifting off like a far-wall shadow would. It spreads and softens
        // as the ball rises, which is what sells the float as depth.
        const r = ball.radius;
        const lift = 0.5 + float * 0.5;
        ball.shadow.position.set(
          ball.mesh.position.x - r * 0.5,
          y - r * 0.8,
          ball.mesh.position.z - r * 1.25,
        );
        const spread = r * 3.1 * (1 + lift * 0.14);
        ball.shadow.scale.set(spread, spread, 1);
      }

      // Gentle mouse parallax: lerp the whole group toward the pointer.
      if (groupRef.current) {
        groupRef.current.rotation.y +=
          (mouseRef.current.x * 0.08 - groupRef.current.rotation.y) * 0.02;
        groupRef.current.rotation.x +=
          (mouseRef.current.y * 0.04 - groupRef.current.rotation.x) * 0.02;
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      // Sem dispose, cada ida/volta ao módulo deixaria textura e GPU ocupadas.
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      sphereGeometry.dispose();
      shadowGeometry.dispose();
      Object.values(materials).forEach((material) => material.dispose());
      shadowMaterial.dispose();
      Object.values(colorMaps).forEach((texture) => texture.dispose());
      bumpMap.dispose();
      roughnessMap.dispose();
      aoMap.dispose();
      shadowMap.dispose();
      envMap.dispose();

      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      groupRef.current = null;
      ballsRef.current = [];
      keyLightRef.current = null;
      rimLightRef.current = null;
      ambientLightRef.current = null;
      shadowMaterialRef.current = null;
    };
    // Mounted once: the scene graph is built imperatively and updated via
    // the theme effect below, not by re-running this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tema muda luz, neblina e sombra; não recriamos as Pokébolas.
  useEffect(() => {
    const isGengar = theme.name === "gengar";

    ambientLightRef.current?.color.set(isGengar ? 0x9d8cff : 0xfff5fb);

    if (keyLightRef.current) {
      // The light theme's page gradient already carries a lot of brightness,
      // so the key is eased back to keep the shells from blowing out.
      keyLightRef.current.intensity = isGengar ? 1.25 : 1.05;
    }

    if (rimLightRef.current) {
      rimLightRef.current.color.set(theme.accent);
      rimLightRef.current.intensity = isGengar ? 0.8 : 0.5;
    }

    if (shadowMaterialRef.current) {
      // A pure-black shadow would punch a hole through the light theme's
      // pastel gradient; tint it toward the theme's own darkest note instead.
      shadowMaterialRef.current.color.set(isGengar ? 0x0d0218 : 0x6b4f70);
      shadowMaterialRef.current.opacity = isGengar ? 0.42 : 0.3;
    }

    if (sceneRef.current) {
      sceneRef.current.fog = new THREE.FogExp2(
        new THREE.Color(theme.gradient[2]).getHex(),
        0.018,
      );
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
