import { describe, expect, it, vi } from 'vitest';
import {
  disposeGeometry,
  disposeMaterial,
  disposeMaterials,
  disposeObject3D,
  resetTimestepAccumulator,
  useDisposableResource,
} from './disposeUtils.js';

function mockGeometry() {
  return { dispose: vi.fn() };
}

function mockTexture() {
  return { isTexture: true, dispose: vi.fn() };
}

function mockMaterial(extra: Record<string, unknown> = {}) {
  return {
    isMaterial: true,
    dispose: vi.fn(),
    ...extra,
  };
}

describe('disposeUtils', () => {
  describe('disposeGeometry', () => {
    it('disposes geometry when present', () => {
      const geometry = mockGeometry();
      disposeGeometry(geometry);
      expect(geometry.dispose).toHaveBeenCalledTimes(1);
    });

    it('no-ops for missing geometry', () => {
      expect(() => disposeGeometry(null)).not.toThrow();
      expect(() => disposeGeometry(undefined)).not.toThrow();
    });
  });

  describe('disposeMaterial', () => {
    it('disposes material and attached textures', () => {
      const map = mockTexture();
      const material = mockMaterial({ map });
      disposeMaterial(material);
      expect(material.dispose).toHaveBeenCalledTimes(1);
      expect(map.dispose).toHaveBeenCalledTimes(1);
    });

    it('disposes each material in an array', () => {
      const a = mockMaterial();
      const b = mockMaterial();
      disposeMaterial([a, b]);
      expect(a.dispose).toHaveBeenCalledTimes(1);
      expect(b.dispose).toHaveBeenCalledTimes(1);
    });

    it('no-ops for missing material', () => {
      expect(() => disposeMaterial(null)).not.toThrow();
    });
  });

  describe('disposeMaterials', () => {
    it('recurses nested material groups', () => {
      const inner = mockMaterial({ map: mockTexture() });
      const outer = mockMaterial();
      disposeMaterials({
        shell: { inner: [inner] },
        rim: outer,
      });
      expect(inner.dispose).toHaveBeenCalledTimes(1);
      expect(outer.dispose).toHaveBeenCalledTimes(1);
    });

    it('no-ops for missing collection', () => {
      expect(() => disposeMaterials(null)).not.toThrow();
    });
  });

  describe('disposeObject3D', () => {
    it('traverses children and disposes geometry/material', () => {
      const geometry = mockGeometry();
      const material = mockMaterial({ normalMap: mockTexture() });
      const child = { geometry, material };
      const root = {
        traverse: (fn: (node: typeof child) => void) => fn(child),
      };
      disposeObject3D(root);
      expect(geometry.dispose).toHaveBeenCalledTimes(1);
      expect(material.dispose).toHaveBeenCalledTimes(1);
    });

    it('no-ops for missing object', () => {
      expect(() => disposeObject3D(null)).not.toThrow();
    });
  });

  describe('resetTimestepAccumulator', () => {
    it('zeros accumulator value', () => {
      const acc = { value: 0.42 };
      resetTimestepAccumulator(acc);
      expect(acc.value).toBe(0);
    });

    it('no-ops for missing accumulator', () => {
      expect(() => resetTimestepAccumulator(null)).not.toThrow();
    });
  });

  describe('useDisposableResource', () => {
    it('returns cleanup that disposes ref.current and clears it', () => {
      const resource = { id: 'wheel-mesh' };
      const ref = { current: resource as { id: string } | null };
      const disposer = vi.fn();
      const cleanup = useDisposableResource(ref, disposer);
      cleanup();
      expect(disposer).toHaveBeenCalledWith(resource);
      expect(ref.current).toBeNull();
    });

    it('skips disposer when ref is already empty', () => {
      const ref = { current: null as { id: string } | null };
      const disposer = vi.fn();
      useDisposableResource(ref, disposer)();
      expect(disposer).not.toHaveBeenCalled();
    });
  });
});
