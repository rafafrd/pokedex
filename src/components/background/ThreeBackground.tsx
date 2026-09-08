import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ThemePalette } from "../../types/pokemon";

interface ThreeBackgroundProps {
  theme: ThemePalette;
}

type BallType = "poke" | "great" | "ultra";

interface FloatingBall {
  mesh: THREE.Mesh;
  baseY: number;
  amplitude: number;
  phase: number;
  speed: number;
  rotationSpeed: number;
}

const BALL_COUNT = 16;
const BALL_TYPES: BallType[] = ["poke", "great", "ultra"];

/**
 * Paints a small equirectangular texture (top color / black band / button /
 * white bottom) for one Pokéball variant. Mapped onto a plain SphereGeometry
 * this reproduces the ball's look without needing separate hemisphere
 * geometries — cheap to build and cheap to render for a background layer.
 */
function createPokeballTexture(type: BallType): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  const palettes: Record<BallType, { top: string; accent: string | null }> = {
    poke: { top: "#EE1515", accent: null },
    great: { top: "#3A6ED8", accent: "#EE1515" },
    ultra: { top: "#1B1B1B", accent: "#F4C90C" },
  };
  const { top, accent } = palettes[type];
  const bottom = "#F5F5F5";
  const band = "#141414";

  if (ctx) {
    // Bottom half (base fill).
    ctx.fillStyle = bottom;
    ctx.fillRect(0, 0, w, h);

    // Top hemisphere color.
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h * 0.46);

    // Great/Ultra Ball accent blobs flanking the button.
    if (accent) {
      ctx.fillStyle = accent;
      const blobY = h * 0.46;
      [w * 0.26, w * 0.74].forEach((cx) => {
        ctx.beginPath();
        ctx.ellipse(cx, blobY, w * 0.12, h * 0.1, 0, Math.PI, Math.PI * 2);
        ctx.fill();
      });
    }

    // Center band.
    ctx.fillStyle = band;
    ctx.fillRect(0, h * 0.46, w, h * 0.08);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.46);
    ctx.lineTo(w, h * 0.46);
    ctx.moveTo(0, h * 0.54);
    ctx.lineTo(w, h * 0.54);
    ctx.stroke();

    // Button.
    const outerRadius = h * 0.11;
    ctx.fillStyle = bottom;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, outerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = band;
    ctx.lineWidth = h * 0.02;
    ctx.stroke();
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, outerRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Fixed, full-viewport WebGL layer with floating Pokéball spheres drifting
 * behind the UI. Mounts the Three.js scene exactly once (empty deps effect)
 * and re-tints lights/fog on theme change without rebuilding anything —
 * every ref exists purely to avoid re-renders driving the render loop.
 */
export function ThreeBackground({ theme }: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const ballsRef = useRef<FloatingBall[]>([]);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
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
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
    directionalLight.position.set(4, 6, 6);
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const textures: Record<BallType, THREE.CanvasTexture> = {
      poke: createPokeballTexture("poke"),
      great: createPokeballTexture("great"),
      ultra: createPokeballTexture("ultra"),
    };

    const balls: FloatingBall[] = [];
    for (let i = 0; i < BALL_COUNT; i += 1) {
      const type = BALL_TYPES[i % BALL_TYPES.length];
      const geometry = new THREE.SphereGeometry(0.7 + Math.random() * 0.55, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        map: textures[type],
        roughness: 0.45,
        metalness: 0.15,
      });
      const mesh = new THREE.Mesh(geometry, material);

      const y = (Math.random() - 0.5) * 14;
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        y,
        -Math.random() * 8 - 1,
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(mesh);

      balls.push({
        mesh,
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
        ball.mesh.position.y =
          ball.baseY + Math.sin(elapsed * ball.speed + ball.phase) * ball.amplitude;
        ball.mesh.rotation.y += ball.rotationSpeed * 0.01;
        ball.mesh.rotation.x += ball.rotationSpeed * 0.005;
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
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      for (const ball of ballsRef.current) {
        ball.mesh.geometry.dispose();
        (ball.mesh.material as THREE.Material).dispose();
      }
      Object.values(textures).forEach((texture) => texture.dispose());

      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      groupRef.current = null;
      ballsRef.current = [];
      directionalLightRef.current = null;
      ambientLightRef.current = null;
    };
    // Mounted once: the scene graph is built imperatively and updated via
    // the theme effect below, not by re-running this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-tint lighting/fog when the theme changes, without rebuilding the scene.
  useEffect(() => {
    directionalLightRef.current?.color.set(theme.accent);
    ambientLightRef.current?.color.set(
      theme.name === "gengar" ? 0x9d8cff : 0xfff5fb,
    );
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
