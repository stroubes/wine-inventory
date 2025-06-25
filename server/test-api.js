// Simple test to check if wineApiService works
const express = require('express');

const app = express();

app.get('/test', async (req, res) => {
  try {
    // Try to import and use the wine API service
    const { WineApiService } = require('./dist/services/wineApiService.js');
    console.log('WineApiService imported successfully');
    res.json({ status: 'OK', message: 'Wine API service works' });
  } catch (error) {
    console.error('Error with WineApiService:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3002, () => {
  console.log('Test server running on port 3002');
});