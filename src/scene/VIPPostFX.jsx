import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useGame } from '../context/GameContext.jsx';

/** VIP color grade — selective bloom on emissive neon only; tier-aware threshold. */
export function VIPPostFX() {
  const { qualitySettings } = useGame();

  if (!qualitySettings.postFx) return null;

  const threshold = qualitySettings.bloomThreshold ?? 0.78;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={qualitySettings.bloomIntensity}
        luminanceThreshold={threshold}
        luminanceSmoothing={0.38}
        mipmapBlur
        radius={0.72}
      />
      {qualitySettings.chromaticAberration && (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0009, 0.0012]}
        />
      )}
      <Vignette eskil={false} offset={0.2} darkness={0.72} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
