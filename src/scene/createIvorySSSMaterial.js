import * as THREE from 'three';
import { POLISHED_IVORY_CHROME } from './materials.js';

/**
 * Ivory SSS v3 — Fresnel-weighted subsurface scatter for dense biological translucency.
 * Light penetrates the surface, scatters warm internally, and blooms at grazing angles.
 */
export function createIvorySSSMaterial() {
  const mat = new THREE.MeshPhysicalMaterial({
    color: POLISHED_IVORY_CHROME.color,
    roughness: 0.038,
    metalness: 0.18,
    envMapIntensity: 1.92,
    clearcoat: 0.96,
    clearcoatRoughness: 0.018,
    thickness: 1.35,
    transmission: 0.11,
    attenuationColor: new THREE.Color('#ffe0c0'),
    attenuationDistance: 0.22,
    ior: 1.54,
    sheen: 0.22,
    sheenRoughness: 0.28,
    sheenColor: new THREE.Color('#fff4e8'),
  });

  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <output_fragment>',
      /* glsl */ `
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vViewPosition);
        float ndv = saturate(dot(N, V));

        // Schlick Fresnel — grazing angles scatter more light into the volume
        float F0 = 0.04;
        float fresnel = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);

        // Subsurface: light penetrates, warm internal scatter (inverse Fresnel weighting)
        float sssDepth = pow(1.0 - ndv, 4.2) * (1.0 - fresnel * 0.55);
        float sssRim = pow(1.0 - ndv, 6.5) * 0.38;
        vec3 warmScatter = vec3(1.0, 0.84, 0.66);
        outgoingLight += diffuseColor.rgb * (sssDepth * 0.68 + sssRim) * warmScatter;

        // Specular ivory highlight under tight gold spotlights
        float spec = pow(ndv, 18.0) * 0.22;
        outgoingLight += vec3(spec) * vec3(1.0, 0.96, 0.88);

        // Fresnel rim glow — polished biological surface
        outgoingLight += fresnel * vec3(0.42, 0.38, 0.32) * 0.35;

        #include <output_fragment>
      `
    );
  };
  mat.customProgramCacheKey = () => 'ivory-sss-v3';
  return mat;
}

/** Lightweight fallback when adaptive guard disables custom shader. */
export function createIvoryFallbackMaterial() {
  return new THREE.MeshPhysicalMaterial({
    ...POLISHED_IVORY_CHROME,
    clearcoat: 0.88,
    clearcoatRoughness: 0.04,
    sheen: 0.12,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color('#fff0dc'),
  });
}
