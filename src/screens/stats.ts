import { getHistory, HistoryEntry, getUserProfile } from '../db/database';

type NavigateFunction = (screen: string) => void;

export function renderStatsScreen(container: HTMLElement, navigate: NavigateFunction): void {
    const profile = getUserProfile();
    let timeRange = '7';

    function render() {
        const history = getHistory(parseInt(timeRange));
        const avg = history.length > 0 ? {
            calories: Math.round(history.reduce((a, b) => a + b.calories, 0) / history.length),
            protein: Math.round(history.reduce((a, b) => a + b.protein, 0) / history.length),
            carbs: Math.round(history.reduce((a, b) => a + b.carbs, 0) / history.length),
            fat: Math.round(history.reduce((a, b) => a + b.fat, 0) / history.length),
        } : { calories: 0, protein: 0, carbs: 0, fat: 0 };

        const maxVal = Math.max(...history.map(h => h.calories), profile?.target_calories || 2000) * 1.1;

        container.innerHTML = `
      <div class="screen">
        <div class="container">
          <header class="header">
            <h1 class="title" style="text-align: center;">📊 Tu Progreso</h1>
            <div style="display: flex; justify-content: center; margin-bottom: var(--space-lg);">
                <select id="range-select" class="input" style="width: auto; padding-right: 32px;">
                    <option value="7" ${timeRange === '7' ? 'selected' : ''}>Última semana</option>
                    <option value="30" ${timeRange === '30' ? 'selected' : ''}>Último mes</option>
                </select>
            </div>
          </header>

          ${history.length === 0 ? `
             <div class="empty-state">
              <div style="font-size: 48px; margin-bottom: 16px;">📉</div>
              <div class="text">No hay datos suficientes aún.<br>Completa días para ver estadísticas.</div>
            </div>
          ` : `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); margin-bottom: var(--space-xl);">
                 <div class="card" style="text-align: center; padding: var(--space-md);">
                    <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: 4px;">Media Calorías</div>
                    <div style="font-size: var(--font-size-xl); font-weight: 700; color: var(--color-calories);">${avg.calories}</div>
                    <div style="font-size: 10px; color: var(--color-text-muted);">Meta: ${profile?.target_calories}</div>
                 </div>
                 <div class="card" style="text-align: center; padding: var(--space-md);">
                    <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: 4px;">Media Proteína</div>
                    <div style="font-size: var(--font-size-xl); font-weight: 700; color: var(--color-protein);">${avg.protein}g</div>
                    <div style="font-size: 10px; color: var(--color-text-muted);">Meta: ${profile?.target_protein}g</div>
                 </div>
            </div>

            <div class="card" style="padding: var(--space-md); overflow-x: auto;">
                <h3 style="margin-bottom: var(--space-lg); font-size: var(--font-size-md);">Historia de Calorías</h3>
                <div style="display: flex; align-items: flex-end; gap: 8px; height: 200px; padding-bottom: 20px;">
                    ${history.map(entry => {
            const date = new Date(entry.date);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'narrow' });
            const height = (entry.calories / maxVal) * 100;
            const isOver = entry.calories > (profile?.target_calories || 2000);
            const color = isOver ? 'var(--color-error)' : 'var(--color-calories)';

            return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; min-width: 20px;">
                                <div style="width: 100%; background: ${color}; height: ${height}%; border-radius: 4px 4px 0 0; min-height: 4px; position: relative; transition: height 0.3s ease;"></div>
                                <div style="margin-top: 8px; font-size: 10px; color: var(--color-text-muted);">${dayName}</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
            
             <div class="card" style="margin-top: var(--space-lg);">
                <h3 style="margin-bottom: var(--space-md); font-size: var(--font-size-md);">Detalle Diario</h3>
                ${history.map(entry => `
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: var(--font-size-sm);">
                        <span style="color: var(--color-text-secondary);">${new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                        <div style="display: flex; gap: 12px;">
                             <span style="color: var(--color-calories); font-weight: 600;">${Math.round(entry.calories)} kcal</span>
                             <span style="color: var(--color-protein);">${Math.round(entry.protein)}g P</span>
                        </div>
                    </div>
                `).join('')}
             </div>
          `}
        </div>

        <nav class="nav-bar">
          <div class="nav-bar-inner">
            <button class="nav-item" data-screen="dashboard">
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
             <button class="nav-item active" data-screen="stats">
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

        attachEventListeners();
    }

    function attachEventListeners() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navigate(item.getAttribute('data-screen') || 'dashboard');
            });
        });

        const selector = document.getElementById('range-select');
        selector?.addEventListener('change', (e) => {
            timeRange = (e.target as HTMLSelectElement).value;
            render();
        });
    }

    render();
}
