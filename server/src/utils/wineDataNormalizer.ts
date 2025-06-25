import type { WineApiSearchResult } from '../services/wineApiService';

// Common wine regions mapping
const REGION_MAPPING: Record<string, string> = {
  // Napa Valley variations
  'napa': 'Napa Valley, California',
  'napa valley': 'Napa Valley, California',
  'napa valley, ca': 'Napa Valley, California',
  'napa, california': 'Napa Valley, California',
  
  // Sonoma variations
  'sonoma': 'Sonoma County, California',
  'sonoma county': 'Sonoma County, California',
  'sonoma, ca': 'Sonoma County, California',
  
  // Bordeaux variations
  'bordeaux': 'Bordeaux, France',
  'bordelais': 'Bordeaux, France',
  
  // Burgundy variations
  'burgundy': 'Burgundy, France',
  'bourgogne': 'Burgundy, France',
  
  // Champagne variations
  'champagne': 'Champagne, France',
  
  // Tuscany variations
  'tuscany': 'Tuscany, Italy',
  'toscana': 'Tuscany, Italy',
  'chianti': 'Chianti, Tuscany, Italy',
  
  // Piedmont variations
  'piedmont': 'Piedmont, Italy',
  'piemonte': 'Piedmont, Italy',
  
  // Rioja variations
  'rioja': 'Rioja, Spain',
  'la rioja': 'Rioja, Spain',
  
  // German regions
  'mosel': 'Mosel, Germany',
  'rheingau': 'Rheingau, Germany',
  'pfalz': 'Pfalz, Germany',
  
  // Australian regions
  'barossa': 'Barossa Valley, Australia',
  'barossa valley': 'Barossa Valley, Australia',
  'hunter valley': 'Hunter Valley, Australia',
  'clare valley': 'Clare Valley, Australia',
  'coonawarra': 'Coonawarra, Australia',
  
  // Chilean regions
  'maipo': 'Maipo Valley, Chile',
  'maipo valley': 'Maipo Valley, Chile',
  'colchagua': 'Colchagua Valley, Chile',
  'casablanca': 'Casablanca Valley, Chile',
  
  // Argentine regions
  'mendoza': 'Mendoza, Argentina',
  'salta': 'Salta, Argentina',
  
  // South African regions
  'stellenbosch': 'Stellenbosch, South Africa',
  'paarl': 'Paarl, South Africa',
  
  // Canadian regions
  'okanagan': 'Okanagan Valley, British Columbia',
  'okanagan valley': 'Okanagan Valley, British Columbia',
  'niagara': 'Niagara Peninsula, Ontario',
  'niagara peninsula': 'Niagara Peninsula, Ontario',
};

// Common grape variety standardization
const GRAPE_VARIETY_MAPPING: Record<string, string> = {
  // Red varieties
  'cabernet sauvignon': 'Cabernet Sauvignon',
  'cab sauv': 'Cabernet Sauvignon',
  'cabernet': 'Cabernet Sauvignon',
  'merlot': 'Merlot',
  'pinot noir': 'Pinot Noir',
  'pinot': 'Pinot Noir',
  'syrah': 'Syrah',
  'shiraz': 'Syrah', // Syrah and Shiraz are the same grape
  'grenache': 'Grenache',
  'sangiovese': 'Sangiovese',
  'tempranillo': 'Tempranillo',
  'nebbiolo': 'Nebbiolo',
  'barbera': 'Barbera',
  'malbec': 'Malbec',
  'petit verdot': 'Petit Verdot',
  'cabernet franc': 'Cabernet Franc',
  'carmenere': 'Carménère',
  'carmenère': 'Carménère',
  'zinfandel': 'Zinfandel',
  'primitivo': 'Zinfandel', // Same grape as Zinfandel
  'gamay': 'Gamay',
  'mourvèdre': 'Mourvèdre',
  'mourvedre': 'Mourvèdre',
  
  // White varieties
  'chardonnay': 'Chardonnay',
  'sauvignon blanc': 'Sauvignon Blanc',
  'sauv blanc': 'Sauvignon Blanc',
  'riesling': 'Riesling',
  'pinot grigio': 'Pinot Grigio',
  'pinot gris': 'Pinot Gris',
  'gewürztraminer': 'Gewürztraminer',
  'gewurztraminer': 'Gewürztraminer',
  'viognier': 'Viognier',
  'chenin blanc': 'Chenin Blanc',
  'semillon': 'Sémillon',
  'sémillon': 'Sémillon',
  'albariño': 'Albariño',
  'albarino': 'Albariño',
  'verdejo': 'Verdejo',
  'grüner veltliner': 'Grüner Veltliner',
  'gruner veltliner': 'Grüner Veltliner',
  'moscato': 'Moscato',
  'muscat': 'Muscat',
  'torrontés': 'Torrontés',
  'torrontes': 'Torrontés',
};

