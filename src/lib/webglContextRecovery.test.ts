import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { WebGLRenderer } from 'three';
import {
  attachWebGLContextRecovery,
  configureWebGLRenderer,
} from './webglContextRecovery.js';

type MockCanvas = {
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  emit: (type: string, event: Event) => void;
};

function mockCanvas(): MockCanvas {
  const listeners = new Map<string, EventListener>();
  return {
    addEventListener: vi.fn((type: string, fn: EventListener) => {
      listeners.set(type, fn);
    }),
    removeEventListener: vi.fn((type: string, fn: EventListener) => {
      if (listeners.get(type) === fn) listeners.delete(type);
    }),
    emit(type: string, event: Event) {
      listeners.get(type)?.(event);
    },
  };
}

describe('webglContextRecovery', () => {
  describe('configureWebGLRenderer', () => {
    it('enables soft shadows and sRGB output by default', () => {
      const gl = {
        shadowMap: { type: null as number | null, enabled: false },
        outputColorSpace: null as string | null,
      };
      configureWebGLRenderer(gl as unknown as WebGLRenderer);
      expect(gl.shadowMap.type).toBe(THREE.PCFSoftShadowMap);
      expect(gl.shadowMap.enabled).toBe(true);
      expect(gl.outputColorSpace).toBe(THREE.SRGBColorSpace);
    });

    it('allows disabling shadows', () => {
      const gl = {
        shadowMap: { type: null as number | null, enabled: true },
        outputColorSpace: null as string | null,
      };
      configureWebGLRenderer(gl as unknown as WebGLRenderer, { shadows: false });
      expect(gl.shadowMap.enabled).toBe(false);
      expect(gl.shadowMap.type).toBe(THREE.PCFSoftShadowMap);
    });
  });

  describe('attachWebGLContextRecovery', () => {
    it('registers context loss and restore listeners', () => {
      const canvas = mockCanvas();
      attachWebGLContextRecovery(canvas as unknown as HTMLCanvasElement);
      expect(canvas.addEventListener).toHaveBeenCalledWith(
        'webglcontextlost',
        expect.any(Function),
        false,
      );
      expect(canvas.addEventListener).toHaveBeenCalledWith(
        'webglcontextrestored',
        expect.any(Function),
        false,
      );
    });

    it('prevents default on context loss and invokes handler', () => {
      const canvas = mockCanvas();
      const onLost = vi.fn();
      attachWebGLContextRecovery(canvas as unknown as HTMLCanvasElement, { onLost });
      const event = new Event('webglcontextlost');
      const preventDefault = vi.spyOn(event, 'preventDefault');
      canvas.emit('webglcontextlost', event);
      expect(preventDefault).toHaveBeenCalled();
      expect(onLost).toHaveBeenCalledWith(event);
    });

    it('invokes restore handler without preventing default', () => {
      const canvas = mockCanvas();
      const onRestored = vi.fn();
      attachWebGLContextRecovery(canvas as unknown as HTMLCanvasElement, { onRestored });
      const event = new Event('webglcontextrestored');
      const preventDefault = vi.spyOn(event, 'preventDefault');
      canvas.emit('webglcontextrestored', event);
      expect(preventDefault).not.toHaveBeenCalled();
      expect(onRestored).toHaveBeenCalledWith(event);
    });

    it('detaches listeners on cleanup', () => {
      const canvas = mockCanvas();
      const detach = attachWebGLContextRecovery(canvas as unknown as HTMLCanvasElement);
      const lostHandler = canvas.addEventListener.mock.calls.find(
        ([type]) => type === 'webglcontextlost',
      )?.[1] as EventListener;
      const restoredHandler = canvas.addEventListener.mock.calls.find(
        ([type]) => type === 'webglcontextrestored',
      )?.[1] as EventListener;
      detach();
      expect(canvas.removeEventListener).toHaveBeenCalledWith(
        'webglcontextlost',
        lostHandler,
        false,
      );
      expect(canvas.removeEventListener).toHaveBeenCalledWith(
        'webglcontextrestored',
        restoredHandler,
        false,
      );
    });
  });
});
