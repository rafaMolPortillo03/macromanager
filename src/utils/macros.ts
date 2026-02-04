export interface MacroTargets {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface UserData {
    weight: number;
    height: number;
    age: number;
    sex: 'male' | 'female';
    activityLevel: string;
    goal: 'deficit' | 'maintain' | 'bulk';
}

const ACTIVITY_FACTORS: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
};

const GOAL_ADJUSTMENTS: Record<string, number> = {
    deficit: -500,
    maintain: 0,
    bulk: 300
};

export function calculateBMR(weight: number, height: number, age: number, sex: 'male' | 'female'): number {
    const base = (10 * weight) + (6.25 * height) - (5 * age);
    if (sex === 'male') {
        return base + 5;
    } else {
        return base - 161;
    }
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
    const factor = ACTIVITY_FACTORS[activityLevel] || ACTIVITY_FACTORS.moderate;
    return Math.round(bmr * factor);
}

export function calculateTargetCalories(tdee: number, goal: 'deficit' | 'maintain' | 'bulk'): number {
    const adjustment = GOAL_ADJUSTMENTS[goal] || 0;
    return Math.round(tdee + adjustment);
}

export function calculateMacros(targetCalories: number, weight: number): MacroTargets {
    const protein = Math.round(weight * 2);
    const proteinCalories = protein * 4;
    const fatCalories = targetCalories * 0.25;
    const fat = Math.round(fatCalories / 9);
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbs = Math.round(carbCalories / 4);

    return {
        calories: targetCalories,
        protein,
        carbs,
        fat
    };
}

export function calculateAllTargets(userData: UserData): MacroTargets {
    const bmr = calculateBMR(userData.weight, userData.height, userData.age, userData.sex);
    const tdee = calculateTDEE(bmr, userData.activityLevel);
    const targetCalories = calculateTargetCalories(tdee, userData.goal);
    return calculateMacros(targetCalories, userData.weight);
}

export function getActivityLabel(level: string): string {
    const labels: Record<string, string> = {
        sedentary: 'Sedentario (poco o nada de ejercicio)',
        light: 'Ligero (1-3 días/semana)',
        moderate: 'Moderado (3-5 días/semana)',
        active: 'Activo (6-7 días/semana)',
        very_active: 'Muy activo (atleta/trabajo físico)'
    };
    return labels[level] || level;
}

export function getGoalLabel(goal: string): string {
    const labels: Record<string, string> = {
        deficit: 'Definición (-500 kcal)',
        maintain: 'Mantenimiento',
        bulk: 'Volumen (+300 kcal)'
    };
    return labels[goal] || goal;
}

export function formatNumber(num: number): string {
    return Math.round(num).toLocaleString('es-ES');
}

export function calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
}
