/**
 * ErrorHandler - Sistema centralizado de tratamento de erros
 * Pattern: Strategy com diferentes estratégias de recovery
 */

export class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = options.name || 'AppError';
    this.code = options.code || 'UNKNOWN_ERROR';
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational !== false;
    this.details = options.details || null;
    this.timestamp = new Date().toISOString();
    this.stack = options.stack || this.stack;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, {
      name: 'ValidationError',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Não autenticado') {
    super(message, {
      name: 'AuthenticationError',
      code: 'AUTH_ERROR',
      statusCode: 401
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, {
      name: 'AuthorizationError',
      code: 'FORBIDDEN',
      statusCode: 403
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, {
      name: 'NotFoundError',
      code: 'NOT_FOUND',
      statusCode: 404
    });
  }
}

export class TimeoutError extends AppError {
  constructor(operation = 'Operação', timeout = 8000) {
    super(`${operation} excedeu o tempo limite de ${timeout}ms`, {
      name: 'TimeoutError',
      code: 'TIMEOUT',
      statusCode: 408
    });
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Erro de rede') {
    super(message, {
      name: 'NetworkError',
      code: 'NETWORK_ERROR',
      statusCode: 503
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Erro no banco de dados', details = null) {
    super(message, {
      name: 'DatabaseError',
      code: 'DATABASE_ERROR',
      statusCode: 500,
      details
    });
  }
}

// Error Handler Singleton
export class ErrorHandler {
  constructor() {
    if (ErrorHandler._instance) {
      return ErrorHandler._instance;
    }

    this._handlers = new Map();
    this._errorHistory = [];
    this._maxHistory = 100;
    ErrorHandler._instance = this;
  }

  /**
   * Registra um handler para um tipo específico de erro
   */
  registerHandler(errorCode, handler) {
    this._handlers.set(errorCode, handler);
    return this;
  }

  /**
   * Trata um erro usando os handlers registrados
   */
  async handleError(error, context = {}) {
    const errorObj =
      error instanceof AppError
        ? error
        : new AppError(error?.message || 'Erro desconhecido', {
          code: error?.code || 'UNKNOWN_ERROR',
          details: error
        });

    // Adiciona ao histórico
    this._addToHistory(errorObj, context);

    // Log do erro
    this._logError(errorObj, context);

    // Tenta encontrar um handler específico
    const handler = this._handlers.get(errorObj.code) || this._handlers.get('DEFAULT');

    if (handler) {
      try {
        return await handler(errorObj, context);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }

    // Comportamento padrão
    return this._defaultErrorHandler(errorObj, context);
  }

  /**
   * Captura promessas e trata erros automaticamente
   */
  async capture(promise, context = {}) {
    try {
      return await promise;
    } catch (error) {
      await this.handleError(error, context);
      return null;
    }
  }

  /**
   * Cria um wrapper de função que captura erros automaticamente
   */
  wrap(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.handleError(error, { ...context, args });
        return null;
      }
    };
  }

  /**
   * Obtém histórico de erros
   */
  getHistory() {
    return [...this._errorHistory];
  }

  /**
   * Limpa o histórico de erros
   */
  clearHistory() {
    this._errorHistory = [];
    return this;
  }

  /**
   * Handlers padrão para tipos comuns de erros Firebase
   */
  registerFirebaseHandlers() {
    const handlers = {
      'permission-denied': (error, context) => {
        console.warn('Permission denied:', context);
        if (window.App?.UI) {
          window.App.UI.showToast('Permissão negada. Contate o administrador.', 'error');
        }
        return { handled: true, action: 'notify_permission' };
      },

      unauthenticated: (error, context) => {
        console.warn('User unauthenticated:', context);
        if (window.App?.Auth) {
          window.App.Auth.logout(true);
          if (window.App?.UI) {
            window.App.UI.showToast('Sessão expirada. Faça login novamente.', 'warning');
          }
        }
        return { handled: true, action: 'force_logout' };
      },

      unavailable: (error, context) => {
        console.warn('Service unavailable:', context);
        if (window.App?.UI) {
          window.App.UI.showToast(
            'Serviço temporariamente indisponível. Tentando novamente...',
            'warning'
          );
        }
        return { handled: true, action: 'retry' };
      },

      'not-found': (error, context) => {
        console.warn('Resource not found:', context);
        if (window.App?.UI) {
          window.App.UI.showToast('Recurso não encontrado.', 'warning');
        }
        return { handled: true, action: 'notify_not_found' };
      },

      DEFAULT: (error, context) => {
        console.error('Unhandled error:', error, context);
        if (window.App?.UI) {
          window.App.UI.showToast(error.message || 'Ocorreu um erro inesperado.', 'error');
        }
        return { handled: true, action: 'notify_generic' };
      }
    };

    Object.entries(handlers).forEach(([code, handler]) => {
      this.registerHandler(code, handler);
    });

    return this;
  }

  _addToHistory(error, context) {
    this._errorHistory.push({
      error: error.toJSON(),
      context: this._sanitizeContext(context),
      timestamp: new Date().toISOString()
    });

    if (this._errorHistory.length > this._maxHistory) {
      this._errorHistory = this._errorHistory.slice(-this._maxHistory);
    }
  }

  _logError(error, context) {
    const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
    const logFn = console[logLevel];

    logFn(`[${error.code}] ${error.message}`, {
      timestamp: error.timestamp,
      context: this._sanitizeContext(context),
      stack: error.stack
    });
  }

  _defaultErrorHandler(error, context) {
    console.error('Default error handler:', error, context);
    return { handled: true, action: 'default' };
  }

  _sanitizeContext(context) {
    const sanitized = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else if (value instanceof Error) {
        sanitized[key] = value.message;
      } else if (typeof value === 'object' && value !== null) {
        try {
          sanitized[key] = JSON.stringify(value);
        } catch {
          sanitized[key] = '[Unserializable]';
        }
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Inicializa handlers Firebase
errorHandler.registerFirebaseHandlers();
