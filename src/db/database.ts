interface SqlJsDatabase {
    run(sql: string, params?: unknown[]): void;
    exec(sql: string): { columns: string[]; values: unknown[][] }[];
    prepare(sql: string): { run(params?: unknown[]): void; free(): void };
    export(): Uint8Array;
}

interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => SqlJsDatabase;
}

let db: SqlJsDatabase | null = null;

const DB_NAME = 'macromanager_db';

export async function initDatabase(): Promise<SqlJsDatabase> {
    const sqlPromise = (window as unknown as { initSqlJs?: (config: { locateFile: (file: string) => string }) => Promise<SqlJsStatic> }).initSqlJs;

    let SQL: SqlJsStatic;

    if (sqlPromise) {
        SQL = await sqlPromise({
            locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
    } else {
        await loadSqlJsScript();
        const initSqlJs = (window as unknown as { initSqlJs: (config: { locateFile: (file: string) => string }) => Promise<SqlJsStatic> }).initSqlJs;
        SQL = await initSqlJs({
            locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
    }

    const savedData = await loadFromIndexedDB();

    if (savedData) {
        db = new SQL.Database(savedData);
    } else {
        db = new SQL.Database();
        createTables();
    }

    return db;
}

function loadSqlJsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load sql.js'));
        document.head.appendChild(script);
    });
}

function createTables() {
    if (!db) return;

    db.run(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY,
      name TEXT,
      weight REAL,
      height REAL,
      age INTEGER,
      sex TEXT,
      activity_level TEXT,
      goal TEXT,
      target_calories INTEGER,
      target_protein INTEGER,
      target_carbs INTEGER,
      target_fat INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      calories REAL,
      protein REAL,
      carbs REAL,
      fat REAL,
      is_custom INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS daily_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      food_id INTEGER,
      grams REAL,
      meal_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (food_id) REFERENCES foods(id)
    )
  `);

    saveToIndexedDB();
}

export async function saveToIndexedDB(): Promise<void> {
    if (!db) return;

    const data = db.export();
    const buffer = new Uint8Array(data);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MacroManagerDB', 1);

        request.onerror = () => reject(request.error);

        request.onupgradeneeded = () => {
            const idb = request.result;
            if (!idb.objectStoreNames.contains('database')) {
                idb.createObjectStore('database');
            }
        };

        request.onsuccess = () => {
            const idb = request.result;
            const tx = idb.transaction('database', 'readwrite');
            const store = tx.objectStore('database');
            store.put(buffer, DB_NAME);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };
    });
}

async function loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MacroManagerDB', 1);

        request.onerror = () => reject(request.error);

        request.onupgradeneeded = () => {
            const idb = request.result;
            if (!idb.objectStoreNames.contains('database')) {
                idb.createObjectStore('database');
            }
        };

        request.onsuccess = () => {
            const idb = request.result;
            const tx = idb.transaction('database', 'readonly');
            const store = tx.objectStore('database');
            const getRequest = store.get(DB_NAME);

            getRequest.onsuccess = () => {
                resolve(getRequest.result || null);
            };

            getRequest.onerror = () => reject(getRequest.error);
        };
    });
}

export function getDatabase(): SqlJsDatabase {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

export interface UserProfile {
    id: number;
    name: string;
    weight: number;
    height: number;
    age: number;
    sex: 'male' | 'female';
    activity_level: string;
    goal: 'deficit' | 'maintain' | 'bulk';
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fat: number;
}

export function getUserProfile(): UserProfile | null {
    const result = getDatabase().exec('SELECT * FROM user_profile LIMIT 1');
    if (result.length === 0 || result[0].values.length === 0) {
        return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const profile: Record<string, unknown> = {};

    columns.forEach((col, i) => {
        profile[col] = row[i];
    });

    return profile as unknown as UserProfile;
}

export function saveUserProfile(profile: Omit<UserProfile, 'id'>): void {
    const db = getDatabase();
    db.run('DELETE FROM user_profile');
    db.run(`
    INSERT INTO user_profile (name, weight, height, age, sex, activity_level, goal, target_calories, target_protein, target_carbs, target_fat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
        profile.name,
        profile.weight,
        profile.height,
        profile.age,
        profile.sex,
        profile.activity_level,
        profile.goal,
        profile.target_calories,
        profile.target_protein,
        profile.target_carbs,
        profile.target_fat
    ]);
    saveToIndexedDB();
}

