/**
 * AdvancedNotificationManager - Sistema avançado de notificações
 * Pattern: Builder com templates e prioridades
 */

import { eventBus } from '../core/EventEmitter.js';

export class NotificationManager {
  constructor() {
    this._container = null;
    this._notifications = [];
    this._maxVisible = 5;
    this._queue = [];
    this._isProcessing = false;
    this._defaultDuration = 4000;
    this._templates = new Map();
    this._soundEnabled = true;

    this._registerDefaultTemplates();
  }

  /**
   * Inicializa o container de notificações
   */
  init() {
    this._container = document.getElementById('toast-container');
    if (!this._container) {
      console.warn('[NotificationManager] Container #toast-container não encontrado');
    }
    return this;
  }

  /**
   * Mostra uma notificação de sucesso
   */
  success(message, options = {}) {
    return this.show({
      type: 'success',
      message,
      duration: options.duration || 3000,
      ...options,
    });
  }

  /**
   * Mostra uma notificação de erro
   */
  error(message, options = {}) {
    return this.show({
      type: 'error',
      message,
      duration: options.duration || 5000,
      ...options,
    });
  }

  /**
   * Mostra uma notificação de aviso
   */
  warning(message, options = {}) {
    return this.show({
      type: 'warning',
      message,
      duration: options.duration || 4000,
      ...options,
    });
  }

  /**
   * Mostra uma notificação de informação
   */
  info(message, options = {}) {
    return this.show({
      type: 'info',
      message,
      duration: options.duration || this._defaultDuration,
      ...options,
    });
  }

  /**
   * Mostra uma notificação customizada
   */
  show(options) {
    const notification = {
      id: this._generateId(),
      visible: false,
      ...this._parseOptions(options),
    };

    // Emit evento
    eventBus.emit('notification:show', notification);

    // Adiciona à fila
    this._queue.push(notification);
    this._processQueue();

    return notification.id;
  }

