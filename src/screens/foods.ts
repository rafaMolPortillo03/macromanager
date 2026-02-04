import { getAllFoods, addCustomFood, Food } from '../db/database';

type NavigateFunction = (screen: string) => void;

export function renderFoodsScreen(container: HTMLElement, navigate: NavigateFunction): void {
  let searchQuery = '';
  let showAddModal = false;
  let foods: Food[] = [];

  function loadFoods() {
    foods = getAllFoods();
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      foods = foods.filter(f => f.name.toLowerCase().includes(query));
    }
  }

  function render() {
    loadFoods();

    container.innerHTML = `
      <div class="screen">
        <div class="container">
          <header style="padding: var(--space-lg) 0;">
            <h1 class="title">🍎 Mis Alimentos</h1>
            <p class="subtitle" style="margin-bottom: var(--space-lg);">
              ${foods.length} alimentos guardados
            </p>

            <!-- Buscador -->
            <div class="search-container">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                class="input search-input" 
                id="search-input"
                placeholder="Buscar en mi lista..."
                value="${searchQuery}"
              />
            </div>
          </header>

          <div>
             ${foods.map(food => renderFoodCard(food)).join('')}
             ${foods.length === 0 ? `
                <div class="empty-state">
                  <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                  <p style="text-align:center; color: var(--color-text-secondary);">
                    No tienes alimentos guardados.<br/>
                    Ve a "Añadir" para buscar online.
                  </p>
                </div>
             ` : ''}
          </div>

          <div style="height: 100px;"></div>
        </div>

        <!-- FAB para añadir alimento personalizado -->
        <button class="btn btn-primary btn-fab" id="add-custom-btn">➕</button>

        <!-- Navegación -->
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
            <button class="nav-item active" data-screen="foods">
              <span class="icon">🍎</span>
              <span>Alimentos</span>
            </button>
            <button class="nav-item" data-screen="settings">
              <span class="icon">⚙️</span>
              <span>Ajustes</span>
            </button>
          </div>
        </nav>
      </div>

      ${showAddModal ? renderAddModal() : ''}
    `;

    attachEventListeners();
  }

  function renderFoodCard(food: Food): string {
    return `
      <div class="food-item">
        <div class="info">
          <div class="name">${food.name} ${food.is_custom ? '⭐' : ''}</div>
          <div class="meta">
            P: ${food.protein}g · C: ${food.carbs}g · G: ${food.fat}g
          </div>
        </div>
        <div class="calories">${food.calories}<br/><small style="color: var(--color-text-muted)">kcal</small></div>
      </div>
    `;
  }

  function renderAddModal(): string {
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">🥗 Nuevo alimento</h2>
            <button class="modal-close" id="close-modal">×</button>
          </div>

          <form id="add-food-form">
            <div class="input-group">
              <label class="label" for="food-name">Nombre</label>
              <input type="text" class="input" id="food-name" placeholder="Ej: Mi comida" required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
              <div class="input-group">
                <label class="label" for="food-calories">Calorías (100g)</label>
                <input type="number" class="input" id="food-calories" placeholder="0" required min="0" />
              </div>

              <div class="input-group">
                <label class="label" for="food-protein">Proteína (g)</label>
                <input type="number" class="input" id="food-protein" placeholder="0" required min="0" step="0.1" />
              </div>

              <div class="input-group">
                <label class="label" for="food-carbs">Carbos (g)</label>
                <input type="number" class="input" id="food-carbs" placeholder="0" required min="0" step="0.1" />
              </div>

              <div class="input-group">
                <label class="label" for="food-fat">Grasa (g)</label>
                <input type="number" class="input" id="food-fat" placeholder="0" required min="0" step="0.1" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Guardar alimento</button>
          </form>
        </div>
      </div>
    `;
  }

  function attachEventListeners() {

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.getAttribute('data-screen');
        if (screen) navigate(screen);
      });
    });

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    let debounceTimer: number;

    searchInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        searchQuery = searchInput.value;
        render();
      }, 200);
    });

    const addBtn = document.getElementById('add-custom-btn');
    addBtn?.addEventListener('click', () => {
      showAddModal = true;
      render();
    });

    if (showAddModal) {
      const closeBtn = document.getElementById('close-modal');
      const overlay = document.getElementById('modal-overlay');
      const form = document.getElementById('add-food-form') as HTMLFormElement;

      closeBtn?.addEventListener('click', () => {
        showAddModal = false;
        render();
      });

      overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) {
          showAddModal = false;
          render();
        }
      });

      form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = (document.getElementById('food-name') as HTMLInputElement).value;
        const calories = parseFloat((document.getElementById('food-calories') as HTMLInputElement).value) || 0;
        const protein = parseFloat((document.getElementById('food-protein') as HTMLInputElement).value) || 0;
        const carbs = parseFloat((document.getElementById('food-carbs') as HTMLInputElement).value) || 0;
        const fat = parseFloat((document.getElementById('food-fat') as HTMLInputElement).value) || 0;

        addCustomFood({ name, calories, protein, carbs, fat });

        showAddModal = false;
        render();
      });
    }
  }

  render();
}
