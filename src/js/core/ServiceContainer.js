/**
 * ServiceContainer - Injeção de dependência e gerenciamento de serviços
 * Pattern: Service Locator com injeção automática
 */

export class ServiceContainer {
  constructor() {
    this._services = new Map();
    this._singletons = new Map();
    this._factories = new Map();
    this._aliases = new Map();
  }

  /**
   * Registra um serviço como singleton
   */
  singleton(name, instance, options = {}) {
    this._singletons.set(name, {
      instance,
      lazy: options.lazy === true,
      dependencies: options.dependencies || [],
    });

    return this;
  }

  /**
   * Registra um serviço como factory (cria nova instância a cada chamada)
   */
  factory(name, factoryFn, options = {}) {
    this._factories.set(name, {
      factory: factoryFn,
      dependencies: options.dependencies || [],
    });

    return this;
  }

  /**
   * Registra uma instância direta
   */
  register(name, instance) {
    this._services.set(name, instance);
    return this;
  }

  /**
   * Cria um alias para um serviço
   */
  alias(name, aliasName) {
    this._aliases.set(aliasName, name);
    return this;
  }

  /**
   * Obtém um serviço (resolve dependências automaticamente)
   */
  async get(name) {
    // Resolve alias
    const resolvedName = this._aliases.get(name) || name;

    // Verifica se é singleton
    if (this._singletons.has(resolvedName)) {
      return this._singletons.get(resolvedName).instance;
    }

    // Verifica se é factory
    if (this._factories.has(resolvedName)) {
      const { factory, dependencies } = this._factories.get(resolvedName);

      // Resolve dependências
      const resolvedDeps = await Promise.all(dependencies.map((dep) => this.get(dep)));

      return factory(...resolvedDeps);
    }

    // Verifica se é serviço direto
    if (this._services.has(resolvedName)) {
      return this._services.get(resolvedName);
    }

    throw new Error(`Serviço "${name}" não registrado`);
  }

  /**
   * Verifica se um serviço existe
   */
  has(name) {
    const resolvedName = this._aliases.get(name) || name;
    return (
      this._singletons.has(resolvedName) ||
      this._factories.has(resolvedName) ||
      this._services.has(resolvedName)
    );
  }

  /**
   * Remove um serviço
   */
  remove(name) {
    const resolvedName = this._aliases.get(name) || name;
    this._singletons.delete(resolvedName);
    this._factories.delete(resolvedName);
    this._services.delete(resolvedName);
    this._aliases.delete(name);
    return this;
  }

  /**
   * Lista todos os serviços registrados
   */
  list() {
    const services = [];

    this._singletons.forEach((_, name) => {
      services.push({ name, type: 'singleton' });
    });

    this._factories.forEach((_, name) => {
      services.push({ name, type: 'factory' });
    });

    this._services.forEach((_, name) => {
      services.push({ name, type: 'service' });
    });

    return services;
  }

  /**
   * Limpa todos os serviços
   */
  clear() {
    this._singletons.clear();
    this._factories.clear();
    this._services.clear();
    this._aliases.clear();
    return this;
  }

  /**
   * Inicializa todos os serviços lazy
   */
  async initializeAll() {
    const promises = [];

    for (const [name, config] of this._singletons.entries()) {
      if (config.lazy) {
        promises.push(this.get(name));
      }
    }

    await Promise.all(promises);
    return this;
  }
}

// Singleton instance
export const container = new ServiceContainer();
