import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createPlasmaRibbonMaterial,
  plasmaRibbonFragment,
  plasmaRibbonUniforms,
  plasmaRibbonVertex,
} from './plasmaRibbon.js';

describe('plasmaRibbon', () => {
  describe('plasmaRibbonUniforms', () => {
    it('defines default quantum arc driver uniforms', () => {
      expect(plasmaRibbonUniforms.uTime.value).toBe(0);
      expect(plasmaRibbonUniforms.uIntensity.value).toBe(0);
      expect(plasmaRibbonUniforms.uSpread.value).toBe(1);
      expect(plasmaRibbonUniforms.uColorHot.value.getHexString()).toBe('00ffc8');
      expect(plasmaRibbonUniforms.uColorCold.value.getHexString()).toBe('4466ff');
    });
  });

  describe('shader sources', () => {
    it('exports vertex varyings for arc UV and world position', () => {
      expect(plasmaRibbonVertex).toContain('varying vec2 vUv');
      expect(plasmaRibbonVertex).toContain('varying float vAlong');
      expect(plasmaRibbonVertex).toContain('varying vec3 vWorldPos');
      expect(plasmaRibbonVertex).toContain('gl_Position');
    });

    it('exports fragment plasma mix with hot/cold palette', () => {
      expect(plasmaRibbonFragment).toContain('uniform float uTime');
      expect(plasmaRibbonFragment).toContain('uniform float uSpread');
      expect(plasmaRibbonFragment).toContain('mix(uColorCold, uColorHot');
      expect(plasmaRibbonFragment).toContain('gl_FragColor');
    });
  });

  describe('createPlasmaRibbonMaterial', () => {
    it('builds an additive transparent ShaderMaterial', () => {
      const mat = createPlasmaRibbonMaterial();
      expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
      expect(mat.transparent).toBe(true);
      expect(mat.depthWrite).toBe(false);
      expect(mat.blending).toBe(THREE.AdditiveBlending);
      expect(mat.side).toBe(THREE.DoubleSide);
    });

    it('clones uniforms and wires exported shader sources', () => {
      const mat = createPlasmaRibbonMaterial();
      expect(mat.uniforms).not.toBe(plasmaRibbonUniforms);
      expect(mat.uniforms.uSpread.value).toBe(1);
      expect(mat.vertexShader).toBe(plasmaRibbonVertex);
      expect(mat.fragmentShader).toBe(plasmaRibbonFragment);
    });
  });
});
