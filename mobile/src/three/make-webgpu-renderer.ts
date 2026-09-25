import type { NativeCanvas, RNCanvasContext } from "react-native-wgpu";
import * as THREE from "three/webgpu";

/**
 * The WebGPU renderer expects a DOM-like canvas. `react-native-wgpu` exposes a
 * small native surface instead, so this adapter supplies only the canvas
 * properties Three reads during setup and resize.
 */
export class ReactNativeCanvas {
  public constructor(private readonly nativeCanvas: NativeCanvas) {}

  public get width(): number {
    return this.nativeCanvas.width;
  }

  public set width(value: number) {
    this.nativeCanvas.width = value;
  }

  public get height(): number {
    return this.nativeCanvas.height;
  }

  public set height(value: number) {
    this.nativeCanvas.height = value;
  }

  public get clientWidth(): number {
    return this.nativeCanvas.clientWidth;
  }

  public set clientWidth(value: number) {
    this.nativeCanvas.clientWidth = value;
  }

  public get clientHeight(): number {
    return this.nativeCanvas.clientHeight;
  }

  public set clientHeight(value: number) {
    this.nativeCanvas.clientHeight = value;
  }

  public addEventListener(_type: string, _listener: EventListener): void {}

  public removeEventListener(_type: string, _listener: EventListener): void {}

  public dispatchEvent(_event: Event): boolean {
    return true;
  }

  public setPointerCapture(_pointerId?: number): void {}

  public releasePointerCapture(_pointerId?: number): void {}
}

/** Creates the Three WebGPU renderer for a native `react-native-wgpu` surface. */
export function makeWebGPURenderer(
  context: RNCanvasContext,
  options: { antialias?: boolean } = {},
): THREE.WebGPURenderer {
  const canvas = new ReactNativeCanvas(
    context.canvas as unknown as NativeCanvas,
  );

  // The WebGPU renderer's DOM canvas type is intentionally stricter than the
  // native surface adapter. The adapter above supplies the complete runtime
  // contract used by Three; this cast only bridges the two platform typings.
  return new THREE.WebGPURenderer({
    antialias: options.antialias ?? true,
    // @ts-expect-error Three's WebGPU typings do not expose `canvas` yet.
    canvas,
    context,
  });
}
