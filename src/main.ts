import './styles/main.css';
import { initDatabase, getUserProfile } from './db/database';
import { renderSetupScreen } from './screens/setup';
import { renderDashboard } from './screens/dashboard';
import { renderAddFoodScreen } from './screens/add-food';
import { renderFoodsScreen } from './screens/foods';
import { renderSettingsScreen } from './screens/settings';
import { renderStatsScreen } from './screens/stats';

const app = document.getElementById('app')!;

let currentScreen = 'loading';

function navigate(screen: string) {
  currentScreen = screen;
  renderCurrentScreen();
}

function renderCurrentScreen() {
  switch (currentScreen) {
    case 'setup':
      renderSetupScreen(app, navigate);
      break;
    case 'dashboard':
      renderDashboard(app, navigate);
      break;
    case 'add-food':
      renderAddFoodScreen(app, navigate);
      break;
    case 'foods':
      renderFoodsScreen(app, navigate);
      break;
    case 'stats':
      renderStatsScreen(app, navigate);
      break;
    case 'settings':
      renderSettingsScreen(app, navigate);
      break;
    default:
      renderLoadingScreen();
  }
}

function renderLoadingScreen() {
  app.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    ">
      <div style="font-size: 64px; font-weight: bold; animation: pulse 1.5s ease-in-out infinite;">MM</div>
      <div style="color: var(--color-text-secondary);">Cargando MacroManager...</div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    </style>
  `;
}

async function init() {
  renderLoadingScreen();

  try {
    await initDatabase();
    const profile = getUserProfile();

    if (profile) {
      navigate('dashboard');
    } else {
      navigate('setup');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    app.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 24px;
        text-align: center;
        background: #0f0f1a;
        color: white;
      ">
        <div style="font-size: 48px; font-weight: bold;">MM</div>
        <div style="font-size: 18px; font-weight: 600;">Error al iniciar</div>
        <div style="color: #a0a0b8; font-size: 14px; max-width: 300px;">
          ${errorMessage}
        </div>
        <button onclick="location.reload()" style="
          margin-top: 16px;
          padding: 12px 24px;
          background: #6c5ce7;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          cursor: pointer;
        ">Recargar</button>
      </div>
    `;
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { });
  });
}

init();
