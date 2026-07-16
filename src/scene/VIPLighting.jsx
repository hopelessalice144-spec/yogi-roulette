/** Moody VIP casino lounge — warm key, cool rim, wheel spotlight ring. */

export function VIPLighting({ shadowsEnabled = true, shadowMapSize = 2048 }) {
  const mapSize = shadowsEnabled ? shadowMapSize : 512;

  return (
    <>
      <ambientLight intensity={0.09} color="#140f1e" />
      <hemisphereLight intensity={0.2} color="#3a2848" groundColor="#080408" />

      <directionalLight
        castShadow={shadowsEnabled}
        position={[3.5, 11, 4.5]}
        intensity={1.25}
        color="#ffe6c8"
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-camera-near={0.25}
        shadow-camera-far={22}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-radius={4}
        shadow-blurSamples={10}
        shadow-bias={-0.0001}
        shadow-normalBias={0.018}
      />

      <directionalLight position={[-6, 7, -3.5]} intensity={0.32} color="#5a8ee8" />
      <directionalLight position={[0, 2.5, -7]} intensity={0.18} color="#a040ff" />

      <spotLight
        castShadow={shadowsEnabled}
        position={[0.8, 7.5, 1.8]}
        angle={0.32}
        penumbra={0.78}
        intensity={4.2}
        color="#ffcc55"
        distance={18}
        decay={2}
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-radius={3}
        shadow-bias={-0.00006}
      >
        <object3D attach="target" position={[0, 0.28, 0]} />
      </spotLight>

      <spotLight
        position={[-2.8, 5.2, 2.6]}
        angle={0.45}
        penumbra={0.85}
        intensity={1.1}
        color="#00ffc8"
        distance={14}
        decay={2}
      />

      <spotLight
        position={[2.6, 4.8, -2.2]}
        angle={0.5}
        penumbra={0.9}
        intensity={0.65}
        color="#ff4466"
        distance={12}
        decay={2}
      />

      <pointLight position={[0, 2.8, 0]} intensity={0.55} color="#ffb84d" distance={5.5} decay={2} />
      <pointLight position={[0, 0.45, 2.4]} intensity={0.3} color="#ff6688" distance={4.5} decay={2} />
      <pointLight position={[0, 5.2, 0]} intensity={0.22} color="#fff4d8" distance={8} decay={2} />
    </>
  );
}
