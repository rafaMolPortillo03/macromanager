import { getUserProfile, getTodayLog, calculateDailyTotals, deleteLogEntry, archiveToday, DailyLogEntry } from '../db/database';
import { calculateProgress, formatNumber } from '../utils/macros';

type NavigateFunction = (screen: string) => void;

export function renderDashboard(container: HTMLElement, navigate: NavigateFunction): void {
  const profile = getUserProfile();

  if (!profile) {
    navigate('setup');
    return;
  }

  const todayLog = getTodayLog();
  const totals = calculateDailyTotals(todayLog);

  const remaining = {
    calories: Math.max(0, profile.target_calories - totals.calories),
    protein: Math.max(0, profile.target_protein - totals.protein),
    carbs: Math.max(0, profile.target_carbs - totals.carbs),
    fat: Math.max(0, profile.target_fat - totals.fat)
  };

  const progress = {
    calories: calculateProgress(totals.calories, profile.target_calories),
    protein: calculateProgress(totals.protein, profile.target_protein),
    carbs: calculateProgress(totals.carbs, profile.target_carbs),
    fat: calculateProgress(totals.fat, profile.target_fat)
  };

  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  };
  const formattedDate = today.toLocaleDateString('es-ES', dateOptions);

  const hour = today.getHours();
  let greeting = 'Buenos días ☀️';
  if (hour >= 14 && hour < 21) greeting = 'Buenas tardes 🌤️';
  else if (hour >= 21 || hour < 6) greeting = 'Buenas noches 🌙';

  container.innerHTML = `
    <div class="screen">
      <div class="container">
        <header class="header" style="position: relative;">
          <div class="header-date">📅 ${formattedDate}</div>
          <div class="header-greeting">${greeting}, ${profile.name || 'Usuario'}</div>
        </header>

        <div class="card" style="text-align: center; margin-bottom: var(--space-lg);">
          <div class="progress-ring-container" style="margin: 0 auto;">
            <svg class="progress-ring" width="180" height="180">
              <circle 
                class="progress-ring-bg" 
                cx="90" cy="90" r="75"
                stroke-width="12"
              />
              <circle 
                class="progress-ring-progress" 
                cx="90" cy="90" r="75"
                stroke-width="12"
                stroke="var(--color-calories)"
                stroke-dasharray="${2 * Math.PI * 75}"
                stroke-dashoffset="${2 * Math.PI * 75 * (1 - progress.calories / 100)}"
              />
            </svg>
            <div class="progress-ring-text">
              <div class="progress-ring-value" style="color: var(--color-calories);">
                ${formatNumber(totals.calories)}
              </div>
              <div class="progress-ring-label">
                de ${formatNumber(profile.target_calories)} kcal
              </div>
            </div>
          </div>

          <div style="margin-top: var(--space-md); color: var(--color-text-secondary);">
            Te quedan <strong style="color: var(--color-calories);">${formatNumber(remaining.calories)}</strong> kcal 🔥
          </div>
        </div>

        <div class="macro-grid">
          <div class="macro-card protein">
            <div class="name">🥩 Proteína</div>
            <div class="value">${Math.round(totals.protein)}g</div>
            <div class="target">/ ${profile.target_protein}g</div>
            <div class="progress-bar">
              <div class="progress-bar-fill protein" style="width: ${progress.protein}%"></div>
            </div>
          </div>

          <div class="macro-card carbs">
            <div class="name">🍞 Carbos</div>
            <div class="value">${Math.round(totals.carbs)}g</div>
            <div class="target">/ ${profile.target_carbs}g</div>
            <div class="progress-bar">
              <div class="progress-bar-fill carbs" style="width: ${progress.carbs}%"></div>
            </div>
          </div>

          <div class="macro-card fat">
            <div class="name">🥑 Grasa</div>
            <div class="value">${Math.round(totals.fat)}g</div>
            <div class="target">/ ${profile.target_fat}g</div>
            <div class="progress-bar">
              <div class="progress-bar-fill fat" style="width: ${progress.fat}%"></div>
            </div>
          </div>
        </div>

        <div class="food-list">
          <div class="food-list-header">
            <span class="food-list-title">🍽️ Hoy has comido</span>
            <span style="color: var(--color-text-muted); font-size: var(--font-size-sm);">
              ${todayLog.length} entradas
            </span>
          </div>

          ${todayLog.length === 0 ? `
            <div class="empty-state">
              <div style="font-size: 48px; margin-bottom: 16px;">😴</div>
              <div class="text">Aún no has registrado nada hoy</div>
            </div>
          ` : todayLog.map(entry => renderFoodItem(entry)).join('')}
        </div>

        ${todayLog.length > 0 ? `
        <button id="finish-day-btn" class="btn btn-block btn-secondary" style="margin-top: 32px; border: 1px solid var(--color-text-muted); color: var(--color-text-muted);">
           🏁 Terminar día y Resetear
        </button>
        ` : ''}

      </div>

      <nav class="nav-bar">
        <div class="nav-bar-inner">
          <button class="nav-item active" data-screen="dashboard">
            <span class="icon">🏠</span>
            <span>Inicio</span>
          </button>
          <button class="nav-item" data-screen="add-food">
            <span class="icon">➕</span>
            <span>Añadir</span>
          </button>
          <button class="nav-item" data-screen="foods">
            <span class="icon">🍎</span>
            <span>Alimentos</span>
          </button>
           <button class="nav-item" data-screen="stats">
            <span class="icon">📊</span>
            <span>Progreso</span>
          </button>
          <button class="nav-item" data-screen="settings">
            <span class="icon">⚙️</span>
            <span>Ajustes</span>
          </button>
        </div>
      </nav>
    </div>
  `;

  attachEventListeners(navigate, container);
}

function renderFoodItem(entry: DailyLogEntry): string {
  if (!entry.food) return '';

  const multiplier = entry.grams / 100;
  const calories = Math.round(entry.food.calories * multiplier);
  const protein = Math.round(entry.food.protein * multiplier);

  const mealTypeLabels: Record<string, string> = {
    breakfast: '🌅 Desayuno',
    lunch: '☀️ Comida',
    dinner: '🌙 Cena',
    snack: '🍪 Snack'
  };

  return `
    <div class="food-item" data-id="${entry.id}">
      <div class="info">
        <div class="name">${entry.food.name}</div>
        <div class="meta">${entry.grams}g · ${protein}g prot · ${mealTypeLabels[entry.meal_type] || ''}</div>
      </div>
      <div class="calories">${calories} kcal</div>
      <button class="delete-btn" data-delete-id="${entry.id}" title="Eliminar">🗑️</button>
    </div>
  `;
}

function attachEventListeners(navigate: NavigateFunction, container: HTMLElement): void {

  const addBtn = document.getElementById('add-food-btn');
  addBtn?.addEventListener('click', () => navigate('add-food'));

  const finishBtn = document.getElementById('finish-day-btn');
  finishBtn?.addEventListener('click', () => {
    if (confirm('¿Seguro que quieres terminar el día? Se guardarán los totales y se vaciará el registro de hoy.')) {
      archiveToday();
      renderDashboard(container, navigate);
    }
  });

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const screen = item.getAttribute('data-screen');
      if (screen) navigate(screen);
    });
  });

  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-delete-id') || '0');
      if (id && confirm('¿Eliminar esta entrada?')) {
        deleteLogEntry(id);
        renderDashboard(container, navigate);
      }
    });
  });
}
