import { useCallback, useEffect, useRef, useState } from 'react';
import {
  attachWebGLContextRecovery,
  configureWebGLRenderer,
} from '../lib/webglContextRecovery.js';

/**
 * Remounts the R3F Canvas after WebGL context restore and surfaces loss state for UI.
 * @param {{ onRestore?: () => void }} [opts]
 */
export function useWebGLRecovery({ onRestore } = {}) {
  const [canvasKey, setCanvasKey] = useState(0);
  const [webglStatus, setWebglStatus] = useState('ok');
  const cleanupRef = useRef(null);
  const onRestoreRef = useRef(onRestore);

  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const attachToCanvas = useCallback((gl, rendererSettings = {}) => {
    cleanupRef.current?.();
    configureWebGLRenderer(gl, rendererSettings);
    cleanupRef.current = attachWebGLContextRecovery(gl.domElement, {
      onLost: () => setWebglStatus('lost'),
      onRestored: () => {
        setWebglStatus('recovering');
        onRestoreRef.current?.();
        setCanvasKey((key) => key + 1);
        setWebglStatus('ok');
      },
    });
  }, []);

  return { canvasKey, webglStatus, attachToCanvas };
}
