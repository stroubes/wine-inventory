import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = express.Router();

// Helper function to map database fields to API format
const mapMemoryToApi = (dbMemory: any) => {
  if (!dbMemory) return null;
  return {
    ...dbMemory,
    // Use the new content and date_experienced columns directly
    // Fall back to old columns if new ones are empty (for backward compatibility)
    content: dbMemory.content || dbMemory.description,
    date_experienced: dbMemory.date_experienced || dbMemory.experience_date,
    tags: JSON.parse(dbMemory.tags || '[]')
  };
};

// Get all memories for a wine
router.get('/wine/:wineId', async (req, res) => {
  try {
    const { wineId } = req.params;
    
    // Verify wine exists
    const wine = await db('wines').where('id', wineId).first();
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    const memories = await db('memories')
      .where('wine_id', wineId)
      .orderBy('created_at', 'desc');

    return res.json(memories.map(mapMemoryToApi));
  } catch (error) {
    console.error('Get wine memories error:', error);
    return res.status(500).json({ error: 'Failed to retrieve memories' });
  }
});

// Get memories statistics (must be before /:memoryId route)
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await db('memories')
      .select(
        db.raw('COUNT(*) as total_memories'),
        db.raw('AVG(rating) as average_rating'),
        db.raw('COUNT(DISTINCT wine_id) as wines_with_memories')
      )
      .first();

    const recentMemories = await db('memories')
      .orderBy('created_at', 'desc')
      .limit(5);

    return res.json({
      ...stats,
      recent_memories: recentMemories.map(mapMemoryToApi)
    });

  } catch (error) {
    console.error('Get memories stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve memory statistics' });
  }
});

// Get a specific memory
router.get('/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    
    const memory = await db('memories').where('id', memoryId).first();
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    return res.json(mapMemoryToApi(memory));
  } catch (error) {
    console.error('Get memory error:', error);
    return res.status(500).json({ error: 'Failed to retrieve memory' });
  }
});

// Create a new memory
router.post('/', async (req, res) => {
  try {
    const { wine_id, title, content, rating, location, date_experienced } = req.body;
    
    // Validate required fields
    if (!wine_id || !title || !content) {
      return res.status(400).json({ 
        error: 'Wine ID, title, and content are required' 
      });
    }

    // Verify wine exists
    const wine = await db('wines').where('id', wine_id).first();
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    const memoryId = uuidv4();
    const now = new Date().toISOString();

    const memoryData = {
      id: memoryId,
      wine_id,
      title: title.trim(),
      description: content.trim(), // Map content to description
      rating: rating || null,
      location: location?.trim() || null,
      experience_date: date_experienced || now, // Map date_experienced to experience_date
      tags: JSON.stringify([]), // Initialize empty tags array
      created_at: now,
      updated_at: now
    };

    await db('memories').insert(memoryData);

    // Return the created memory with mapped fields
    const createdMemory = await db('memories').where('id', memoryId).first();
    
    return res.status(201).json(mapMemoryToApi(createdMemory));

  } catch (error) {
    console.error('Create memory error:', error);
    return res.status(500).json({ error: 'Failed to create memory' });
  }
});

// Update a memory
router.put('/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    const { title, content, rating, location, date_experienced } = req.body;
    
    const memory = await db('memories').where('id', memoryId).first();
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.description = content.trim(); // Map content to description
    if (rating !== undefined) updates.rating = rating;
    if (location !== undefined) updates.location = location?.trim() || null;
    if (date_experienced !== undefined) updates.experience_date = date_experienced; // Map date_experienced to experience_date

    await db('memories').where('id', memoryId).update(updates);

    // Return the updated memory
    const updatedMemory = await db('memories').where('id', memoryId).first();
    return res.json(mapMemoryToApi(updatedMemory));

  } catch (error) {
    console.error('Update memory error:', error);
    return res.status(500).json({ error: 'Failed to update memory' });
  }
});

// Delete a memory
router.delete('/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    
    const memory = await db('memories').where('id', memoryId).first();
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Delete associated images first
    const memoryImages = await db('wine_images')
      .where('memory_id', memoryId);
    
    // Delete the image files if they exist
    if (memoryImages.length > 0) {
      await db('wine_images').where('memory_id', memoryId).del();
    }

    await db('memories').where('id', memoryId).del();

    return res.json({ message: 'Memory deleted successfully' });

  } catch (error) {
    console.error('Delete memory error:', error);
    return res.status(500).json({ error: 'Failed to delete memory' });
  }
});

export default router;