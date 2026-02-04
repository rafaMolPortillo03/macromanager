import { Food } from '../db/database';

interface OpenFoodFactsResult {
    products: Array<{
        product_name?: string;
        nutriments?: {
            'energy-kcal_100g'?: number;
            'proteins_100g'?: number;
            'carbohydrates_100g'?: number;
            'fat_100g'?: number;
        };
    }>;
}

export async function searchRemoteFoods(query: string): Promise<Omit<Food, 'id' | 'is_custom'>[]> {
    if (query.length < 3) return [];

    try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=1&page_size=15&fields=product_name,nutriments`;

        const response = await fetch(url);
        if (!response.ok) return [];

        const data = (await response.json()) as OpenFoodFactsResult;

        if (!data.products) return [];

        return data.products
            .filter(p => p.product_name && p.nutriments)
            .map(p => ({
                name: p.product_name || 'Desconocido',
                calories: Number(p.nutriments?.['energy-kcal_100g'] || 0),
                protein: Number(p.nutriments?.['proteins_100g'] || 0),
                carbs: Number(p.nutriments?.['carbohydrates_100g'] || 0),
                fat: Number(p.nutriments?.['fat_100g'] || 0)
            }))
            .filter(f => f.name !== 'Desconocido'); // Filter out bad data
    } catch (error) {
        console.error('Error fetching foods:', error);
        return [];
    }
}
