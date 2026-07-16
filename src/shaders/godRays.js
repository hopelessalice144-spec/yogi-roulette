import * as THREE from 'three';

export const godRayUniforms = {
  uTime: { value: 0 },
  uIntensity: { value: 0.55 },
  uMode: { value: 1 },
  uLightDir: { value: new THREE.Vector3(0.15, -0.92, 0.08).normalize() },
  uColor: { value: new THREE.Color('#ffcc55') },
};

export const godRayVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const godRayFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uMode;
  uniform vec3 uLightDir;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    float radial = 1.0 - length(uv - vec2(0.5, 0.92)) * 1.35;
    radial = clamp(radial, 0.0, 1.0);

    float shaft = pow(radial, uMode > 0.5 ? 2.8 : 5.5);
    float flicker = 0.85 + 0.15 * sin(uTime * 1.2 + uv.x * 8.0);
    float dust = noise(uv * vec2(6.0, 18.0) + uTime * 0.15) * 0.25;

    float alpha = shaft * uIntensity * flicker * (uMode > 0.5 ? 1.0 + dust : 0.65);
    vec3 col = uColor * (0.6 + shaft * 0.5);

    gl_FragColor = vec4(col, alpha * 0.42);
  }
`;

export function createGodRayMaterial(mode = 'volumetric') {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(godRayUniforms),
    vertexShader: godRayVertex,
    fragmentShader: godRayFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  mat.uniforms.uMode.value = mode === 'volumetric' ? 1 : 0;
  return mat;
}
