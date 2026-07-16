import { useCallback, useEffect, useState } from 'react';
import { getInstallPromptBridge } from '../lib/installPrompt.js';
import APP_CONFIG from '@core/config.js';

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const bridge = getInstallPromptBridge();

  useEffect(() => {
    if (bridge.isInstalled() || bridge.wasDismissed()) return undefined;
    return bridge.subscribe((canInstall) => setVisible(canInstall));
  }, [bridge]);

  const onInstall = useCallback(async () => {
    const { outcome } = await bridge.prompt();
    if (outcome !== 'unavailable') setVisible(false);
  }, [bridge]);

  const onDismiss = useCallback(() => {
    bridge.markDismissed();
    setVisible(false);
  }, [bridge]);

  if (!visible) return null;

  return (
    <div className="install-prompt" role="dialog" aria-labelledby="install-prompt-title">
      <div className="install-prompt-panel">
        <div className="install-prompt-copy">
          <strong id="install-prompt-title">Install {APP_CONFIG.name}</strong>
          <p>Add to your home screen for full-screen VIP play and faster physics loads.</p>
        </div>
        <div className="install-prompt-actions">
          <button type="button" className="install-prompt-btn install-prompt-btn--primary" onClick={onInstall}>
            Install
          </button>
          <button type="button" className="install-prompt-btn" onClick={onDismiss} aria-label="Dismiss install prompt">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
