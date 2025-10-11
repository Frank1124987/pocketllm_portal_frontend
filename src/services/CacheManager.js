/**
 * CacheManager - Manages prompt/response caching
 * Implements FR4: Response Caching
 */
export class CacheManager {
  constructor(maxSize = 500, ttl = 3600) {
    this.cache = new Map();
    this.maxSize = maxSize * 1024 * 1024; // Convert MB to bytes
    this.ttl = ttl;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * Generate a cache key from prompt using simple hashing
   * @private
   */
  _generateKey(prompt) {
    // Normalize prompt and create a simple hash
    const normalized = prompt.toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `cache_${Math.abs(hash)}`;
  }

  /**
   * Calculate approximate size of an object in bytes
   * @private
   */
  _sizeOf(obj) {
    return JSON.stringify(obj).length * 2; // Rough estimate
  }

  /**
   * Get current cache size in bytes
   * @private
   */
  _getCacheSize() {
    let size = 0;
    for (const value of this.cache.values()) {
      size += this._sizeOf(value);
    }
    return size;
  }

  /**
   * Evict oldest entry when cache exceeds max size
   * @private
   */
  _evictOldest() {
    if (this.cache.size === 0) return;

    let oldest = null;
    let oldestKey = null;

    for (const [key, value] of this.cache.entries()) {
      if (!oldest || value.createdAt < oldest.createdAt) {
        oldest = value;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Put a value in the cache (FR4)
   */
  put(prompt, response, metadata = {}) {
    const key = this._generateKey(prompt);
    
    // Check if we need to evict
    while (this._getCacheSize() > this.maxSize && this.cache.size > 0) {
      this._evictOldest();
    }

    const entry = {
      prompt: prompt.substring(0, 200), // Store first 200 chars of prompt
      response,
      metadata,
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.ttl * 1000),
      accessCount: 0
    };

    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache (FR4)
   */
  get(prompt) {
    const key = this._generateKey(prompt);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.accessCount++;
    this.stats.hits++;
    return entry;
  }

  /**
   * Check if a prompt exists in cache
   */
  has(prompt) {
    return this.get(prompt) !== null;
  }

  /**
   * Remove a specific entry from cache (FR4)
   */
  remove(prompt) {
    const key = this._generateKey(prompt);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries (FR4)
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  /**
   * Get cache statistics (FR5)
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0
      ? ((this.stats.hits / totalRequests) * 100).toFixed(2)
      : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      evictions: this.stats.evictions,
      size: this._getCacheSize(),
      maxSize: this.maxSize,
      entries: this.cache.size,
      utilizationPercent: ((this._getCacheSize() / this.maxSize) * 100).toFixed(2)
    };
  }

  /**
   * Set TTL (Time To Live) for cache entries (FR5)
   */
  setTTL(ttl) {
    this.ttl = ttl;
  }

  /**
   * Set max cache size in MB (FR5)
   */
  setMaxSize(sizeInMB) {
    this.maxSize = sizeInMB * 1024 * 1024;
    // Evict if necessary
    while (this._getCacheSize() > this.maxSize && this.cache.size > 0) {
      this._evictOldest();
    }
  }

  /**
   * Get all cache entries (for debugging/admin)
   */
  getAllEntries() {
    return Array.from(this.cache.values()).map(entry => ({
      prompt: entry.prompt,
      responseLength: entry.response?.length || 0,
      createdAt: new Date(entry.createdAt),
      expiresAt: new Date(entry.expiresAt),
      accessCount: entry.accessCount
    }));
  }

  /**
   * Invalidate expired entries (maintenance)
   */
  purgeExpired() {
    let purged = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        purged++;
      }
    }
    return purged;
  }
}
