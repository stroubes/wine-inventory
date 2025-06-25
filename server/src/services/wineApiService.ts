import axios from 'axios';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import type { Wine } from '../types/wine';
import { WineDataNormalizer } from '../utils/wineDataNormalizer';

export interface WineApiSearchResult {
  name: string;
  vineyard: string;
  region: string;
  color: string;
  grape_varieties: string[];
  vintage_year?: number;
  rating?: number;
  description?: string;
  price?: number;
  currency?: string;
  food_pairings?: string[];
  image_url?: string;
  source: 'vivino' | 'wine_api' | 'manual';
}

export interface WineApiSearchOptions {
  query: string;
  vintage?: number;
  region?: string;
  limit?: number;
}

class WineApiService {
  private static instance: WineApiService;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
  private browser: any = null;

  private constructor() {}

  static getInstance(): WineApiService {
    if (!WineApiService.instance) {
      WineApiService.instance = new WineApiService();
    }
    return WineApiService.instance;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
    }
    return this.browser;
  }

  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private normalizeWineName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private extractYear(text: string): number | undefined {
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : undefined;
  }

  private parsePrice(priceText: string): { price: number; currency: string } | null {
    const priceMatch = priceText.match(/([£$€¥])?([\d,]+\.?\d*)/);
    if (!priceMatch) return null;

    const price = parseFloat(priceMatch[2].replace(/,/g, ''));
    let currency = 'USD';
    
    if (priceMatch[1]) {
      switch (priceMatch[1]) {
        case '£': currency = 'GBP'; break;
        case '€': currency = 'EUR'; break;
        case '¥': currency = 'JPY'; break;
        case '$': currency = 'USD'; break;
      }
    }

    return { price, currency };
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`${operationName} attempt ${attempt + 1} failed:`, error);

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // If this isn't the last attempt, wait before retrying
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`Retrying ${operationName} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`${operationName} failed after ${this.MAX_RETRIES} attempts`);
    throw lastError;
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry on certain types of errors
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      return true; // Network connectivity issues
    }
    
    if (error?.message?.includes('Navigation timeout')) {
      return false; // Timeout errors should be retried
    }
    
    if (error?.status === 404 || error?.status === 403) {
      return true; // Client errors that won't change on retry
    }
    
    return false; // Retry by default
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  async searchWine(options: WineApiSearchOptions): Promise<WineApiSearchResult[]> {
    const results: WineApiSearchResult[] = [];

    try {
      // Try Vivino API first
      const vivinoResults = await this.searchVivino(options);
      results.push(...vivinoResults);
    } catch (error) {
      console.warn('Vivino API search failed:', error);
    }

    try {
      // Try Wine API as fallback (mock implementation)
      const wineApiResults = await this.searchWineApi(options);
      results.push(...wineApiResults);
    } catch (error) {
      console.warn('Wine API search failed:', error);
    }

    // Normalize all results
    const normalizedResults = results.map(wine => WineDataNormalizer.normalizeWineData(wine));

    // Remove duplicates
    const uniqueResults = WineDataNormalizer.removeDuplicates(normalizedResults);

    return uniqueResults.slice(0, options.limit || 10);
  }

  private async searchVivino(options: WineApiSearchOptions): Promise<WineApiSearchResult[]> {
    return this.retryWithExponentialBackoff(
      () => this.performVivinoSearch(options),
      'Vivino search'
    );
  }

  private async performVivinoSearch(options: WineApiSearchOptions): Promise<WineApiSearchResult[]> {
    await this.rateLimit();

    const browser = await this.getBrowser();
    let page: any = null;

    try {
      page = await browser.newPage();
      
      // Configure page for better reliability
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1280, height: 720 });
      
      // Set extra headers to avoid detection
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });
      
      // Build search URL
      const searchQuery = encodeURIComponent(options.query);
      const searchUrl = `https://www.vivino.com/search/wines?q=${searchQuery}`;
      
      console.log(`Searching Vivino for: "${options.query}"`);
      
      // Navigate with timeout
      await this.withTimeout(
        page.goto(searchUrl, { 
          waitUntil: 'networkidle2', 
          timeout: 45000 
        }),
        50000,
        'Vivino page navigation'
      );
      
      // Wait for wine cards to load with timeout
      await this.withTimeout(
        page.waitForSelector('.wine-card', { timeout: 15000 }),
        20000,
        'Vivino wine cards loading'
      ).catch(() => {
        console.warn('No wine cards found on Vivino search page');
      });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const results: WineApiSearchResult[] = [];
      
      $('.wine-card').each((index, element) => {
        if (index >= (options.limit || 10)) return false;
        
        try {
          const $card = $(element);
          
          // Extract wine name
          const nameElement = $card.find('.wine-card__name a');
          const name = nameElement.text().trim();
          if (!name) return undefined;
          
          // Extract winery
          const wineryElement = $card.find('.wine-card__winery a');
          const vineyard = wineryElement.text().trim() || 'Unknown Winery';
          
          // Extract region
          const regionElement = $card.find('.wine-card__region');
          const region = regionElement.text().trim() || options.region || 'Unknown Region';
          
          // Extract rating
          const ratingElement = $card.find('.average__number');
          const ratingText = ratingElement.text().trim();
          const rating = ratingText ? Math.round(parseFloat(ratingText) * 20) : undefined; // Convert to 100-point scale
          
          // Extract vintage year
          const vintage_year = this.extractYear(name) || options.vintage;
          
          // Extract price
          let price: number | undefined;
          let currency = 'USD';
          const priceElement = $card.find('.wine-price-value');
          if (priceElement.length > 0) {
            const priceData = this.parsePrice(priceElement.text().trim());
            if (priceData) {
              price = priceData.price;
              currency = priceData.currency;
            }
          }
          
          // Determine wine color/type (basic inference from name/description)
          let color = 'Red'; // Default
          const nameAndRegion = `${name} ${region}`.toLowerCase();
          if (nameAndRegion.includes('chardonnay') || nameAndRegion.includes('sauvignon blanc') || 
              nameAndRegion.includes('riesling') || nameAndRegion.includes('pinot grigio') ||
              nameAndRegion.includes('white')) {
            color = 'White';
          } else if (nameAndRegion.includes('rosé') || nameAndRegion.includes('rose')) {
            color = 'Rosé';
          } else if (nameAndRegion.includes('champagne') || nameAndRegion.includes('prosecco') ||
                     nameAndRegion.includes('cava') || nameAndRegion.includes('sparkling')) {
            color = 'Sparkling';
          }
          
          // Extract grape varieties (basic inference)
          const grape_varieties: string[] = [];
          const inferGrapes = (text: string) => {
            const grapes = [
              'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Chardonnay', 'Sauvignon Blanc',
              'Riesling', 'Pinot Grigio', 'Syrah', 'Shiraz', 'Grenache', 'Sangiovese',
              'Tempranillo', 'Nebbiolo', 'Barbera', 'Chianti'
            ];
            
            grapes.forEach(grape => {
              if (text.toLowerCase().includes(grape.toLowerCase())) {
                grape_varieties.push(grape);
              }
            });
          };
          
          inferGrapes(name);
          if (grape_varieties.length === 0) {
            // Default based on color
            if (color === 'Red') grape_varieties.push('Red Blend');
            else if (color === 'White') grape_varieties.push('White Blend');
            else grape_varieties.push('Mixed');
          }
          
          // Get image URL
          const imageElement = $card.find('.wine-card__image img');
          const image_url = imageElement.attr('src') || imageElement.attr('data-src');
          
          results.push({
            name,
            vineyard,
            region,
            color,
            grape_varieties,
            vintage_year,
            rating,
            price,
            currency,
            image_url,
            source: 'vivino'
          });
          
        } catch (error) {
          console.warn('Error parsing wine card:', error);
        }
        
        return undefined; // Continue iteration
      });
      
      console.log(`Found ${results.length} wines from Vivino`);
      return results;
      
    } catch (error) {
      console.error('Vivino scraping error:', error);
      throw error; // Let the retry logic handle it
    } finally {
      if (page) {
        await page.close().catch(() => {}); // Ignore close errors
      }
    }
  }

  private async searchWineApi(options: WineApiSearchOptions): Promise<WineApiSearchResult[]> {
    await this.rateLimit();

    // Mock Wine API response - replace with actual API integration
    const mockResults: WineApiSearchResult[] = [
      {
        name: `${options.query} Estate`,
        vineyard: 'Heritage Vineyards',
        region: options.region || 'Sonoma County',
        color: 'Red',
        grape_varieties: ['Pinot Noir'],
        vintage_year: options.vintage || 2019,
        rating: 92,
        description: 'Elegant wine with bright acidity and cherry flavors.',
        price: 38.50,
        currency: 'USD',
        food_pairings: ['Salmon', 'Duck', 'Mushroom dishes'],
        source: 'wine_api'
      }
    ];

    return mockResults;
  }

  async getWineDetails(id: string, source: string): Promise<WineApiSearchResult | null> {
    await this.rateLimit();

    try {
      switch (source) {
        case 'vivino':
          return await this.getVivinoDetails(id);
        case 'wine_api':
          return await this.getWineApiDetails(id);
        default:
          throw new Error(`Unknown wine API source: ${source}`);
      }
    } catch (error) {
      console.error(`Failed to get wine details from ${source}:`, error);
      return null;
    }
  }

  private async getVivinoDetails(id: string): Promise<WineApiSearchResult | null> {
    // Mock Vivino details - implement actual API call
    return {
      name: 'Detailed Wine Name',
      vineyard: 'Detailed Winery',
      region: 'Detailed Region',
      color: 'Red',
      grape_varieties: ['Cabernet Sauvignon', 'Merlot'],
      vintage_year: 2018,
      rating: 90,
      description: 'Full detailed description from Vivino...',
      price: 55.00,
      currency: 'USD',
      food_pairings: ['Beef', 'Lamb', 'Strong cheese'],
      source: 'vivino'
    };
  }

  private async getWineApiDetails(id: string): Promise<WineApiSearchResult | null> {
    // Mock Wine API details - implement actual API call
    return {
      name: 'Another Detailed Wine',
      vineyard: 'Premium Estates',
      region: 'Bordeaux',
      color: 'Red',
      grape_varieties: ['Cabernet Sauvignon', 'Cabernet Franc'],
      vintage_year: 2017,
      rating: 95,
      description: 'Exceptional wine with complex flavors...',
      price: 85.00,
      currency: 'USD',
      food_pairings: ['Steak', 'Game', 'Aged cheese'],
      source: 'wine_api'
    };
  }

  async suggestFoodPairings(wine: Partial<Wine>): Promise<string[]> {
    await this.rateLimit();

    // Basic food pairing logic based on wine characteristics
    const pairings: string[] = [];

    // Color-based pairings
    switch (wine.color) {
      case 'Red':
        pairings.push('Red meat', 'Hard cheese', 'Dark chocolate');
        break;
      case 'White':
        pairings.push('Fish', 'Poultry', 'Soft cheese');
        break;
      case 'Rosé':
        pairings.push('Salmon', 'Light pasta', 'Fruit desserts');
        break;
      case 'Sparkling':
        pairings.push('Appetizers', 'Seafood', 'Celebration dishes');
        break;
      case 'Dessert':
        pairings.push('Desserts', 'Blue cheese', 'Foie gras');
        break;
      case 'Fortified':
        pairings.push('Nuts', 'Dried fruits', 'Strong cheese');
        break;
    }

    // Grape variety specific pairings
    if (wine.grape_varieties) {
      wine.grape_varieties.forEach(grape => {
        switch (grape.toLowerCase()) {
          case 'cabernet sauvignon':
            pairings.push('Grilled steak', 'Lamb chops');
            break;
          case 'pinot noir':
            pairings.push('Duck', 'Mushroom risotto');
            break;
          case 'chardonnay':
            pairings.push('Lobster', 'Cream sauces');
            break;
          case 'sauvignon blanc':
            pairings.push('Goat cheese', 'Shellfish');
            break;
        }
      });
    }

    return [...new Set(pairings)]; // Remove duplicates
  }

  getRequestStats(): { count: number; lastRequest: Date } {
    return {
      count: this.requestCount,
      lastRequest: new Date(this.lastRequestTime)
    };
  }

  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}

export default WineApiService.getInstance();