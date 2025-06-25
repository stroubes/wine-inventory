import express, { Request, Response } from 'express';
import { WineModel } from '../models/Wine';
import { CreateWineRequest, UpdateWineRequest, WineSearchFilters } from '../types/wine';
import wineApiService from '../services/wineApiService';

const router = express.Router();

// GET /api/wines - Get all wines with optional filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const filters: WineSearchFilters = {
      search: req.query.search as string,
      color: req.query.color as any,
      region: req.query.region as string,
      vintage_year_min: req.query.vintage_year_min ? parseInt(req.query.vintage_year_min as string) : undefined,
      vintage_year_max: req.query.vintage_year_max ? parseInt(req.query.vintage_year_max as string) : undefined,
      price_min: req.query.price_min ? parseFloat(req.query.price_min as string) : undefined,
      price_max: req.query.price_max ? parseFloat(req.query.price_max as string) : undefined,
      rating_min: req.query.rating_min ? parseInt(req.query.rating_min as string) : undefined,
      rating_max: req.query.rating_max ? parseInt(req.query.rating_max as string) : undefined,
      consumption_status: req.query.consumption_status as any,
      rack_slot: req.query.rack_slot as string,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof WineSearchFilters] === undefined) {
        delete filters[key as keyof WineSearchFilters];
      }
    });

    const { wines, total } = await WineModel.findAll(filters, page, limit);
    
    res.json({
      wines,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching wines:', error);
    res.status(500).json({ error: 'Failed to fetch wines' });
  }
});

// GET /api/wines/statistics - Get collection statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await WineModel.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching wine statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/wines/search-external - Search external wine databases
router.get('/search-external', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const vintage = req.query.vintage ? parseInt(req.query.vintage as string) : undefined;
    const region = req.query.region as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await wineApiService.searchWine({
      query,
      vintage,
      region,
      limit
    });

    return res.json({
      results,
      query,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching external wine databases:', error);
    return res.status(500).json({ error: 'Failed to search external wine databases' });
  }
});

// GET /api/wines/api-stats - Get wine API service statistics
router.get('/api-stats', async (req: Request, res: Response) => {
  try {
    const stats = wineApiService.getRequestStats();
    return res.json(stats);
  } catch (error) {
    console.error('Error getting API stats:', error);
    return res.status(500).json({ error: 'Failed to get API statistics' });
  }
});

// GET /api/wines/:id - Get a specific wine
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const wine = await WineModel.findById(req.params.id);
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }
    return res.json(wine);
  } catch (error) {
    console.error('Error fetching wine:', error);
    return res.status(500).json({ error: 'Failed to fetch wine' });
  }
});

// POST /api/wines - Create a new wine
router.post('/', async (req: Request, res: Response) => {
  try {
    // Basic validation
    const { name, vineyard, region, color, grape_varieties } = req.body;
    
    if (!name || !vineyard || !region || !color || !grape_varieties || !Array.isArray(grape_varieties)) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, vineyard, region, color, grape_varieties' 
      });
    }

    const validColors = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified'];
    if (!validColors.includes(color)) {
      return res.status(400).json({ 
        error: 'Invalid color. Must be one of: ' + validColors.join(', ') 
      });
    }

    if (req.body.vintage_year && (req.body.vintage_year < 1800 || req.body.vintage_year > new Date().getFullYear())) {
      return res.status(400).json({ 
        error: 'Invalid vintage year. Must be between 1800 and current year' 
      });
    }

    if (req.body.rating && (req.body.rating < 1 || req.body.rating > 100)) {
      return res.status(400).json({ 
        error: 'Invalid rating. Must be between 1 and 100' 
      });
    }

    const wineData: CreateWineRequest = {
      name: name.trim(),
      vineyard: vineyard.trim(),
      region: region.trim(),
      color,
      grape_varieties: grape_varieties.map((g: string) => g.trim()),
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      currency: req.body.currency || 'USD',
      vintage_year: req.body.vintage_year ? parseInt(req.body.vintage_year) : undefined,
      rack_slot: req.body.rack_slot?.trim(),
      description: req.body.description?.trim(),
      personal_notes: req.body.personal_notes?.trim(),
      rating: req.body.rating ? parseInt(req.body.rating) : undefined,
      food_pairings: req.body.food_pairings && Array.isArray(req.body.food_pairings) 
        ? req.body.food_pairings.map((p: string) => p.trim()) 
        : undefined,
    };

    const wine = await WineModel.create(wineData);
    return res.status(201).json(wine);
  } catch (error) {
    console.error('Error creating wine:', error);
    return res.status(500).json({ error: 'Failed to create wine' });
  }
});

