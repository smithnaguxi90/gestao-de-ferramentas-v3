/**
 * MetricsManager - Sistema de métricas e analytics
 * Pattern: Observer com métricas em tempo real
 */

import { eventBus } from './EventEmitter.js';

export class MetricsManager {
  constructor() {
    this._metrics = new Map();
    this._counters = new Map();
    this._timers = new Map();
    this._history = [];
    this._maxHistory = 1000;
    this._listeners = [];
    this._startTime = Date.now();

    this._setupEventListeners();
  }

  /**
   * Incrementa um contador
   */
  increment(name, value = 1) {
    const current = this._counters.get(name) || 0;
    this._counters.set(name, current + value);

    this._emitMetric('counter', { name, value: current + value, delta: value });
    return this;
  }

  /**
   * Decrementa um contador
   */
  decrement(name, value = 1) {
    return this.increment(name, -value);
  }

  /**
   * Define um valor absoluto para um contador
   */
  setCounter(name, value) {
    this._counters.set(name, value);
    this._emitMetric('counter_set', { name, value });
    return this;
  }

  /**
   * Obtém valor de um contador
   */
  getCounter(name) {
    return this._counters.get(name) || 0;
  }

  /**
   * Inicia um timer
   */
  startTimer(name) {
    this._timers.set(name, {
      start: Date.now(),
      laps: []
    });
    return this;
  }

  /**
   * Para um timer e registra métrica
   */
  stopTimer(name, metadata = {}) {
    const timer = this._timers.get(name);
    if (!timer) {
      console.warn(`[Metrics] Timer "${name}" não encontrado`);
      return null;
    }

    const duration = Date.now() - timer.start;
    const totalLaps = timer.laps.reduce((sum, lap) => sum + lap, 0);

    const metric = {
      name,
      duration,
      totalLaps,
      lapCount: timer.laps.length,
      ...metadata
    };

    this._emitMetric('timer', metric);
    this._timers.delete(name);

    return duration;
  }

  /**
   * Registra uma volta (lap) em um timer
   */
  lapTimer(name, metadata = {}) {
    const timer = this._timers.get(name);
    if (!timer) {
      console.warn(`[Metrics] Timer "${name}" não encontrado`);
      return null;
    }

    const lapTime = Date.now() - timer.start - timer.laps.reduce((sum, t) => sum + t, 0);
    timer.laps.push(lapTime);

    this._emitMetric('timer_lap', { name, lapTime, lapCount: timer.laps.length, ...metadata });
    return lapTime;
  }

  /**
   * Registra uma métrica customizada
   */
  record(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };

