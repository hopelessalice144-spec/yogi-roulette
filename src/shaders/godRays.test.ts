import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createGodRayMaterial,
  godRayFragment,
  godRayUniforms,
  godRayVertex,
} from './godRays.js';

describe('godRays', () => {
  describe('godRayUniforms', () => {
    it('defines default volumetric shaft driver uniforms', () => {
      expect(godRayUniforms.uTime.value).toBe(0);
      expect(godRayUniforms.uIntensity.value).toBe(0.55);
      expect(godRayUniforms.uMode.value).toBe(1);
      expect(godRayUniforms.uColor.value.getHexString()).toBe('ffcc55');
      expect(godRayUniforms.uLightDir.value.length()).toBeCloseTo(1, 5);
    });
  });

  describe('shader sources', () => {
    it('exports vertex varyings for screen-space god rays', () => {
      expect(godRayVertex).toContain('varying vec2 vUv');
      expect(godRayVertex).toContain('varying vec3 vWorldPos');
      expect(godRayVertex).toContain('gl_Position');
    });

    it('exports fragment radial shaft with procedural dust noise', () => {
      expect(godRayFragment).toContain('uniform float uMode');
      expect(godRayFragment).toContain('uniform vec3 uLightDir');
      expect(godRayFragment).toContain('float noise(vec2 p)');
      expect(godRayFragment).toContain('gl_FragColor');
    });
  });

  describe('createGodRayMaterial', () => {
    it('builds an additive transparent ShaderMaterial', () => {
      const mat = createGodRayMaterial();
      expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
      expect(mat.transparent).toBe(true);
      expect(mat.depthWrite).toBe(false);
      expect(mat.blending).toBe(THREE.AdditiveBlending);
      expect(mat.side).toBe(THREE.DoubleSide);
    });

    it('clones uniforms and wires exported shader sources', () => {
      const mat = createGodRayMaterial();
      expect(mat.uniforms).not.toBe(godRayUniforms);
      expect(mat.uniforms.uIntensity.value).toBe(0.55);
      expect(mat.vertexShader).toBe(godRayVertex);
      expect(mat.fragmentShader).toBe(godRayFragment);
    });

    it('maps volumetric mode to uMode=1 and gradient to uMode=0', () => {
      expect(createGodRayMaterial('volumetric').uniforms.uMode.value).toBe(1);
      expect(createGodRayMaterial('gradient').uniforms.uMode.value).toBe(0);
      expect(createGodRayMaterial().uniforms.uMode.value).toBe(1);
    });
  });
});
