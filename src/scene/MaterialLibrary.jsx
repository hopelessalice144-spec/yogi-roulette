import { createContext, useContext, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGame } from '../context/GameContext.jsx';
import {
  BOWL_METAL,
  LUXURY_GOLD,
  MAHOGANY_LACQUER,
  NEON_RING,
  PLINTH_METAL,
  POCKET_FELT,
  SPINDLE_APEX,
  TABLE_FELT,
} from './materials.js';
import { createIvoryFallbackMaterial, createIvorySSSMaterial } from './createIvorySSSMaterial.js';
import { disposeMaterials } from '../lib/disposeUtils.js';
const MaterialCtx = createContext(null);

/** Shared GPU materials — quality-tier aware (ivory SSS degrades on low tier). */
export function MaterialLibrary({ children }) {
  const { qualitySettings } = useGame();

  const materials = useMemo(() => {
    const pocket = {
      red: new THREE.MeshPhysicalMaterial({
        ...POCKET_FELT.red,
        emissive: new THREE.Color('#ff1a3a'),
        emissiveIntensity: 0,
      }),
      black: new THREE.MeshPhysicalMaterial({
        ...POCKET_FELT.black,
        emissive: new THREE.Color('#4488ff'),
        emissiveIntensity: 0,
      }),
      green: new THREE.MeshPhysicalMaterial({
        ...POCKET_FELT.green,
        emissive: new THREE.Color('#00ffc8'),
        emissiveIntensity: 0,
      }),
    };

    return {
      mahogany: new THREE.MeshPhysicalMaterial(MAHOGANY_LACQUER),
      gold: new THREE.MeshPhysicalMaterial(LUXURY_GOLD),
      spindle: new THREE.MeshPhysicalMaterial(SPINDLE_APEX),
      bowl: new THREE.MeshPhysicalMaterial(BOWL_METAL),
      tableFelt: new THREE.MeshPhysicalMaterial(TABLE_FELT),
      neonRing: new THREE.MeshPhysicalMaterial(NEON_RING),
      plinth: new THREE.MeshPhysicalMaterial(PLINTH_METAL),
      pocket,
      ivoryBall: qualitySettings.ivorySSS
        ? createIvorySSSMaterial()
        : createIvoryFallbackMaterial(),
      neonUnderline: new THREE.MeshBasicMaterial({
        color: '#00ffc8',
        transparent: true,
        opacity: 0,
        toneMapped: false,
        depthWrite: false,
      }),
    };
  }, [qualitySettings.ivorySSS]);

  useEffect(() => {
    const snapshot = materials;
    return () => disposeMaterials(snapshot);
  }, [materials]);

  return <MaterialCtx.Provider value={materials}>{children}</MaterialCtx.Provider>;
}

export function useMaterials() {
  const ctx = useContext(MaterialCtx);
  if (!ctx) throw new Error('useMaterials requires MaterialLibrary');
  return ctx;
}