  /**
   * Remove uma notificação específica
   */
  dismiss(id) {
    const index = this._notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      this._removeNotification(index);
    }
  }

  /**
   * Remove todas as notificações
   */
  dismissAll() {
    [...this._notifications].forEach((_, index) => {
      this._removeNotification(index);
    });
    this._queue = [];
  }

  /**
   * Registra um template customizado
   */
  registerTemplate(name, templateFn) {
    this._templates.set(name, templateFn);
    return this;
  }

  /**
   * Usa um template customizado
   */
  useTemplate(name, data = {}) {
    const templateFn = this._templates.get(name);
    if (!templateFn) {
      throw new Error(`Template "${name}" não encontrado`);
    }

    const options = templateFn(data);
    return this.show(options);
  }

  /**
   * Mostra notificação de progresso
   */
  progress(message, progress, options = {}) {
    const id = options.id || this._generateId();
    const percentage = Math.min(100, Math.max(0, progress));

    const notification = {
      id,
      type: 'progress',
      message,
      progress: percentage,
      duration: Infinity,
      visible: true,
      ...options,
    };

    this._renderNotification(notification);
    eventBus.emit('notification:progress', { id, progress: percentage });

    if (percentage >= 100) {
      setTimeout(() => this.dismiss(id), 1000);
    }

    return id;
  }

  /**
   * Mostra notificação de ação com undo
   */
  action(message, actionFn, actionLabel = 'Desfazer', options = {}) {
    const id = this.show({
      type: 'info',
      message,
      duration: 6000,
      action: {
        fn: actionFn,
        label: actionLabel,
      },
      ...options,
    });

    return id;
  }

  /**
   * Configura som de notificações
   */
  setSound(enabled) {
    this._soundEnabled = enabled;
    return this;
  }

  /**
   * Obtém notificações ativas
   */
  getActive() {
    return this._notifications.filter((n) => n.visible);
  }

  /**
   * Obtém fila de espera
   */
  getQueue() {
    return [...this._queue];
  }

  /**
   * Processa a fila de notificações
   */
  _processQueue() {
    if (this._isProcessing) return;
    if (this._queue.length === 0) return;
    if (this._notifications.filter((n) => n.visible).length >= this._maxVisible) return;

    this._isProcessing = true;

    const notification = this._queue.shift();
    this._notifications.push(notification);

    this._renderNotification(notification);

    setTimeout(() => {
      this._isProcessing = false;
      this._processQueue();
    }, 100);
  }

  /**
   * Renderiza uma notificação no DOM
   */
  _renderNotification(notification) {
    if (!this._container) return;

    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.className = this._getNotificationClasses(notification.type);
    element.innerHTML = this._getNotificationHTML(notification);

    // Adiciona evento de clique no botão de fechar
    const closeBtn = element.querySelector('[data-dismiss]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.dismiss(notification.id);
      });
    }

    // Adiciona evento de ação
    const actionBtn = element.querySelector('[data-action]');
    if (actionBtn && notification.action) {
      actionBtn.addEventListener('click', () => {
        notification.action.fn();
        this.dismiss(notification.id);
      });
    }

    this._container.appendChild(element);
    notification.visible = true;

    // Animação de entrada
    requestAnimationFrame(() => {
      element.classList.add('show');
    });

    // Play sound
    if (this._soundEnabled) {
      this._playSound(notification.type);
    }

    // Auto-dismiss
    if (notification.duration !== Infinity) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Remove notificação do DOM
   */
  _removeNotification(index) {
    const notification = this._notifications[index];
    if (!notification) return;

    const element = document.getElementById(`notification-${notification.id}`);
    if (element) {
      element.classList.remove('show');
      element.classList.add('hide');

      setTimeout(() => {
        element.remove();
        eventBus.emit('notification:dismiss', notification.id);
      }, 300);
    }

    notification.visible = false;
    this._notifications.splice(index, 1);
  }

  /**
   * Obtém classes CSS para tipo de notificação
   */
  _getNotificationClasses(type) {
    const classes = {
      success: 'bg-emerald-600 border-emerald-500 text-white',
      error: 'bg-rose-600 border-rose-500 text-white',
      warning: 'bg-amber-500 border-amber-400 text-slate-900',
      info: 'bg-slate-800 border-slate-700 text-white',
      progress: 'bg-brand-600 border-brand-500 text-white',
    };

    return `toast-item flex items-center p-4 rounded-2xl shadow-2xl border w-full sm:w-auto ${classes[type] || classes.info}`;
  }

  /**
   * Obtém HTML interno da notificação
   */
  _getNotificationHTML(notification) {
    const icon = this._getNotificationIcon(notification.type);

    let progressBar = '';
    if (notification.type === 'progress') {
      progressBar = `
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div class="h-full bg-white transition-all duration-300" style="width: ${notification.progress}%"></div>
        </div>
      `;
    }

    let actionButton = '';
    if (notification.action) {
      actionButton = `
        <button data-action class="ml-3 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
          ${notification.action.label}
        </button>
      `;
    }

    return `
      ${icon}
      <span class="font-bold text-sm pr-6 leading-tight flex-1">${this._escapeHTML(notification.message)}</span>
      ${actionButton}
      <button data-dismiss aria-label="Fechar" class="ml-auto focus:outline-none bg-white/30 rounded-full p-1 hover:bg-white/40 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
      ${progressBar}
    `;
  }

  /**
   * Obtém ícone SVG para tipo de notificação
   */
  _getNotificationIcon(type) {
    const icons = {
      success:
        '<svg class="w-5 h-5 mr-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4 12 12-4-4"/></svg>',
      error:
        '<svg class="w-5 h-5 mr-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
      warning:
        '<svg class="w-5 h-5 mr-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
      info: '<svg class="w-5 h-5 mr-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
      progress:
        '<svg class="w-5 h-5 mr-3 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
    };

    return icons[type] || icons.info;
  }

  /**
   * Registra templates padrão
   */
  _registerDefaultTemplates() {
    // Template para operações em lote
    this.registerTemplate('batch-operation', (data) => ({
      type: 'success',
      message: `${data.count} ${data.item}(s) ${data.action}(s) com sucesso!`,
      duration: 4000,
    }));

    // Template para erros de rede
    this.registerTemplate('network-error', (data) => ({
      type: 'error',
      message: `Erro de conexão: ${data.message || 'Verifique sua internet'}`,
      duration: 6000,
    }));

    // Template para backup
    this.registerTemplate('backup-complete', (data) => ({
      type: 'success',
      message: `Backup concluído! ${data.total || 0} registros exportados.`,
      duration: 5000,
    }));

    // Template para sessão
    this.registerTemplate('session-expired', () => ({
      type: 'warning',
      message: 'Sessão expirada. Redirecionando para login...',
      duration: 3000,
    }));

    // Template para sincronização
    this.registerTemplate('sync-complete', (data) => ({
      type: 'info',
      message: `Dados sincronizados! ${data.count || 0} registros atualizados.`,
      duration: 3000,
    }));
  }

  /**
   * Toca som de notificação
   */
  _playSound(type) {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) return;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const sounds = {
        success: { frequency: 880, duration: 0.1, type: 'sine' },
        error: { frequency: 220, duration: 0.3, type: 'sawtooth' },
        warning: { frequency: 440, duration: 0.2, type: 'square' },
        info: { frequency: 660, duration: 0.15, type: 'sine' },
      };

      const sound = sounds[type] || sounds.info;
      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + sound.duration);
    } catch (error) {
      console.warn('[NotificationManager] Error playing sound:', error);
    }
  }

  /**
   * Parse e merge de opções
   */
  _parseOptions(options) {
    return {
      duration: this._defaultDuration,
      priority: 'normal',
      ...options,
    };
  }

  /**
   * Gera ID único
   */
  _generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Escape HTML para segurança
   */
  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Singleton instance
export const notifications = new NotificationManager();