export interface Food {
    id: number;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    is_custom: boolean;
}

export function getAllFoods(): Food[] {
    const result = getDatabase().exec('SELECT * FROM foods ORDER BY name');
    if (result.length === 0) return [];

    return result[0].values.map(row => {
        const columns = result[0].columns;
        const food: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            food[col] = row[i];
        });
        food.is_custom = Boolean(food.is_custom);
        return food as unknown as Food;
    });
}

export function searchFoods(query: string): Food[] {
    const result = getDatabase().exec(
        `SELECT * FROM foods WHERE name LIKE '%${query}%' ORDER BY name LIMIT 20`
    );
    if (result.length === 0) return [];

    return result[0].values.map(row => {
        const columns = result[0].columns;
        const food: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            food[col] = row[i];
        });
        food.is_custom = Boolean(food.is_custom);
        return food as unknown as Food;
    });
}

export function addCustomFood(food: Omit<Food, 'id' | 'is_custom'>): number {
    const db = getDatabase();
    db.run(`
    INSERT INTO foods (name, calories, protein, carbs, fat, is_custom)
    VALUES (?, ?, ?, ?, ?, 1)
  `, [food.name, food.calories, food.protein, food.carbs, food.fat]);

    const res = db.exec("SELECT last_insert_rowid()");
    const id = res[0].values[0][0] as number;

    saveToIndexedDB();
    return id;
}

export interface DailyLogEntry {
    id: number;
    date: string;
    food_id: number;
    grams: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food?: Food;
}

export function getTodayLog(): DailyLogEntry[] {
    const today = new Date().toISOString().split('T')[0];
    return getLogByDate(today);
}

export function getLogByDate(date: string): DailyLogEntry[] {
    const db = getDatabase();
    const result = db.exec(`
    SELECT dl.*, f.name as food_name, f.calories, f.protein, f.carbs, f.fat
    FROM daily_log dl
    JOIN foods f ON dl.food_id = f.id
    WHERE dl.date = '${date}'
    ORDER BY dl.created_at DESC
  `);

    if (result.length === 0) return [];

    return result[0].values.map(row => {
        const columns = result[0].columns;
        const entry: Record<string, unknown> = {};
        columns.forEach((col, i) => {
            entry[col] = row[i];
        });

        return {
            id: entry.id as number,
            date: entry.date as string,
            food_id: entry.food_id as number,
            grams: entry.grams as number,
            meal_type: entry.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            food: {
                id: entry.food_id as number,
                name: entry.food_name as string,
                calories: entry.calories as number,
                protein: entry.protein as number,
                carbs: entry.carbs as number,
                fat: entry.fat as number,
                is_custom: false
            }
        };
    });
}

export function addLogEntry(foodId: number, grams: number, mealType: string): void {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    db.run(`
    INSERT INTO daily_log (date, food_id, grams, meal_type)
    VALUES (?, ?, ?, ?)
  `, [today, foodId, grams, mealType]);
    saveToIndexedDB();
}

export function deleteLogEntry(id: number): void {
    const db = getDatabase();
    db.run('DELETE FROM daily_log WHERE id = ?', [id]);
    saveToIndexedDB();
}

export interface DailyTotals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export function calculateDailyTotals(entries: DailyLogEntry[]): DailyTotals {
    return entries.reduce(
        (totals, entry) => {
            if (!entry.food) return totals;
            const multiplier = entry.grams / 100;
            return {
                calories: totals.calories + entry.food.calories * multiplier,
                protein: totals.protein + entry.food.protein * multiplier,
                carbs: totals.carbs + entry.food.carbs * multiplier,
                fat: totals.fat + entry.food.fat * multiplier
            };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
}
