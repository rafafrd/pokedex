import React, { useEffect, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";

import type { PokemonTypeTheme } from "../theme/pokemon-type-theme";
import { FiberCanvas } from "./fiber-canvas";

type BallVariant = "poke" | "great" | "ultra";
type Position = [number, number, number];

interface BallPlacement {
  variant: BallVariant;
  position: Position;
  scale: number;
  phase: number;
  amplitude: number;
  floatSpeed: number;
  rotationSpeed: number;
}

/** A deliberately small set keeps the background friendly to mobile GPUs. */
const BALL_PLACEMENTS: readonly BallPlacement[] = [
  {
    variant: "great",
    position: [-2.05, 0.82, -1.25],
    scale: 0.66,
    phase: 0.7,
    amplitude: 0.18,
    floatSpeed: 0.82,
    rotationSpeed: 0.42,
  },
  {
    variant: "poke",
    position: [-0.9, -0.65, 0.15],
    scale: 0.82,
    phase: 2.2,
    amplitude: 0.22,
    floatSpeed: 0.65,
    rotationSpeed: -0.34,
  },
  {
    variant: "ultra",
    position: [0.74, 0.72, -0.35],
    scale: 0.76,
    phase: 4.1,
    amplitude: 0.2,
    floatSpeed: 0.74,
    rotationSpeed: 0.3,
  },
  {
    variant: "poke",
    position: [2.04, -0.48, -1.05],
    scale: 0.62,
    phase: 5.2,
    amplitude: 0.16,
    floatSpeed: 0.9,
    rotationSpeed: -0.38,
  },
];

const BALL_COLOURS: Record<BallVariant, { top: string; bottom: string }> = {
  poke: { top: "#E53935", bottom: "#F8F8FB" },
  great: { top: "#3F73D8", bottom: "#F8F8FB" },
  ultra: { top: "#292A33", bottom: "#ECECF1" },
};

interface PokeballProps extends BallPlacement {
  palette: PokemonTypeTheme;
  reducedMotion: boolean;
}

function Pokeball({
  variant,
  position,
  scale,
  phase,
  amplitude,
  floatSpeed,
  rotationSpeed,
  palette,
  reducedMotion,
}: PokeballProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group || reducedMotion) {
      return;
    }

    const elapsed = state.clock.elapsedTime;
    group.position.y =
      position[1] + Math.sin(elapsed * floatSpeed + phase) * amplitude;
    group.rotation.y += delta * rotationSpeed;
    group.rotation.z = Math.sin(elapsed * 0.31 + phase) * 0.08;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* A small flattened shell behind each ball gives it a soft landing point. */}
      <mesh position={[0, -1.2, -0.25]} scale={[1.2, 0.11, 0.52]}>
        <sphereGeometry args={[0.78, 12, 8]} />
        <meshBasicMaterial
          color={palette.backgroundDeep}
          transparent
          opacity={0.18}
        />
      </mesh>
      <PokeballShell variant={variant} />
    </group>
  );
}

interface PokeballShellProps {
  variant: BallVariant;
}

function PokeballShell({ variant }: PokeballShellProps): React.JSX.Element {
  const colours = BALL_COLOURS[variant];

  return (
    <group>
      {/* Two hemispheres keep the seam genuinely 3D instead of a flat stripe. */}
      <mesh>
        <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={colours.top}
          roughness={0.48}
          metalness={0.04}
        />
      </mesh>
      <mesh>
        <sphereGeometry
          args={[1, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
        />
        <meshStandardMaterial
          color={colours.bottom}
          roughness={0.66}
          metalness={0.02}
        />
      </mesh>

      {/* Equatorial band and a raised button housing. */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.925, 0.07, 6, 24]} />
        <meshStandardMaterial color="#15151B" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0, 0.96]}>
        <torusGeometry args={[0.19, 0.045, 6, 16]} />
        <meshStandardMaterial color="#15151B" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0, 1.01]}>
        <sphereGeometry args={[0.15, 12, 8]} />
        <meshStandardMaterial
          color="#E9E9EE"
          roughness={0.24}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[0, 0, 1.14]}>
        <sphereGeometry args={[0.07, 10, 6]} />
        <meshStandardMaterial color="#202028" roughness={0.42} />
      </mesh>

      <BallAccents variant={variant} />
    </group>
  );
}

function BallAccents({
  variant,
}: {
  variant: BallVariant;
}): React.JSX.Element | null {
  if (variant === "poke") {
    return null;
  }

  const accent = variant === "great" ? "#E53935" : "#F1C644";

  return (
    <>
      <mesh
        position={[-0.56, 0.07, 0.78]}
        scale={variant === "great" ? [0.26, 0.12, 0.055] : [0.12, 0.28, 0.055]}
        rotation={[0, 0, variant === "great" ? -0.16 : -0.28]}
      >
        <sphereGeometry args={[1, 10, 6]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh
        position={[0.56, 0.07, 0.78]}
        scale={variant === "great" ? [0.26, 0.12, 0.055] : [0.12, 0.28, 0.055]}
        rotation={[0, 0, variant === "great" ? 0.16 : 0.28]}
      >
        <sphereGeometry args={[1, 10, 6]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
    </>
  );
}

interface FlightSceneProps {
  palette: PokemonTypeTheme;
  reducedMotion: boolean;
}

function FlightScene({
  palette,
  reducedMotion,
}: FlightSceneProps): React.JSX.Element {
  const { camera, scene } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 6.8);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    const background = new THREE.Color(palette.background);
    scene.background = background;

    return () => {
      if (scene.background === background) {
        scene.background = null;
      }
    };
  }, [palette.background, scene]);

  return (
    <>
      <ambientLight color={palette.highlight} intensity={0.72} />
      <directionalLight
        color={palette.highlight}
        intensity={1.35}
        position={[4, 5, 6]}
      />
      <pointLight
        color={palette.glow}
        intensity={1.4}
        distance={9}
        position={[-3, 1.5, 3]}
      />
      {BALL_PLACEMENTS.map((ball) => (
        <Pokeball
          key={`${ball.variant}-${ball.position.join("-")}`}
          {...ball}
          palette={palette}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}

export interface PokeballFlightBackgroundProps {
  /** Palette returned by `getPokemonTypeTheme`, used for lights and backdrop. */
  palette: PokemonTypeTheme;
  /** Stops floating/rotation while preserving a single static render. */
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Procedural WebGPU Pokéball background for a Pokémon detail view.
 *
 * No texture or remote asset is required: each Poke/Great/Ultra Ball is a
 * handful of low-poly hemispheres, rings, and button geometry. The scene keeps
 * its animation in `useFrame` refs so React never receives per-frame state
 * updates.
 */
export function PokeballFlightBackground({
  palette,
  reducedMotion = false,
  style,
}: PokeballFlightBackgroundProps): React.JSX.Element {
  return (
    <FiberCanvas style={style} transparent>
      <FlightScene palette={palette} reducedMotion={reducedMotion} />
    </FiberCanvas>
  );
}

export default PokeballFlightBackground;
