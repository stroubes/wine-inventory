import express, { Request, Response } from 'express';
import knex from '../database';
import { FoodPairing } from '../types/wine';
import { v4 as uuidv4 } from 'uuid';
import wineApiService from '../services/wineApiService';

const router = express.Router();

// GET /api/food-pairings - Get all food pairings with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const wineId = req.query.wine_id as string;
    const category = req.query.category as string;
    const search = req.query.search as string;

    let query = knex('food_pairings');

    if (wineId) {
      query = query.where('wine_id', wineId);
    }

    if (category) {
      query = query.where('category', category);
    }

    if (search) {
      query = query.where(function(this: any) {
        this.where('food_item', 'like', `%${search}%`)
            .orWhere('description', 'like', `%${search}%`);
      });
    }

    const total = await query.clone().count('* as count').first() as any;
    const pairings = await query
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    const totalCount = Number(total?.count || 0);

    return res.json({
      pairings,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching food pairings:', error);
    return res.status(500).json({ error: 'Failed to fetch food pairings' });
  }
});

// GET /api/food-pairings/:id - Get a specific food pairing
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pairing = await knex('food_pairings')
      .where('id', req.params.id)
      .first();

    if (!pairing) {
      return res.status(404).json({ error: 'Food pairing not found' });
    }

    return res.json(pairing);
  } catch (error) {
    console.error('Error fetching food pairing:', error);
    return res.status(500).json({ error: 'Failed to fetch food pairing' });
  }
});

// POST /api/food-pairings - Create a new food pairing
router.post('/', async (req: Request, res: Response) => {
  try {
    const { wine_id, food_item, category, description, user_rating, is_suggested, source } = req.body;

    if (!wine_id || !food_item || !category) {
      return res.status(400).json({
        error: 'Missing required fields: wine_id, food_item, category'
      });
    }

    const validCategories = ['Appetizer', 'Main Course', 'Dessert', 'Cheese', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category. Must be one of: ' + validCategories.join(', ')
      });
    }

    if (user_rating && (user_rating < 1 || user_rating > 5)) {
      return res.status(400).json({
        error: 'Invalid user rating. Must be between 1 and 5'
      });
    }

    // Check if wine exists
    const wine = await knex('wines').where('id', wine_id).first();
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    const pairingData = {
      id: uuidv4(),
      wine_id,
      food_item: food_item.trim(),
      category,
      description: description?.trim(),
      user_rating: user_rating ? parseInt(user_rating) : null,
      is_suggested: is_suggested || false,
      source: source?.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await knex('food_pairings').insert(pairingData);
    const createdPairing = await knex('food_pairings')
      .where('id', pairingData.id)
      .first();

    return res.status(201).json(createdPairing);
  } catch (error) {
    console.error('Error creating food pairing:', error);
    return res.status(500).json({ error: 'Failed to create food pairing' });
  }
});

// PUT /api/food-pairings/:id - Update a food pairing
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existingPairing = await knex('food_pairings')
      .where('id', req.params.id)
      .first();

    if (!existingPairing) {
      return res.status(404).json({ error: 'Food pairing not found' });
    }

    const { food_item, category, description, user_rating, is_suggested, source } = req.body;

    if (category) {
      const validCategories = ['Appetizer', 'Main Course', 'Dessert', 'Cheese', 'Other'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: 'Invalid category. Must be one of: ' + validCategories.join(', ')
        });
      }
    }

    if (user_rating && (user_rating < 1 || user_rating > 5)) {
      return res.status(400).json({
        error: 'Invalid user rating. Must be between 1 and 5'
      });
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (food_item !== undefined) updateData.food_item = food_item.trim();
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description?.trim();
    if (user_rating !== undefined) updateData.user_rating = user_rating ? parseInt(user_rating) : null;
    if (is_suggested !== undefined) updateData.is_suggested = is_suggested;
    if (source !== undefined) updateData.source = source?.trim();

    await knex('food_pairings')
      .where('id', req.params.id)
      .update(updateData);

    const updatedPairing = await knex('food_pairings')
      .where('id', req.params.id)
      .first();

    return res.json(updatedPairing);
  } catch (error) {
    console.error('Error updating food pairing:', error);
    return res.status(500).json({ error: 'Failed to update food pairing' });
  }
});

// DELETE /api/food-pairings/:id - Delete a food pairing
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existingPairing = await knex('food_pairings')
      .where('id', req.params.id)
      .first();

    if (!existingPairing) {
      return res.status(404).json({ error: 'Food pairing not found' });
    }

    const deleted = await knex('food_pairings')
      .where('id', req.params.id)
      .del();

    if (deleted) {
      return res.status(204).send();
    } else {
      return res.status(500).json({ error: 'Failed to delete food pairing' });
    }
  } catch (error) {
    console.error('Error deleting food pairing:', error);
    return res.status(500).json({ error: 'Failed to delete food pairing' });
  }
});

// POST /api/food-pairings/bulk-suggestions/:wine_id - Create multiple suggested pairings for a wine
router.post('/bulk-suggestions/:wine_id', async (req: Request, res: Response) => {
  try {
    const wineId = req.params.wine_id;
    
    // Check if wine exists
    const wine = await knex('wines').where('id', wineId).first();
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    // Get suggestions from API service
    const suggestions = await wineApiService.suggestFoodPairings(wine);
    
    if (suggestions.length === 0) {
      return res.json({
        message: 'No food pairing suggestions found for this wine',
        created: 0
      });
    }

    // Create pairing entries
    const pairingData = suggestions.map(suggestion => ({
      id: uuidv4(),
      wine_id: wineId,
      food_item: suggestion,
      category: 'Other', // Default category for API suggestions
      is_suggested: true,
      source: 'wine_api_service',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    await knex('food_pairings').insert(pairingData);

    return res.status(201).json({
      message: `Created ${pairingData.length} food pairing suggestions`,
      created: pairingData.length,
      suggestions: pairingData
    });
  } catch (error) {
    console.error('Error creating bulk food pairing suggestions:', error);
    return res.status(500).json({ error: 'Failed to create food pairing suggestions' });
  }
});

// GET /api/food-pairings/categories - Get all pairing categories with counts
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await knex('food_pairings')
      .select('category')
      .count('* as count')
      .groupBy('category')
      .orderBy('count', 'desc');

    return res.json(categories);
  } catch (error) {
    console.error('Error fetching pairing categories:', error);
    return res.status(500).json({ error: 'Failed to fetch pairing categories' });
  }
});

export default router;