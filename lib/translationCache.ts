/**
 * Translation Cache using LRU (Least Recently Used) eviction strategy
 */

interface CacheEntry {
  translation: string;
  timestamp: number;
  accessCount: number;
}

export class TranslationCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize = 500, ttl = 3600000) { // Default: 500 entries, 1 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.loadFromStorage();
  }

  /**
   * Generate cache key from source text and language pair
   */
  private generateKey(text: string, sourceLang: string, targetLang: string): string {
    return `${sourceLang}:${targetLang}:${text.toLowerCase().trim()}`;
  }

  /**
   * Get translation from cache
   */
  get(text: string, sourceLang: string, targetLang: string): string | null {
    const key = this.generateKey(text, sourceLang, targetLang);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    // Update access count and move to end (most recently used)
    entry.accessCount++;
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.saveToStorage();

    return entry.translation;
  }

  /**
   * Set translation in cache
   */
  set(text: string, sourceLang: string, targetLang: string, translation: string): void {
    const key = this.generateKey(text, sourceLang, targetLang);

    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      translation,
      timestamp: Date.now(),
      accessCount: 1
    });

    this.saveToStorage();
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('orbits_translation_cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
      }
    } catch (e) {
      console.warn('Failed to load translation cache from storage:', e);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('orbits_translation_cache', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save translation cache to storage:', e);
    }
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
    this.saveToStorage();
  }
}

// Singleton instance
export const translationCache = new TranslationCache();
