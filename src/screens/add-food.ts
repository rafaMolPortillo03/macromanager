import { searchFoods, addLogEntry, addCustomFood, Food } from '../db/database';
import { searchRemoteFoods } from '../services/api';

type NavigateFunction = (screen: string) => void;

interface FoodFormData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  grams: number;
  mealType: string;
}

export function renderAddFoodScreen(container: HTMLElement, navigate: NavigateFunction): void {
  let formData: FoodFormData = {
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    grams: 100,
    mealType: 'lunch'
  };

  let showSearchModal = false;
  let searchQuery = '';
  let searchResults: Food[] = [];
  let remoteResults: Omit<Food, 'id' | 'is_custom'>[] = [];
  let isSearchingRemote = false;

  function render() {
    container.innerHTML = `
      <div class="screen">
        <div class="container">
          <header style="padding: var(--space-lg) 0;">
             <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg);">
              <button class="btn btn-icon btn-secondary" id="back-btn">⬅️</button>
              <h1 class="title" style="margin: 0;">Añadir comida</h1>
            </div>

            <div class="meal-tabs" style="margin-bottom: var(--space-lg);">
              <button class="meal-tab ${formData.mealType === 'breakfast' ? 'active' : ''}" data-meal="breakfast">🌅 Desayuno</button>
              <button class="meal-tab ${formData.mealType === 'lunch' ? 'active' : ''}" data-meal="lunch">☀️ Almuerzo</button>
              <button class="meal-tab ${formData.mealType === 'dinner' ? 'active' : ''}" data-meal="dinner">🌙 Cena</button>
              <button class="meal-tab ${formData.mealType === 'snack' ? 'active' : ''}" data-meal="snack">🍪 Snack</button>
            </div>
          </header>

          <div class="card">
            <h2 style="margin-bottom: var(--space-md);">📝 Datos del alimento</h2>
            
            <div class="input-group">
              <label class="label">Nombre del alimento</label>
              <div style="display: flex; gap: var(--space-sm);">
                <input type="text" class="input" id="form-name" value="${formData.name}" placeholder="Ej. Pechuga de pollo" style="flex: 1;" />
                <button class="btn btn-secondary" id="open-search-btn">🔍 Buscar</button>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
               <div class="input-group">
                <label class="label">Calorías (100g)</label>
                <input type="number" class="input" id="form-calories" value="${formData.calories || ''}" placeholder="0" />
              </div>
              <div class="input-group">
                <label class="label">Proteína (g)</label>
                <input type="number" class="input" id="form-protein" value="${formData.protein || ''}" placeholder="0" />
              </div>
              <div class="input-group">
                <label class="label">Carbos (g)</label>
                <input type="number" class="input" id="form-carbs" value="${formData.carbs || ''}" placeholder="0" />
              </div>
              <div class="input-group">
                <label class="label">Grasa (g)</label>
                <input type="number" class="input" id="form-fat" value="${formData.fat || ''}" placeholder="0" />
              </div>
            </div>
          </div>

          <div class="card" style="margin-top: var(--space-md);">
             <label class="label" style="text-align: center; display: block;">Cantidad a registrar</label>
            <div class="quantity-picker">
              <button class="quantity-btn" id="decrease-btn">➖</button>
              <div>
                <input 
                  type="number" 
                  class="input quantity-input" 
                  id="form-grams"
                  value="${formData.grams}"
                />
                <div class="quantity-unit">gramos</div>
              </div>
              <button class="quantity-btn" id="increase-btn">➕</button>
            </div>
            <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-md); flex-wrap: wrap; justify-content: center;">
              <button class="btn btn-secondary shortcut-btn" data-grams="100">100g</button>
              <button class="btn btn-secondary shortcut-btn" data-grams="200">200g</button>
              <button class="btn btn-secondary shortcut-btn" data-grams="250">250g</button>
            </div>
          </div>

          <div class="card" style="margin-top: var(--space-md); background: var(--color-bg-alt);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Total a registrar:</span>
              <strong style="color: var(--color-calories); font-size: 1.2rem;">
                ${Math.round((formData.calories || 0) * (formData.grams / 100))} kcal
              </strong>
            </div>
          </div>

          <button class="btn btn-primary btn-block" id="save-btn" style="margin-top: var(--space-xl); margin-bottom: var(--space-2xl);">
            ✅ Añadir al registro
          </button>
        </div>

        <nav class="nav-bar">
          <div class="nav-bar-inner">
            <button class="nav-item" data-screen="dashboard">
              <span class="icon">🏠</span>
              <span>Inicio</span>
            </button>
            <button class="nav-item active" data-screen="add-food">
              <span class="icon">➕</span>
              <span>Añadir</span>
            </button>
            <button class="nav-item" data-screen="foods">
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

      ${showSearchModal ? renderSearchModal() : ''}
    `;

    attachEventListeners();
  }

  function renderSearchModal() {
    return `
      <div class="modal-overlay" id="search-overlay">
        <div class="modal" style="height: 80vh; display: flex; flex-direction: column; max-height: 80vh;">
          <div class="modal-header">
            <h2 class="modal-title">🔍 Buscar alimento</h2>
            <button class="modal-close" id="close-search-btn">×</button>
          </div>
          
          <div class="search-container" style="margin-bottom: var(--space-md);">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              class="input search-input" 
              id="search-input"
              placeholder="Buscar online o local..."
              value="${searchQuery}"
              autofocus
            />
          </div>

          <div id="results-container" style="overflow-y: auto; flex: 1;">
            ${renderSearchResults()}
          </div>
        </div>
      </div>
    `;
  }

  function renderSearchResults() {
    let html = '';

    if (searchResults.length === 0 && searchQuery.length === 0) {
      return `
        <div class="empty-state">
          <div style="font-size: 32px; margin-bottom: 16px;">⌨️</div>
          <div class="text">Escribe para buscar...</div>
        </div>
      `;
    }


    html += searchResults.map(food => `
      <div class="food-item local-food" data-index="${searchResults.indexOf(food)}">
         <div class="info">
            <div class="name">${food.name}</div>
            <div class="meta">${food.protein}g P · ${food.carbs}g C · ${food.fat}g G</div>
        </div>
        <div class="calories">${food.calories}</div>
      </div>
    `).join('');

    if (remoteResults.length > 0) {
      html += `
        <div style="margin-top: var(--space-lg); margin-bottom: var(--space-md);">
          <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); text-transform: uppercase;">
            🌐 Online
          </div>
        </div>
      `;
      html += remoteResults.map((food, index) => `
        <div class="food-item remote-food" data-index="${index}">
           <div class="info">
              <div class="name">${food.name} <span style="font-size: 10px; border: 1px solid var(--color-primary); color: var(--color-primary); padding: 0 4px; border-radius: 4px;">ONLINE</span></div>
              <div class="meta">${food.protein}g P · ${food.carbs}g C · ${food.fat}g G</div>
          </div>
          <div class="calories">${food.calories}</div>
        </div>
      `).join('');
    }

    if (isSearchingRemote) {
      html += `<div style="text-align: center; padding: 20px;">⏳ Buscando...</div>`;
    }

    return html;
  }

  function attachEventListeners() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navigate(item.getAttribute('data-screen') || 'dashboard');
      });
    });

    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => navigate('dashboard'));

    const mealTabs = document.querySelectorAll('.meal-tab');
    mealTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        formData.mealType = tab.getAttribute('data-meal') || 'lunch';
        render();
      });
    });

    const inputs = ['form-name', 'form-calories', 'form-protein', 'form-carbs', 'form-fat', 'form-grams'];
    inputs.forEach(id => {
      const el = document.getElementById(id) as HTMLInputElement;
      el?.addEventListener('input', () => {
        updateFormDataFromDOM();
        updateTotalSummary();
      });
    });

    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    decreaseBtn?.addEventListener('click', () => {
      formData.grams = Math.max(1, formData.grams - 10);
      render();
    });
    increaseBtn?.addEventListener('click', () => {
      formData.grams = Math.min(2000, formData.grams + 10);
      render();
    });

    const shortcuts = document.querySelectorAll('.shortcut-btn');
    shortcuts.forEach(btn => {
      btn.addEventListener('click', () => {
        formData.grams = parseInt(btn.getAttribute('data-grams') || '100');
        render();
      });
    });

    document.getElementById('save-btn')?.addEventListener('click', () => {
      updateFormDataFromDOM();
      if (!formData.name) {
        alert('Por favor escribe un nombre para el alimento');
        return;
      }

      const newId = addCustomFood({
        name: formData.name,
        calories: formData.calories,
        protein: formData.protein,
        carbs: formData.carbs,
        fat: formData.fat
      });

      addLogEntry(newId, formData.grams, formData.mealType);
      navigate('dashboard');
    });

    document.getElementById('open-search-btn')?.addEventListener('click', () => {
      showSearchModal = true;
      updateFormDataFromDOM();
      render();
      setTimeout(() => document.getElementById('search-input')?.focus(), 50);
    });

    if (showSearchModal) {
      attachSearchModalListeners();
    }
  }

  function updateFormDataFromDOM() {
    formData.name = (document.getElementById('form-name') as HTMLInputElement)?.value || '';
    formData.calories = parseFloat((document.getElementById('form-calories') as HTMLInputElement)?.value) || 0;
    formData.protein = parseFloat((document.getElementById('form-protein') as HTMLInputElement)?.value) || 0;
    formData.carbs = parseFloat((document.getElementById('form-carbs') as HTMLInputElement)?.value) || 0;
    formData.fat = parseFloat((document.getElementById('form-fat') as HTMLInputElement)?.value) || 0;
    formData.grams = parseInt((document.getElementById('form-grams') as HTMLInputElement)?.value) || 100;
  }

  function updateTotalSummary() {
    const totalKcal = Math.round((formData.calories || 0) * (formData.grams / 100));
    const summaryEl = document.querySelector('.card .card strong') as HTMLElement;
    if (summaryEl) {
      summaryEl.textContent = `${totalKcal} kcal`;
    }
  }

  function attachSearchModalListeners() {
    document.getElementById('close-search-btn')?.addEventListener('click', () => {
      showSearchModal = false;
      render();
    });

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    let debounceTimer: number;

    searchInput?.addEventListener('input', () => {
      const query = searchInput.value;
      searchQuery = query;

      clearTimeout(debounceTimer);

      searchResults = searchFoods(query);
      refreshSearchResultsDOM();

      if (query.length >= 3) {
        debounceTimer = window.setTimeout(async () => {
          isSearchingRemote = true;
          refreshSearchResultsDOM();
          try {
            const results = await searchRemoteFoods(query);
            if (document.getElementById('search-input')) { // If still open
              remoteResults = results;
            }
          } catch (e) { console.error(e) }
          isSearchingRemote = false;
          refreshSearchResultsDOM();
        }, 600);
      } else {
        remoteResults = [];
      }
    });

    function refreshSearchResultsDOM() {
      const container = document.getElementById('results-container');
      if (container) container.innerHTML = renderSearchResults();
      attachResultClicks();
    }

    function attachResultClicks() {
      document.querySelectorAll('.local-food').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-index') || '0');
          fillFormWithFood(searchResults[idx]);
        });
      });
      document.querySelectorAll('.remote-food').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-index') || '0');
          fillFormWithFood(remoteResults[idx]);
        });
      });
    }

    attachResultClicks();
  }

  function fillFormWithFood(food: Omit<Food, 'id' | 'is_custom'> | Food) {
    formData.name = food.name;
    formData.calories = food.calories;
    formData.protein = food.protein;
    formData.carbs = food.carbs;
    formData.fat = food.fat;

    showSearchModal = false;
    render();
  }

  render();
}
