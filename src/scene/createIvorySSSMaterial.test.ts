import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { POLISHED_IVORY_CHROME } from './materials.js';
import {
  createIvoryFallbackMaterial,
  createIvorySSSMaterial,
} from './createIvorySSSMaterial.js';

describe('createIvorySSSMaterial', () => {
  describe('createIvorySSSMaterial', () => {
    it('builds a physical material from the polished ivory preset', () => {
      const mat = createIvorySSSMaterial();
      expect(mat).toBeInstanceOf(THREE.MeshPhysicalMaterial);
      expect(mat.color.getHexString()).toBe(POLISHED_IVORY_CHROME.color.slice(1));
      expect(mat.metalness).toBe(0.18);
      expect(mat.roughness).toBe(0.038);
      expect(mat.envMapIntensity).toBe(1.92);
    });

    it('configures subsurface transmission and thickness', () => {
      const mat = createIvorySSSMaterial();
      expect(mat.transmission).toBe(0.11);
      expect(mat.thickness).toBe(1.35);
      expect(mat.ior).toBe(1.54);
      expect(mat.attenuationDistance).toBe(0.22);
      expect(mat.attenuationColor?.getHexString()).toBe('ffe0c0');
      expect(mat.sheenColor?.getHexString()).toBe('fff4e8');
    });

    it('patches the fragment shader with Fresnel-weighted SSS', () => {
      const mat = createIvorySSSMaterial();
      const shader = {
        fragmentShader: 'void main() {\n#include <output_fragment>\n}',
      } as THREE.WebGLProgramParametersWithUniforms;
      const renderer = {} as THREE.WebGLRenderer;
      mat.onBeforeCompile(shader, renderer);
      expect(shader.fragmentShader).toContain('warmScatter');
      expect(shader.fragmentShader).toContain('sssDepth');
      expect(shader.fragmentShader).toContain('#include <output_fragment>');
    });

    it('uses a stable custom program cache key', () => {
      const mat = createIvorySSSMaterial();
      expect(mat.customProgramCacheKey?.()).toBe('ivory-sss-v3');
    });
  });

  describe('createIvoryFallbackMaterial', () => {
    it('returns a lightweight physical material without custom shader hooks', () => {
      const mat = createIvoryFallbackMaterial();
      const sss = createIvorySSSMaterial();
      expect(mat).toBeInstanceOf(THREE.MeshPhysicalMaterial);
      expect(mat.color.getHexString()).toBe(POLISHED_IVORY_CHROME.color.slice(1));
      expect(mat.clearcoat).toBe(0.88);
      expect(mat.sheen).toBe(0.12);
      expect(mat.customProgramCacheKey?.()).not.toBe('ivory-sss-v3');

      const shader = {
        fragmentShader: '#include <output_fragment>',
      } as THREE.WebGLProgramParametersWithUniforms;
      const renderer = {} as THREE.WebGLRenderer;
      mat.onBeforeCompile(shader, renderer);
      expect(shader.fragmentShader).not.toContain('warmScatter');
      expect(sss.customProgramCacheKey?.()).toBe('ivory-sss-v3');
    });
  });
});
