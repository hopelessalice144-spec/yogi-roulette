import { useEffect, useRef, useState } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

/**
 * Floating +$ win indicator with scale pulse.
 */
export function FloatingWinText({ amount, trigger }) {
  const [visible, setVisible] = useState(false);
  const yRef = useRef(0.5);
  const scaleRef = useRef(1);
  const lifeRef = useRef(0);

  useEffect(() => {
    if (!trigger || amount <= 0) return;
    setVisible(true);
    yRef.current = 0.5;
    scaleRef.current = 0.4;
    lifeRef.current = 0;
    const t = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(t);
  }, [trigger, amount]);

  useFrame((_, delta) => {
    if (!visible) return;
    lifeRef.current += delta;
    yRef.current += delta * 0.4;
    scaleRef.current += (1.15 - scaleRef.current) * Math.min(1, delta * 8);
    if (lifeRef.current > 2.2) {
      scaleRef.current *= 1 - delta * 0.8;
    }
  });

  if (!visible || amount <= 0) return null;

  const label =
    amount >= 0 ? `+$${amount.toLocaleString()}` : `-$${Math.abs(amount).toLocaleString()}`;

  return (
    <Text
      position={[0, yRef.current, 0]}
      scale={scaleRef.current}
      fontSize={0.28}
      color="#ffd700"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor="#1a0f00"
    >
      {label}
    </Text>
  );
}
