import { getUserProfile, saveUserProfile } from '../db/database';
import { calculateAllTargets, getActivityLabel, getGoalLabel, formatNumber } from '../utils/macros';

type NavigateFunction = (screen: string) => void;

export function renderSettingsScreen(container: HTMLElement, navigate: NavigateFunction): void {
  const profile = getUserProfile();

  if (!profile) {
    navigate('setup');
    return;
  }

  let isEditing = false;
  let editData = { ...profile };

  function render() {
    container.innerHTML = `
      <div class="screen">
        <div class="container">
          <header style="padding: var(--space-lg) 0;">
            <h1 class="title">⚙️ Ajustes</h1>
            <p class="subtitle">Configura tu perfil y objetivos</p>
          </header>

          ${isEditing ? renderEditForm() : renderProfile()}

          <div class="card" style="margin-top: var(--space-lg);">
            <h3 style="margin-bottom: var(--space-md);">ℹ️ Acerca de</h3>
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: 1.6;">
              <strong>MacroManager</strong> es una app gratuita y sin anuncios para contar tus macros diarios.
              <br/><br/>
              Todos tus datos se guardan localmente en tu dispositivo. No se envía nada a ningún servidor.
              <br/><br/>
              Versión 1.0.0
            </p>
          </div>

          <button class="btn btn-secondary btn-block" id="reset-btn" style="margin-top: var(--space-lg); color: var(--color-error);">
            🗑️ Reiniciar aplicación
          </button>

          <div style="height: 100px;"></div>
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
           <button class="nav-item" data-screen="stats">
            <span class="icon">📊</span>
            <span>Progreso</span>
          </button>
          <button class="nav-item active" data-screen="settings">
            <span class="icon">⚙️</span>
            <span>Ajustes</span>
          </button>
          </div>
        </nav>
      </div>
    `;

    attachEventListeners();
  }

  function renderProfile(): string {
    return `
      <div class="card">
        <div class="card-header">
          <h3>👤 Tu perfil</h3>
          <button class="btn btn-secondary btn-icon" id="edit-btn">✏️ Editar</button>
        </div>

        <div style="display: grid; gap: var(--space-md);">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Nombre</span>
            <span>${profile.name}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Peso</span>
            <span>${profile.weight} kg</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Altura</span>
            <span>${profile.height} cm</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Edad</span>
            <span>${profile.age} años</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Sexo</span>
            <span>${profile.sex === 'male' ? '👨 Hombre' : '👩 Mujer'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Actividad</span>
            <span>${getActivityLabel(profile.activity_level).split('(')[0].trim()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Objetivo</span>
            <span>${getGoalLabel(profile.goal).split('(')[0].trim()}</span>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: var(--space-lg);">
        <h3 style="margin-bottom: var(--space-md);">🎯 Tus objetivos diarios</h3>
        
        <div class="results-card" style="margin: 0;">
          <div class="results-title">Calorías</div>
          <div class="results-value">${formatNumber(profile.target_calories)}</div>
          <div class="results-unit">kcal/día</div>
          
          <div class="results-breakdown">
            <div class="results-macro">
              <div class="value">${profile.target_protein}g</div>
              <div class="label">Proteína</div>
            </div>
            <div class="results-macro">
              <div class="value">${profile.target_carbs}g</div>
              <div class="label">Carbos</div>
            </div>
            <div class="results-macro">
              <div class="value">${profile.target_fat}g</div>
              <div class="label">Grasa</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderEditForm(): string {
    return `
      <div class="card">
        <h3 style="margin-bottom: var(--space-lg);">✏️ Editar perfil</h3>

        <form id="edit-form">
          <div class="input-group">
            <label class="label" for="name">Nombre</label>
            <input type="text" class="input" id="name" value="${editData.name}" />
          </div>

          <div class="input-group">
            <label class="label">Sexo</label>
            <div class="radio-group">
              <div class="radio-option">
                <input type="radio" name="sex" id="sex-male" value="male" ${editData.sex === 'male' ? 'checked' : ''} />
                <label for="sex-male">
                  <span class="text">👨 Hombre</span>
                </label>
              </div>
              <div class="radio-option">
                <input type="radio" name="sex" id="sex-female" value="female" ${editData.sex === 'female' ? 'checked' : ''} />
                <label for="sex-female">
                  <span class="text">👩 Mujer</span>
                </label>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md);">
            <div class="input-group">
              <label class="label" for="weight">Peso (kg)</label>
              <input type="number" class="input" id="weight" value="${editData.weight}" min="30" max="300" />
            </div>

            <div class="input-group">
              <label class="label" for="height">Altura (cm)</label>
              <input type="number" class="input" id="height" value="${editData.height}" min="100" max="250" />
            </div>

            <div class="input-group">
              <label class="label" for="age">Edad</label>
              <input type="number" class="input" id="age" value="${editData.age}" min="14" max="100" />
            </div>
          </div>

          <div class="input-group">
            <label class="label" for="activity">Nivel de actividad</label>
            <select class="input select" id="activity">
              <option value="sedentary" ${editData.activity_level === 'sedentary' ? 'selected' : ''}>🪑 Sedentario</option>
              <option value="light" ${editData.activity_level === 'light' ? 'selected' : ''}>🚶 Ligero (1-3 días)</option>
              <option value="moderate" ${editData.activity_level === 'moderate' ? 'selected' : ''}>🏃 Moderado (3-5 días)</option>
              <option value="active" ${editData.activity_level === 'active' ? 'selected' : ''}>💪 Activo (6-7 días)</option>
              <option value="very_active" ${editData.activity_level === 'very_active' ? 'selected' : ''}>🏋️ Muy activo</option>
            </select>
          </div>

          <div class="input-group">
            <label class="label">Objetivo</label>
            <div class="radio-group">
              <div class="radio-option">
                <input type="radio" name="goal" id="goal-deficit" value="deficit" ${editData.goal === 'deficit' ? 'checked' : ''} />
                <label for="goal-deficit">
                  <span class="text">📉 Definición</span>
                </label>
              </div>
              <div class="radio-option">
                <input type="radio" name="goal" id="goal-maintain" value="maintain" ${editData.goal === 'maintain' ? 'checked' : ''} />
                <label for="goal-maintain">
                  <span class="text">⚖️ Mantener</span>
                </label>
              </div>
              <div class="radio-option">
                <input type="radio" name="goal" id="goal-bulk" value="bulk" ${editData.goal === 'bulk' ? 'checked' : ''} />
                <label for="goal-bulk">
                  <span class="text">📈 Volumen</span>
                </label>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-md); margin-top: var(--space-lg);">
            <button type="button" class="btn btn-secondary" id="cancel-btn" style="flex: 1;">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="flex: 2;">Guardar cambios</button>
          </div>
        </form>
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

    const editBtn = document.getElementById('edit-btn');
    editBtn?.addEventListener('click', () => {
      isEditing = true;
      editData = { ...profile };
      render();
    });

    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      isEditing = false;
      render();
    });

    const editForm = document.getElementById('edit-form') as HTMLFormElement;
    editForm?.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (document.getElementById('name') as HTMLInputElement).value;
      const sexMale = (document.getElementById('sex-male') as HTMLInputElement).checked;
      const weight = parseFloat((document.getElementById('weight') as HTMLInputElement).value);
      const height = parseFloat((document.getElementById('height') as HTMLInputElement).value);
      const age = parseInt((document.getElementById('age') as HTMLInputElement).value);
      const activity = (document.getElementById('activity') as HTMLSelectElement).value;
      const goalDeficit = (document.getElementById('goal-deficit') as HTMLInputElement).checked;
      const goalMaintain = (document.getElementById('goal-maintain') as HTMLInputElement).checked;

      let goal: 'deficit' | 'maintain' | 'bulk' = 'maintain';
      if (goalDeficit) goal = 'deficit';
      else if (!goalMaintain) goal = 'bulk';

      const targets = calculateAllTargets({
        weight,
        height,
        age,
        sex: sexMale ? 'male' : 'female',
        activityLevel: activity,
        goal
      });

      saveUserProfile({
        name,
        weight,
        height,
        age,
        sex: sexMale ? 'male' : 'female',
        activity_level: activity,
        goal,
        target_calories: targets.calories,
        target_protein: targets.protein,
        target_carbs: targets.carbs,
        target_fat: targets.fat
      });

      isEditing = false;

      const updatedProfile = getUserProfile();
      if (updatedProfile) {
        Object.assign(profile, updatedProfile);
      }
      render();
    });

    const resetBtn = document.getElementById('reset-btn');
    resetBtn?.addEventListener('click', () => {
      if (confirm('¿Estás seguro? Se borrarán todos tus datos y registros.')) {
        indexedDB.deleteDatabase('MacroManagerDB');
        localStorage.clear();
        window.location.reload();
      }
    });
  }

  render();
}
