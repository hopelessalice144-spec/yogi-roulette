import { enforceTopLevelFrame } from './lib/frameBuster.js';
import { applyUiTheme, loadUiTheme } from './lib/uiTheme.js';
import { registerPhysicsCacheWorker } from './lib/registerServiceWorker.js';
import { startVitalsTelemetry } from './lib/startVitalsTelemetry.js';
import { runStartupAuthorityGuard } from '@core/authorityGuard.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

enforceTopLevelFrame();
applyUiTheme(loadUiTheme());
runStartupAuthorityGuard();
registerPhysicsCacheWorker();
startVitalsTelemetry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
