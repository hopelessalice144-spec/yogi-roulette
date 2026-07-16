/**
 * Three.js resource disposal helpers — prevent GPU / geometry leaks.
 */

export function disposeGeometry(geometry) {
  geometry?.dispose?.();
}

export function disposeMaterial(material) {
  if (!material) return;
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }
  material.dispose?.();
  for (const key of Object.keys(material)) {
    const val = material[key];
    if (val?.isTexture) val.dispose?.();
  }
}

/** Batch-dispose cloned wheel / shader materials. */
export function disposeMaterials(materials) {
  if (!materials) return;
  const list = Array.isArray(materials) ? materials : Object.values(materials);
  for (const m of list) {
    if (m && typeof m === 'object' && !m.isMaterial && !m.isTexture) {
      disposeMaterials(m);
    } else {
      disposeMaterial(m);
    }
  }
}

export function disposeObject3D(object) {
  if (!object) return;
  object.traverse?.((child) => {
    if (child.geometry) disposeGeometry(child.geometry);
    if (child.material) disposeMaterial(child.material);
  });
}

/** Reset fixed-timestep accumulator after tab-resume teleport. */
export function resetTimestepAccumulator(accumulator) {
  if (accumulator) accumulator.value = 0;
}

/** React effect cleanup for shader materials + dynamic geometries. */
export function useDisposableResource(ref, disposer) {
  return () => {
    const resource = ref.current;
    if (resource) disposer(resource);
    ref.current = null;
  };
}
