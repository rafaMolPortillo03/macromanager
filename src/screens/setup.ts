import { calculateAllTargets, getActivityLabel, getGoalLabel, formatNumber } from '../utils/macros';
import { saveUserProfile } from '../db/database';

type NavigateFunction = (screen: string) => void;

export function renderSetupScreen(container: HTMLElement, navigate: NavigateFunction): void {
  let currentStep = 1;
  const totalSteps = 4;

  const formData = {
    name: '',
    weight: 70,
    height: 170,
    age: 25,
    sex: 'male' as 'male' | 'female',
    activityLevel: 'moderate',
    goal: 'maintain' as 'deficit' | 'maintain' | 'bulk'
  };

  function render() {
    container.innerHTML = `
      <div class="setup-screen">
        <div class="setup-header">
          <h1 class="setup-title">MacroManager</h1>
          <p class="setup-subtitle">Configura tu perfil para empezar</p>
        </div>

        <div class="step-indicator">
          ${Array.from({ length: totalSteps }, (_, i) => `
            <div class="step-dot ${i + 1 === currentStep ? 'active' : ''} ${i + 1 < currentStep ? 'completed' : ''}"></div>
          `).join('')}
        </div>

        <div class="setup-form">
          ${renderCurrentStep()}
        </div>
      </div>
    `;

    attachEventListeners();
  }

  function renderCurrentStep(): string {
    switch (currentStep) {
      case 1:
        return `
          <div class="setup-step active" data-step="1">
            <h2 class="step-title">¿Cómo te llamas?</h2>
            <div class="input-group">
              <input 
                type="text" 
                class="input" 
                id="name" 
                placeholder="Tu nombre"
                value="${formData.name}"
                autofocus
              />
            </div>
            <button class="btn btn-primary btn-block" id="next-btn">Siguiente</button>
          </div>
        `;

      case 2:
        return `
          <div class="setup-step active" data-step="2">
            <h2 class="step-title">Tus datos físicos</h2>
            
            <div class="input-group">
              <label class="label">Sexo</label>
              <div class="radio-group">
                <div class="radio-option">
                  <input type="radio" name="sex" id="sex-male" value="male" ${formData.sex === 'male' ? 'checked' : ''} />
                  <label for="sex-male">
                    <span class="text">Hombre</span>
                  </label>
                </div>
                <div class="radio-option">
                  <input type="radio" name="sex" id="sex-female" value="female" ${formData.sex === 'female' ? 'checked' : ''} />
                  <label for="sex-female">
                    <span class="text">Mujer</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="input-group">
              <label class="label" for="weight">Peso (kg)</label>
              <input type="number" class="input" id="weight" value="${formData.weight}" min="30" max="300" />
            </div>

            <div class="input-group">
              <label class="label" for="height">Altura (cm)</label>
              <input type="number" class="input" id="height" value="${formData.height}" min="100" max="250" />
            </div>

            <div class="input-group">
              <label class="label" for="age">Edad</label>
              <input type="number" class="input" id="age" value="${formData.age}" min="14" max="100" />
            </div>

            <div style="display: flex; gap: var(--space-md);">
              <button class="btn btn-secondary" id="prev-btn" style="flex: 1;">Atrás</button>
              <button class="btn btn-primary" id="next-btn" style="flex: 2;">Siguiente</button>
            </div>
          </div>
        `;

      case 3:
        return `
          <div class="setup-step active" data-step="3">
            <h2 class="step-title">Tu nivel de actividad</h2>
            
            <div class="input-group">
              <select class="input select" id="activity">
                <option value="sedentary" ${formData.activityLevel === 'sedentary' ? 'selected' : ''}>${getActivityLabel('sedentary')}</option>
                <option value="light" ${formData.activityLevel === 'light' ? 'selected' : ''}>${getActivityLabel('light')}</option>
                <option value="moderate" ${formData.activityLevel === 'moderate' ? 'selected' : ''}>${getActivityLabel('moderate')}</option>
                <option value="active" ${formData.activityLevel === 'active' ? 'selected' : ''}>${getActivityLabel('active')}</option>
                <option value="very_active" ${formData.activityLevel === 'very_active' ? 'selected' : ''}>${getActivityLabel('very_active')}</option>
              </select>
            </div>

            <div class="input-group">
              <label class="label">¿Cuál es tu objetivo?</label>
              <div class="radio-group">
                <div class="radio-option">
                  <input type="radio" name="goal" id="goal-deficit" value="deficit" ${formData.goal === 'deficit' ? 'checked' : ''} />
                  <label for="goal-deficit">
                    <span class="text">Definición</span>
                  </label>
                </div>
                <div class="radio-option">
                  <input type="radio" name="goal" id="goal-maintain" value="maintain" ${formData.goal === 'maintain' ? 'checked' : ''} />
                  <label for="goal-maintain">
                    <span class="text">Mantener</span>
                  </label>
                </div>
                <div class="radio-option">
                  <input type="radio" name="goal" id="goal-bulk" value="bulk" ${formData.goal === 'bulk' ? 'checked' : ''} />
                  <label for="goal-bulk">
                    <span class="text">Volumen</span>
                  </label>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: var(--space-md);">
              <button class="btn btn-secondary" id="prev-btn" style="flex: 1;">Atrás</button>
              <button class="btn btn-primary" id="next-btn" style="flex: 2;">Ver resultados</button>
            </div>
          </div>
        `;

      case 4:
        const targets = calculateAllTargets({
          weight: formData.weight,
          height: formData.height,
          age: formData.age,
          sex: formData.sex,
          activityLevel: formData.activityLevel,
          goal: formData.goal
        });

        return `
          <div class="setup-step active" data-step="4">
            <h2 class="step-title">¡Tus macros diarios!</h2>
            
            <div class="results-card">
              <div class="results-title">Calorías objetivo</div>
              <div class="results-value">${formatNumber(targets.calories)}</div>
              <div class="results-unit">kcal/día</div>
              
              <div class="results-breakdown">
                <div class="results-macro">
                  <div class="value">${targets.protein}g</div>
                  <div class="label">Proteína</div>
                </div>
                <div class="results-macro">
                  <div class="value">${targets.carbs}g</div>
                  <div class="label">Carbos</div>
                </div>
                <div class="results-macro">
                  <div class="value">${targets.fat}g</div>
                  <div class="label">Grasa</div>
                </div>
              </div>
            </div>

            <p style="text-align: center; color: var(--color-text-secondary); margin-bottom: var(--space-lg); font-size: var(--font-size-sm);">
              ${getGoalLabel(formData.goal)}<br/>
              Basado en tu peso de ${formData.weight}kg
            </p>

            <div style="display: flex; gap: var(--space-md);">
              <button class="btn btn-secondary" id="prev-btn" style="flex: 1;">Atrás</button>
              <button class="btn btn-primary" id="save-btn" style="flex: 2;">¡Empezar!</button>
            </div>
          </div>
        `;

      default:
        return '';
    }
  }

  function attachEventListeners() {

    const nextBtn = document.getElementById('next-btn');
    nextBtn?.addEventListener('click', () => {
      saveCurrentStepData();
      if (currentStep < totalSteps) {
        currentStep++;
        render();
      }
    });

    const prevBtn = document.getElementById('prev-btn');
    prevBtn?.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        render();
      }
    });

    const saveBtn = document.getElementById('save-btn');
    saveBtn?.addEventListener('click', () => {
      const targets = calculateAllTargets({
        weight: formData.weight,
        height: formData.height,
        age: formData.age,
        sex: formData.sex,
        activityLevel: formData.activityLevel,
        goal: formData.goal
      });

      saveUserProfile({
        name: formData.name || 'Usuario',
        weight: formData.weight,
        height: formData.height,
        age: formData.age,
        sex: formData.sex,
        activity_level: formData.activityLevel,
        goal: formData.goal,
        target_calories: targets.calories,
        target_protein: targets.protein,
        target_carbs: targets.carbs,
        target_fat: targets.fat
      });

      navigate('dashboard');
    });

    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          nextBtn?.click();
        }
      });
    });
  }

  function saveCurrentStepData() {
    switch (currentStep) {
      case 1:
        const nameInput = document.getElementById('name') as HTMLInputElement;
        formData.name = nameInput?.value || '';
        break;

      case 2:
        const sexMale = document.getElementById('sex-male') as HTMLInputElement;
        formData.sex = sexMale?.checked ? 'male' : 'female';

        const weightInput = document.getElementById('weight') as HTMLInputElement;
        formData.weight = parseFloat(weightInput?.value) || 70;

        const heightInput = document.getElementById('height') as HTMLInputElement;
        formData.height = parseFloat(heightInput?.value) || 170;

        const ageInput = document.getElementById('age') as HTMLInputElement;
        formData.age = parseInt(ageInput?.value) || 25;
        break;

      case 3:
        const activitySelect = document.getElementById('activity') as HTMLSelectElement;
        formData.activityLevel = activitySelect?.value || 'moderate';

        const goalDeficit = document.getElementById('goal-deficit') as HTMLInputElement;
        const goalMaintain = document.getElementById('goal-maintain') as HTMLInputElement;
        if (goalDeficit?.checked) formData.goal = 'deficit';
        else if (goalMaintain?.checked) formData.goal = 'maintain';
        else formData.goal = 'bulk';
        break;
    }
  }

  render();
}
