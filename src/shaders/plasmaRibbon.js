import * as THREE from 'three';

export const plasmaRibbonUniforms = {
  uTime: { value: 0 },
  uIntensity: { value: 0 },
  uSpread: { value: 1 },
  uColorHot: { value: new THREE.Color('#00ffc8') },
  uColorCold: { value: new THREE.Color('#4466ff') },
};

export const plasmaRibbonVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vAlong;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vAlong = uv.x;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const plasmaRibbonFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSpread;
  uniform vec3 uColorHot;
  uniform vec3 uColorCold;
  varying vec2 vUv;
  varying float vAlong;
  varying vec3 vWorldPos;

  void main() {
    float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
    edge = pow(max(edge, 0.0), 1.4);

    float pulse = 0.5 + 0.5 * sin(vAlong * 18.0 - uTime * 4.5);
    float scan = 0.5 + 0.5 * sin(vAlong * 42.0 + uTime * 2.2);
    float plasma = pulse * scan * edge;

    float focus = 1.0 - uSpread;
    vec3 col = mix(uColorCold, uColorHot, focus + plasma * 0.35);
    float alpha = plasma * uIntensity * (0.35 + focus * 0.45) * edge;

    gl_FragColor = vec4(col, alpha);
  }
`;

export function createPlasmaRibbonMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(plasmaRibbonUniforms),
    vertexShader: plasmaRibbonVertex,
    fragmentShader: plasmaRibbonFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}