// PUT /api/wines/:id - Update a wine
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existingWine = await WineModel.findById(req.params.id);
    if (!existingWine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    // Validate fields if provided
    if (req.body.color) {
      const validColors = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified'];
      if (!validColors.includes(req.body.color)) {
        return res.status(400).json({ 
          error: 'Invalid color. Must be one of: ' + validColors.join(', ') 
        });
      }
    }

    if (req.body.vintage_year && (req.body.vintage_year < 1800 || req.body.vintage_year > new Date().getFullYear())) {
      return res.status(400).json({ 
        error: 'Invalid vintage year. Must be between 1800 and current year' 
      });
    }

    if (req.body.rating && (req.body.rating < 1 || req.body.rating > 100)) {
      return res.status(400).json({ 
        error: 'Invalid rating. Must be between 1 and 100' 
      });
    }

    if (req.body.consumption_status) {
      const validStatuses = ['Available', 'Consumed', 'Reserved'];
      if (!validStatuses.includes(req.body.consumption_status)) {
        return res.status(400).json({ 
          error: 'Invalid consumption status. Must be one of: ' + validStatuses.join(', ') 
        });
      }
    }

    const updateData: UpdateWineRequest = {};
    
    // Only include fields that are provided
    const allowedFields = [
      'name', 'vineyard', 'region', 'color', 'grape_varieties', 'price', 'currency',
      'vintage_year', 'rack_slot', 'consumption_status', 'date_consumed',
      'description', 'personal_notes', 'rating', 'food_pairings'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'grape_varieties' || field === 'food_pairings') {
          (updateData as any)[field] = Array.isArray(req.body[field]) 
            ? req.body[field].map((item: string) => item.trim())
            : req.body[field];
        } else if (typeof req.body[field] === 'string') {
          (updateData as any)[field] = req.body[field].trim();
        } else {
          (updateData as any)[field] = req.body[field];
        }
      }
    });

    const updatedWine = await WineModel.update(req.params.id, updateData);
    return res.json(updatedWine);
  } catch (error) {
    console.error('Error updating wine:', error);
    return res.status(500).json({ error: 'Failed to update wine' });
  }
});

// POST /api/wines/:id/consume - Mark wine as consumed
router.post('/:id/consume', async (req: Request, res: Response) => {
  try {
    const wine = await WineModel.findById(req.params.id);
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    if (wine.consumption_status === 'Consumed') {
      return res.status(400).json({ error: 'Wine is already marked as consumed' });
    }

    const consumedDate = req.body.consumed_date ? new Date(req.body.consumed_date) : new Date();
    const updatedWine = await WineModel.markConsumed(req.params.id, consumedDate);
    
    return res.json(updatedWine);
  } catch (error) {
    console.error('Error marking wine as consumed:', error);
    return res.status(500).json({ error: 'Failed to mark wine as consumed' });
  }
});

// DELETE /api/wines/:id - Delete a wine
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const wine = await WineModel.findById(req.params.id);
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    const deleted = await WineModel.delete(req.params.id);
    if (deleted) {
      return res.status(204).send();
    } else {
      return res.status(500).json({ error: 'Failed to delete wine' });
    }
  } catch (error) {
    console.error('Error deleting wine:', error);
    return res.status(500).json({ error: 'Failed to delete wine' });
  }
});

// GET /api/wines/:id/food-pairings - Get food pairing suggestions for a wine
router.get('/:id/food-pairings', async (req: Request, res: Response) => {
  try {
    const wine = await WineModel.findById(req.params.id);
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    const suggestions = await wineApiService.suggestFoodPairings(wine);
    
    return res.json({
      wine_id: wine.id,
      wine_name: wine.name,
      suggestions
    });
  } catch (error) {
    console.error('Error getting food pairing suggestions:', error);
    return res.status(500).json({ error: 'Failed to get food pairing suggestions' });
  }
});

// POST /api/wines/:id/auto-populate - Auto-populate wine details from external APIs
router.post('/:id/auto-populate', async (req: Request, res: Response) => {
  try {
    const wine = await WineModel.findById(req.params.id);
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    const searchQuery = `${wine.name} ${wine.vineyard} ${wine.vintage_year || ''}`.trim();
    const results = await wineApiService.searchWine({
      query: searchQuery,
      vintage: wine.vintage_year,
      region: wine.region,
      limit: 1
    });

    if (results.length === 0) {
      return res.json({
        message: 'No external data found for this wine',
        populated: false
      });
    }

    const externalData = results[0];
    const updateData: UpdateWineRequest = {};

    // Only update fields that are currently empty
    if (!wine.description && externalData.description) {
      updateData.description = externalData.description;
    }
    if (!wine.rating && externalData.rating) {
      updateData.rating = externalData.rating;
    }
    if (!wine.food_pairings?.length && externalData.food_pairings?.length) {
      updateData.food_pairings = externalData.food_pairings;
    }
    if (!wine.price && externalData.price) {
      updateData.price = externalData.price;
      updateData.currency = externalData.currency || 'USD';
    }

    if (Object.keys(updateData).length === 0) {
      return res.json({
        message: 'Wine already has complete information',
        populated: false
      });
    }

    const updatedWine = await WineModel.update(req.params.id, updateData);
    
    return res.json({
      message: 'Wine details updated from external sources',
      populated: true,
      updated_fields: Object.keys(updateData),
      wine: updatedWine,
      source: externalData.source
    });
  } catch (error) {
    console.error('Error auto-populating wine details:', error);
    return res.status(500).json({ error: 'Failed to auto-populate wine details' });
  }
});

export default router;