// Common wine color classification
const COLOR_CLASSIFICATION = {
  RED_INDICATORS: [
    'cabernet', 'merlot', 'pinot noir', 'syrah', 'shiraz', 'grenache',
    'sangiovese', 'tempranillo', 'nebbiolo', 'barbera', 'malbec',
    'zinfandel', 'primitivo', 'red wine', 'rouge', 'rosso', 'tinto'
  ],
  WHITE_INDICATORS: [
    'chardonnay', 'sauvignon blanc', 'riesling', 'pinot grigio', 'pinot gris',
    'gewürztraminer', 'viognier', 'chenin blanc', 'semillon', 'albariño',
    'white wine', 'blanc', 'bianco', 'blanco'
  ],
  SPARKLING_INDICATORS: [
    'champagne', 'prosecco', 'cava', 'crémant', 'sparkling', 'spumante',
    'sekt', 'espumoso', 'mousseux'
  ],
  ROSÉ_INDICATORS: [
    'rosé', 'rose', 'rosado', 'rosato', 'pink'
  ]
};

export class WineDataNormalizer {
  
  /**
   * Normalize a wine region name to a standardized format
   */
  static normalizeRegion(region: string): string {
    if (!region) return 'Unknown Region';
    
    const cleaned = region.toLowerCase().trim();
    
    // Check direct mapping first
    if (REGION_MAPPING[cleaned]) {
      return REGION_MAPPING[cleaned];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(REGION_MAPPING)) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        return value;
      }
    }
    
    // If no mapping found, return cleaned version with proper capitalization
    return region
      .split(',')
      .map(part => part.trim())
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(', ');
  }

  /**
   * Normalize grape variety names to standardized format
   */
  static normalizeGrapeVarieties(varieties: string[]): string[] {
    if (!varieties || varieties.length === 0) return [];
    
    return varieties
      .map(variety => {
        const cleaned = variety.toLowerCase().trim();
        
        // Check direct mapping
        if (GRAPE_VARIETY_MAPPING[cleaned]) {
          return GRAPE_VARIETY_MAPPING[cleaned];
        }
        
        // Check for partial matches
        for (const [key, value] of Object.entries(GRAPE_VARIETY_MAPPING)) {
          if (cleaned.includes(key) || key.includes(cleaned)) {
            return value;
          }
        }
        
        // Return with proper capitalization if no mapping found
        return variety
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      })
      .filter((variety, index, array) => array.indexOf(variety) === index); // Remove duplicates
  }

  /**
   * Determine wine color based on name, grape varieties, and other indicators
   */
  static determineWineColor(wine: WineApiSearchResult): string {
    const searchText = `${wine.name} ${wine.grape_varieties.join(' ')} ${wine.description || ''}`.toLowerCase();
    
    // Check for sparkling first (highest priority)
    if (COLOR_CLASSIFICATION.SPARKLING_INDICATORS.some(indicator => 
        searchText.includes(indicator))) {
      return 'Sparkling';
    }
    
    // Check for rosé
    if (COLOR_CLASSIFICATION.ROSÉ_INDICATORS.some(indicator => 
        searchText.includes(indicator))) {
      return 'Rosé';
    }
    
    // Check for white wine indicators
    if (COLOR_CLASSIFICATION.WHITE_INDICATORS.some(indicator => 
        searchText.includes(indicator))) {
      return 'White';
    }
    
    // Check for red wine indicators
    if (COLOR_CLASSIFICATION.RED_INDICATORS.some(indicator => 
        searchText.includes(indicator))) {
      return 'Red';
    }
    
    // Default to original color or Red if uncertain
    return wine.color || 'Red';
  }

  /**
   * Clean and normalize wine name
   */
  static normalizeName(name: string): string {
    if (!name) return '';
    
    return name
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[""]/g, '"') // Normalize quotes
      .replace(/['']/g, "'"); // Normalize apostrophes
  }

  /**
   * Clean and normalize vineyard/winery name
   */
  static normalizeVineyard(vineyard: string): string {
    if (!vineyard) return 'Unknown Winery';
    
    return vineyard
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b(winery|wines|vineyard|estate|cellars?|domaine|château|chateau)\b$/i, '')
      .trim()
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'");
  }

  /**
   * Validate and normalize vintage year
   */
  static normalizeVintage(vintage?: number): number | undefined {
    if (!vintage) return undefined;
    
    const currentYear = new Date().getFullYear();
    
    // Vintage should be between 1800 and current year
    if (vintage < 1800 || vintage > currentYear) {
      return undefined;
    }
    
    return vintage;
  }

  /**
   * Normalize price to ensure it's a reasonable value
   */
  static normalizePrice(price?: number): number | undefined {
    if (!price || price <= 0) return undefined;
    
    // Prices should be reasonable (between $1 and $10,000)
    if (price < 1 || price > 10000) {
      return undefined;
    }
    
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Normalize rating to 100-point scale
   */
  static normalizeRating(rating?: number, source?: string): number | undefined {
    if (!rating) return undefined;
    
    // Different sources use different scales
    switch (source) {
      case 'vivino':
        // Vivino uses 1-5 scale, convert to 100-point
        if (rating >= 1 && rating <= 5) {
          return Math.round(rating * 20);
        }
        break;
      
      case 'wine_api':
        // Assume already 100-point scale
        if (rating >= 1 && rating <= 100) {
          return Math.round(rating);
        }
        break;
      
      default:
        // Try to determine scale automatically
        if (rating >= 1 && rating <= 5) {
          return Math.round(rating * 20); // 5-point scale
        } else if (rating >= 1 && rating <= 100) {
          return Math.round(rating); // 100-point scale
        }
    }
    
    return undefined;
  }

  /**
   * Clean and normalize description text
   */
  static normalizeDescription(description?: string): string | undefined {
    if (!description) return undefined;
    
    return description
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n+/g, ' ') // Newlines to spaces
      .replace(/[""]/g, '"') // Normalize quotes
      .replace(/['']/g, "'") // Normalize apostrophes
      .substring(0, 1000); // Limit length
  }

  /**
   * Normalize a complete wine search result
   */
  static normalizeWineData(wine: WineApiSearchResult): WineApiSearchResult {
    return {
      ...wine,
      name: this.normalizeName(wine.name),
      vineyard: this.normalizeVineyard(wine.vineyard),
      region: this.normalizeRegion(wine.region),
      color: this.determineWineColor(wine),
      grape_varieties: this.normalizeGrapeVarieties(wine.grape_varieties),
      vintage_year: this.normalizeVintage(wine.vintage_year),
      rating: this.normalizeRating(wine.rating, wine.source),
      description: this.normalizeDescription(wine.description),
      price: this.normalizePrice(wine.price),
      currency: wine.currency || 'USD',
      food_pairings: wine.food_pairings?.filter(pairing => pairing.trim().length > 0) || [],
    };
  }

  /**
   * Check if a wine result appears to be a duplicate
   */
  static isDuplicate(wine1: WineApiSearchResult, wine2: WineApiSearchResult): boolean {
    const similarity = this.calculateSimilarity(wine1, wine2);
    return similarity > 0.8; // 80% similarity threshold
  }

  /**
   * Calculate similarity between two wine results (0-1 scale)
   */
  static calculateSimilarity(wine1: WineApiSearchResult, wine2: WineApiSearchResult): number {
    let score = 0;
    let factors = 0;

    // Name similarity (weighted heavily)
    const nameSimilarity = this.stringSimilarity(wine1.name, wine2.name);
    score += nameSimilarity * 0.4;
    factors += 0.4;

    // Vineyard similarity
    const vineyardSimilarity = this.stringSimilarity(wine1.vineyard, wine2.vineyard);
    score += vineyardSimilarity * 0.3;
    factors += 0.3;

    // Vintage match
    if (wine1.vintage_year && wine2.vintage_year) {
      score += (wine1.vintage_year === wine2.vintage_year ? 1 : 0) * 0.2;
      factors += 0.2;
    }

    // Region similarity
    const regionSimilarity = this.stringSimilarity(wine1.region, wine2.region);
    score += regionSimilarity * 0.1;
    factors += 0.1;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate string similarity using Jaro-Winkler distance
   */
  private static stringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    if (matchWindow < 0) return 0;
    
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Find transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    // Jaro-Winkler prefix scaling
    let prefix = 0;
    for (let i = 0; i < Math.min(len1, len2, 4); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }
    
    return jaro + 0.1 * prefix * (1 - jaro);
  }

  /**
   * Remove duplicates from an array of wine results
   */
  static removeDuplicates(wines: WineApiSearchResult[]): WineApiSearchResult[] {
    const unique: WineApiSearchResult[] = [];
    
    for (const wine of wines) {
      const isDupe = unique.some(existing => this.isDuplicate(wine, existing));
      if (!isDupe) {
        unique.push(wine);
      }
    }
    
    return unique;
  }
}

export default WineDataNormalizer;