import React, { useEffect, useRef } from "react";
import type { ReconcilerRoot, RootState } from "@react-three/fiber";
import { createRoot, events, extend } from "@react-three/fiber";
import type { StyleProp, ViewProps, ViewStyle } from "react-native";
import { PixelRatio } from "react-native";
import {
  Canvas as WebGPUCanvas,
  type CanvasRef,
  type NativeCanvas,
  type RNCanvasContext,
} from "react-native-wgpu";
import * as THREE from "three/webgpu";

import { makeWebGPURenderer, ReactNativeCanvas } from "./make-webgpu-renderer";

// R3F's catalogue is built from the regular Three entrypoint. Registering the
// low-poly primitives explicitly keeps the native renderer's JSX path stable
// when Metro resolves `three` to `three/webgpu`.
extend({
  AmbientLight: THREE.AmbientLight,
  DirectionalLight: THREE.DirectionalLight,
  PointLight: THREE.PointLight,
  Group: THREE.Group,
  Mesh: THREE.Mesh,
  SphereGeometry: THREE.SphereGeometry,
  TorusGeometry: THREE.TorusGeometry,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
  PerspectiveCamera: THREE.PerspectiveCamera,
  Scene: THREE.Scene,
});

export interface FiberCanvasProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Native surfaces are transparent by default so the detail screen shows through. */
  transparent?: boolean;
  /** Background scenes should not consume touches intended for the screen. */
  pointerEvents?: ViewProps["pointerEvents"];
}

/**
 * Small R3F host for `react-native-wgpu`.
 *
 * Keeping this bridge local to the three module means screens only deal with a
 * normal React component and never need to know about the native canvas
 * adapter or the WebGPU `present()` call.
 */
export function FiberCanvas({
  children,
  style,
  transparent = true,
  pointerEvents = "none",
}: FiberCanvasProps): React.JSX.Element {
  const canvasRef = useRef<CanvasRef>(null);
  const rootRef = useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null);

  useEffect(() => {
    const canvasRefValue = canvasRef.current;
    if (!canvasRefValue) {
      return undefined;
    }

    const context = canvasRefValue.getContext(
      "webgpu",
    ) as RNCanvasContext | null;
    if (!context) {
      return undefined;
    }

    const nativeCanvas = context.canvas as unknown as NativeCanvas;
    const canvas = new ReactNativeCanvas(
      nativeCanvas,
    ) as unknown as HTMLCanvasElement;
    const dpr = Math.min(PixelRatio.get(), 2);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));

    const renderer = makeWebGPURenderer(context, { antialias: true });
    const root = rootRef.current ?? createRoot(canvas);
    rootRef.current = root;
    let disposed = false;

    void root.configure({
      // `WebGPURenderer` intentionally has a different base type from
      // `WebGLRenderer`, although R3F only uses its shared render contract.
      gl: renderer as unknown as import("three").WebGLRenderer,
      size: {
        top: 0,
        left: 0,
        width: Math.max(1, canvas.clientWidth),
        height: Math.max(1, canvas.clientHeight),
      },
      events,
      frameloop: "always",
      dpr: 1,
      onCreated: (state) => {
        const webgpuRenderer = state.gl as unknown as THREE.WebGPURenderer;
        void webgpuRenderer
          .init()
          .then(() => {
            if (disposed) {
              return;
            }

            const renderFrame = webgpuRenderer.render.bind(webgpuRenderer);
            webgpuRenderer.render = (scene, camera) => {
              const result = renderFrame(scene, camera);
              context.present();
              return result;
            };
          })
          .catch(() => {
            // A custom build is required for WebGPU. If device setup is not
            // available yet, leave the host mounted so a later remount can
            // retry without taking down the surrounding detail screen.
          });
      },
    });

    return () => {
      disposed = true;
      root.unmount();
      rootRef.current = null;
      renderer.dispose();
    };
  }, []);

  // R3F owns this child tree after the native renderer is configured. Rendering
  // the latest element here lets palette and reduced-motion props update
  // without rebuilding the native surface or the renderer.
  useEffect(() => {
    rootRef.current?.render(children);
  }, [children]);

  return (
    <WebGPUCanvas
      ref={canvasRef}
      style={[{ flex: 1 }, style]}
      pointerEvents={pointerEvents}
      transparent={transparent}
    />
  );
}