    this._emitMetric('custom', metric);
    return this;
  }

  /**
   * Registra performance de uma operação
   */
  async measure(operation, fn, metadata = {}) {
    this.startTimer(operation);

    try {
      const result = await fn();
      const duration = this.stopTimer(operation, metadata);

      this.increment('operations.success');
      this.record('operation.duration', duration, { operation, ...metadata });

      return result;
    } catch (error) {
      this.stopTimer(operation);
      this.increment('operations.error');
      this.record('operation.error', error.message, { operation, ...metadata });

      throw error;
    }
  }

  /**
   * Registra navegação de tela
   */
  trackNavigation(screen, action = 'view') {
    this.increment(`navigation.${action}`);
    this.increment(`navigation.screen.${screen}`);

    this._emitMetric('navigation', {
      screen,
      action,
      timestamp: Date.now(),
      sessionDuration: Date.now() - this._startTime
    });
  }

  /**
   * Registra ação do usuário
   */
  trackAction(category, action, label = null, value = null) {
    this.increment(`actions.${category}.${action}`);

    this._emitMetric('action', {
      category,
      action,
      label,
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Registra erro
   */
  trackError(errorType, errorMessage, context = {}) {
    this.increment('errors.total');
    this.increment(`errors.${errorType}`);

    this._emitMetric('error', {
      type: errorType,
      message: errorMessage,
      context,
      timestamp: Date.now()
    });
  }

  /**
   * Registra uso de feature
   */
  trackFeature(feature, action = 'use') {
    this.increment(`features.${feature}.${action}`);
    this.increment(`features.${feature}.total`);

    this._emitMetric('feature', {
      feature,
      action,
      timestamp: Date.now()
    });
  }

  /**
   * Obtém todas as métricas
   */
  getMetrics() {
    const uptime = Date.now() - this._startTime;

    return {
      uptime,
      counters: Object.fromEntries(this._counters),
      activeTimers: Array.from(this._timers.keys()),
      historyLength: this._history.length,
      startTime: this._startTime
    };
  }

  /**
   * Obtém relatório completo
   */
  getReport() {
    const counters = Object.fromEntries(this._counters);
    const errorRate = counters['errors.total'] || 0;
    const operationsTotal = counters['operations.success'] || 0;

    return {
      summary: {
        uptime: Date.now() - this._startTime,
        uptimeFormatted: this._formatUptime(Date.now() - this._startTime),
        totalMetrics: this._history.length,
        errorRate:
          operationsTotal > 0
            ? ((errorRate / (operationsTotal + errorRate)) * 100).toFixed(2) + '%'
            : '0%'
      },
      counters,
      recentActivity: this._history.slice(-50)
    };
  }

  /**
   * Exporta métricas como JSON
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this._startTime,
      counters: Object.fromEntries(this._counters),
      history: this._history
    };
  }

  /**
   * Persiste métricas no localStorage
   */
  persist(storageKey = 'app-metrics') {
    try {
      const data = this.exportMetrics();
      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[Metrics] Failed to persist metrics:', error);
      return false;
    }
  }

  /**
   * Carrega métricas do localStorage
   */
  load(storageKey = 'app-metrics') {
    try {
      const data = localStorage.getItem(storageKey);
      if (!data) {
        return this;
      }

      const parsed = JSON.parse(data);

      if (parsed.counters) {
        Object.entries(parsed.counters).forEach(([key, value]) => {
          this._counters.set(key, value);
        });
      }

      if (parsed.history) {
        this._history = parsed.history.slice(-this._maxHistory);
      }

      return this;
    } catch (error) {
      console.error('[Metrics] Failed to load metrics:', error);
      return this;
    }
  }

  /**
   * Limpa todas as métricas
   */
  clear() {
    this._counters.clear();
    this._timers.clear();
    this._history = [];
    this._startTime = Date.now();
    return this;
  }

  /**
   * Configura listeners de eventos automáticos
   */
  _setupEventListeners() {
    // Track navigation automaticamente
    this._listeners.push(
      eventBus.on('app:navigation', (screen) => {
        this.trackNavigation(screen);
      })
    );

    // Track errors automaticamente
    this._listeners.push(
      eventBus.on('app:error', (error) => {
        this.trackError(error.name || 'unknown', error.message);
      })
    );

    // Track feature usage
    this._listeners.push(
      eventBus.on('app:feature', (feature, action) => {
        this.trackFeature(feature, action);
      })
    );
  }

  /**
   * Emite métrica para o event bus
   */
  _emitMetric(type, data) {
    const metric = {
      type,
      data,
      timestamp: Date.now()
    };

    // Adiciona ao histórico
    this._history.push(metric);
    if (this._history.length > this._maxHistory) {
      this._history = this._history.slice(-this._maxHistory);
    }

    // Emite para listeners
    eventBus.emit('metric', metric);
    eventBus.emit(`metric:${type}`, metric);
  }

  /**
   * Formata uptime para leitura humana
   */
  _formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Destrói e limpa recursos
   */
  destroy() {
    this._listeners.forEach((unsub) => unsub());
    this.clear();
  }
}

// Singleton instance
export const metrics = new MetricsManager();
