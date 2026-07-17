import { useEffect, useRef, useState } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../context/GameContext.jsx';
import { WIN_TIERS } from '../lib/winCelebration.js';

/**
 * Floating +$ win indicator with tier-scaled pulse.
 */
export function FloatingWinText({ amount, trigger }) {
  const { winCelebration } = useGame();
  const tier = WIN_TIERS[winCelebration?.tier] ?? WIN_TIERS.none;
  const [visible, setVisible] = useState(false);
  const yRef = useRef(0.5);
  const scaleRef = useRef(1);
  const lifeRef = useRef(0);

  useEffect(() => {
    if (!trigger || amount <= 0) return;
    setVisible(true);
    yRef.current = 0.5;
    scaleRef.current = 0.35 + tier.particleScale * 0.08;
    lifeRef.current = 0;
    const duration = 2600 + tier.particleScale * 500;
    const t = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(t);
  }, [trigger, amount, tier.particleScale]);

  useFrame((_, delta) => {
    if (!visible) return;
    lifeRef.current += delta;
    yRef.current += delta * (0.35 + tier.particleScale * 0.08);
    const targetScale = 1.05 + tier.particleScale * 0.12;
    scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, delta * 8);
    if (lifeRef.current > 2) {
      scaleRef.current *= 1 - delta * 0.75;
    }
  });

  if (!visible || amount <= 0) return null;

  const label =
    amount >= 0 ? `+$${amount.toLocaleString()}` : `-$${Math.abs(amount).toLocaleString()}`;

  return (
    <Text
      position={[0, yRef.current, 0]}
      scale={scaleRef.current}
      fontSize={0.24 + tier.particleScale * 0.05}
      color={tier.textColor}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02 + tier.particleScale * 0.006}
      outlineColor="#1a0f00"
    >
      {label}
    </Text>
  );
}
