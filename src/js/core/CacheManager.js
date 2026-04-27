/**
 * CacheManager - Sistema inteligente de caching com TTL e LRU
 * Pattern: Cache com estratégias de invalidação
 */

export class CacheManager {
  constructor(options = {}) {
    this._store = new Map();
    this._maxSize = options.maxSize || 1000;
    this._defaultTTL = options.defaultTTL || 300000; // 5 minutos
    this._stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletions: 0,
      evictions: 0,
    };
    this._cleanupInterval = null;

    if (options.autoCleanup !== false) {
      this._startAutoCleanup(options.cleanupInterval || 60000); // 1 minuto
    }
  }

  /**
   * Obtém um valor do cache
   */
  get(key) {
    if (!this._store.has(key)) {
      this._stats.misses++;
      return null;
    }

    const entry = this._store.get(key);

    // Verifica se expirou
    if (entry.ttl !== Infinity && Date.now() > entry.expiresAt) {
      this.delete(key);
      this._stats.misses++;
      return null;
    }

    // Atualiza tempo de acesso (LRU)
    entry.lastAccess = Date.now();
    entry.accessCount++;

    this._stats.hits++;
    return entry.value;
  }

  /**
   * Define um valor no cache
   */
  set(key, value, options = {}) {
    const ttl = options.ttl || this._defaultTTL;
    const now = Date.now();

    // Eviction se atingir limite
    if (this._store.size >= this._maxSize && !this._store.has(key)) {
      this._evictLRU();
    }

    this._store.set(key, {
      value,
      ttl,
      expiresAt: ttl === Infinity ? Infinity : now + ttl,
      lastAccess: now,
      accessCount: 0,
      size: this._estimateSize(value),
    });

    this._stats.sets++;
    return this;
  }

  /**
   * Remove um valor do cache
   */
  delete(key) {
    const deleted = this._store.delete(key);
    if (deleted) {
      this._stats.deletions++;
    }
    return deleted;
  }

  /**
   * Verifica se uma chave existe e é válida
   */
  has(key) {
    if (!this._store.has(key)) return false;

    const entry = this._store.get(key);
    if (entry.ttl !== Infinity && Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Obtém ou define (com função factory)
   */
  async getOrSet(key, factory, options = {}) {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const value = typeof factory === 'function' ? await factory() : factory;
    this.set(key, value, options);
    return value;
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this._store.clear();
    return this;
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    const totalSize = Array.from(this._store.values()).reduce((sum, entry) => sum + entry.size, 0);

    return {
      ...this._stats,
      size: this._store.size,
      maxSize: this._maxSize,
      hitRate: this._calculateHitRate(),
      totalSize: this._formatBytes(totalSize),
      avgAccessCount: this._getAvgAccessCount(),
    };
  }

  /**
   * Remove entradas expiradas
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this._store.entries()) {
      if (entry.ttl !== Infinity && now > entry.expiresAt) {
        this._store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[CacheManager] Cleaned up ${cleaned} expired entries`);
    }

    return cleaned;
  }

  /**
   * Remove N entradas menos recentemente usadas
   */
  _evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this._store.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this._store.delete(oldestKey);
      this._stats.evictions++;
      console.log(`[CacheManager] Evicted LRU entry: ${oldestKey}`);
    }
  }

  /**
   * Inicializa limpeza automático
   */
  _startAutoCleanup(interval) {
    this._cleanupInterval = setInterval(() => this.cleanup(), interval);
  }

  /**
   * Para limpeza automático
   */
  stopAutoCleanup() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }

  /**
   * Calcula taxa de acerto
   */
  _calculateHitRate() {
    const total = this._stats.hits + this._stats.misses;
    return total > 0 ? ((this._stats.hits / total) * 100).toFixed(2) + '%' : '0%';
  }

  /**
   * Calcula média de acessos
   */
  _getAvgAccessCount() {
    if (this._store.size === 0) return 0;

    const total = Array.from(this._store.values()).reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );

    return (total / this._store.size).toFixed(2);
  }

  /**
   * Estima tamanho de um valor em bytes
   */
  _estimateSize(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return value.length * 2;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;

    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024; // Fallback: 1KB
    }
  }

  /**
   * Formata bytes para leitura humana
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Persiste cache no localStorage
   */
  persist(storageKey = 'app-cache') {
    try {
      const data = {};
      for (const [key, entry] of this._store.entries()) {
        if (entry.ttl === Infinity || Date.now() <= entry.expiresAt) {
          data[key] = entry;
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[CacheManager] Failed to persist cache:', error);
      return false;
    }
  }

  /**
   * Restaura cache do localStorage
   */
  restore(storageKey = 'app-cache') {
    try {
      const data = localStorage.getItem(storageKey);
      if (!data) return this;

      const parsed = JSON.parse(data);
      const now = Date.now();

      for (const [key, entry] of Object.entries(parsed)) {
        // Só restaura se não expirou
        if (entry.ttl === Infinity || now <= entry.expiresAt) {
          this._store.set(key, entry);
        }
      }

      console.log(`[CacheManager] Restored ${this._store.size} entries from storage`);
      return this;
    } catch (error) {
      console.error('[CacheManager] Failed to restore cache:', error);
      return this;
    }
  }

  /**
   * Destrói o cache e limpa recursos
   */
  destroy() {
    this.stopAutoCleanup();
    this.clear();
  }
}

// Singleton instance
export const cacheManager = new CacheManager({
  maxSize: 500,
  defaultTTL: 600000, // 10 minutos
  autoCleanup: true,
  cleanupInterval: 120000, // 2 minutos
});
