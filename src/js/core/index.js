/**
 * Core Modules - Ponto central de importação
 * Todos os módulos core do sistema
 */

export { EventEmitter, eventBus } from './EventEmitter.js';
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  TimeoutError,
  NetworkError,
  DatabaseError,
  ErrorHandler,
  errorHandler
} from './ErrorHandler.js';
export { CacheManager, cacheManager } from './CacheManager.js';
export { Validator, validator } from './Validator.js';
export { MetricsManager, metrics } from './MetricsManager.js';
export { ServiceContainer, container } from './ServiceContainer.js';
