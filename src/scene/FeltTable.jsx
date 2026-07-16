import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useMaterials } from './MaterialLibrary.jsx';

/**
 * Neon-lit casino plinth with velvet felt — shared materials.
 */
export function FeltTable() {
  const { tableFelt, neonRing, plinth } = useMaterials();
  const neonMatRef = useRef(neonRing);

  useFrame((state) => {
    const mat = neonMatRef.current;
    if (mat) {
      mat.emissiveIntensity = 0.35 + Math.sin(state.clock.elapsedTime * 2.2) * 0.12;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} material={tableFelt}>
        <circleGeometry args={[2.65, 64]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} material={neonRing}>
        <ringGeometry args={[2.62, 2.72, 64]} />
      </mesh>

      <mesh receiveShadow position={[0, -0.08, 0]} material={plinth}>
        <cylinderGeometry args={[2.78, 2.95, 0.16, 64]} />
      </mesh>
    </group>
  );
}
