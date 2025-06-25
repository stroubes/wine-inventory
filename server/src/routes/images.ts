import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload images for a wine
router.post('/wine/:wineId', upload.array('images', 5), async (req, res) => {
  try {
    const { wineId } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify wine exists
    const wine = await db('wines').where('id', wineId).first();
    if (!wine) {
      return res.status(404).json({ error: 'Wine not found' });
    }

    const uploadedImages = [];

    for (const file of files) {
      const imageId = uuidv4();
      const filename = `${imageId}.webp`;
      const filepath = path.join(uploadsDir, filename);

      // Process and compress image
      const processedBuffer = await sharp(file.buffer)
        .resize(800, 800, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 85 })
        .toBuffer();

      // Save to disk
      fs.writeFileSync(filepath, processedBuffer);

      // Determine image type from field name or default to 'memory'
      const imageType = req.body.imageType || 'memory';
      
      // Save to database
      await db('images').insert({
        id: imageId,
        wine_id: wineId,
        image_type: imageType,
        filename: filename,
        original_name: file.originalname,
        size: processedBuffer.length,
        mime_type: 'image/webp',
        created_at: new Date().toISOString()
      });

      uploadedImages.push({
        id: imageId,
        filename: filename,
        original_name: file.originalname,
        image_type: imageType,
        size: processedBuffer.length,
        mime_type: 'image/webp'
      });
    }

    return res.json({ 
      message: 'Images uploaded successfully',
      images: uploadedImages 
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get image file
router.get('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const image = await db('images').where('id', imageId).first();
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const filepath = path.join(uploadsDir, image.filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    res.setHeader('Content-Type', image.mime_type);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.sendFile(filepath);
    
  } catch (error) {
    console.error('Get image error:', error);
    return res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

// Get all images for a wine
router.get('/wine/:wineId', async (req, res) => {
  try {
    const { wineId } = req.params;
    
    const images = await db('images')
      .where('wine_id', wineId)
      .orderBy('created_at', 'desc');

    return res.json(images);
    
  } catch (error) {
    console.error('Get wine images error:', error);
    return res.status(500).json({ error: 'Failed to retrieve wine images' });
  }
});

// Delete an image
router.delete('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const image = await db('images').where('id', imageId).first();
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file from disk
    const filepath = path.join(uploadsDir, image.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from database
    await db('images').where('id', imageId).del();

    return res.json({ message: 'Image deleted successfully' });
    
  } catch (error) {
    console.error('Delete image error:', error);
    return res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Update image metadata
router.put('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const { image_type, alt_text, description } = req.body;
    
    const image = await db('images').where('id', imageId).first();
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const updates: any = {};
    if (image_type) updates.image_type = image_type;
    if (alt_text !== undefined) updates.alt_text = alt_text;
    if (description !== undefined) updates.description = description;
    updates.updated_at = new Date().toISOString();

    await db('images').where('id', imageId).update(updates);

    const updatedImage = await db('images').where('id', imageId).first();
    return res.json(updatedImage);
    
  } catch (error) {
    console.error('Update image error:', error);
    return res.status(500).json({ error: 'Failed to update image' });
  }
});

export default router;