/**
 * Validator - Sistema centralizado de validação de dados
 * Pattern: Validator com regras configuráveis
 */

export class ValidationError extends Error {
  constructor(field, message, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      field: this.field,
      message: this.message,
      value: this.value,
      timestamp: this.timestamp
    };
  }
}

export class Validator {
  constructor() {
    this._rules = new Map();
    this._customValidators = new Map();
  }

  /**
   * Registra um conjunto de regras
   */
  register(schemaName, rules) {
    this._rules.set(schemaName, rules);
    return this;
  }

  /**
   * Registra um validador customizado
   */
  registerValidator(name, fn) {
    this._customValidators.set(name, fn);
    return this;
  }

  /**
   * Valida dados contra um schema
   */
  validate(schemaName, data, options = {}) {
    const rules = this._rules.get(schemaName);

    if (!rules) {
      throw new Error(`Schema "${schemaName}" não registrado`);
    }

    const errors = [];
    const sanitized = { ...data };

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];

      try {
        const result = this._validateField(field, value, fieldRules, data);
        if (result.sanitized !== undefined) {
          sanitized[field] = result.sanitized;
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(error);

          if (options.stopOnFirstError) {
            break;
          }
        } else {
          throw error;
        }
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        data: sanitized
      };
    }

    return {
      valid: true,
      errors: [],
      data: sanitized
    };
  }

  /**
   * Valida um campo específico
   */
  _validateField(field, value, rules, allData) {
    const {
      required,
      type,
      min,
      max,
      minLength,
      maxLength,
      pattern,
      custom,
      validators,
      sanitize,
      defaultValue,
      oneOf,
      dependsOn
    } = rules;

    const result = { sanitized: value };

    // Verifica dependências
    if (dependsOn) {
      for (const [depField, expectedValue] of Object.entries(dependsOn)) {
        if (allData[depField] !== expectedValue) {
          return result; // Ignora validação se dependência não satisfeita
        }
      }
    }

    // Valor padrão
    if (value === undefined || value === null) {
      if (required === true) {
        throw new ValidationError(field, `${field} é obrigatório`, value);
      }
      if (defaultValue !== undefined) {
        return { sanitized: defaultValue };
      }
      return result;
    }

    // Tipo
    if (type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== type) {
        throw new ValidationError(
          field,
          `${field} deve ser do tipo ${type}, mas recebeu ${actualType}`,
          value
        );
      }
    }

    // Um de (enum)
    if (oneOf && !oneOf.includes(value)) {
      throw new ValidationError(
        field,
        `${field} deve ser um dos seguintes valores: ${oneOf.join(', ')}`,
        value
      );
    }

    // String validations
    if (typeof value === 'string') {
      if (minLength && value.length < minLength) {
        throw new ValidationError(
          field,
          `${field} deve ter no mínimo ${minLength} caracteres`,
          value
        );
      }

      if (maxLength && value.length > maxLength) {
        throw new ValidationError(
          field,
          `${field} deve ter no máximo ${maxLength} caracteres`,
          value
        );
      }

      if (pattern && !pattern.test(value)) {
        throw new ValidationError(field, `${field} está em formato inválido`, value);
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        throw new ValidationError(field, `${field} deve ser no mínimo ${min}`, value);
      }

      if (max !== undefined && value > max) {
        throw new ValidationError(field, `${field} deve ser no máximo ${max}`, value);
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (minLength && value.length < minLength) {
        throw new ValidationError(field, `${field} deve ter no mínimo ${minLength} itens`, value);
      }

      if (maxLength && value.length > maxLength) {
        throw new ValidationError(field, `${field} deve ter no máximo ${maxLength} itens`, value);
      }
    }

    // Validadores customizados
    if (custom && typeof custom === 'function') {
      const customResult = custom(value, allData);
      if (customResult === false) {
        throw new ValidationError(field, `${field} é inválido`, value);
      }
      if (typeof customResult === 'string') {
        throw new ValidationError(field, customResult, value);
      }
    }

    // Array de validadores
    if (validators && Array.isArray(validators)) {
      for (const validatorName of validators) {
        const validatorFn = this._customValidators.get(validatorName);
        if (validatorFn) {
          const validatorResult = validatorFn(value, allData);
          if (validatorResult === false) {
            throw new ValidationError(field, `${field} falhou na validação`, value);
          }
          if (typeof validatorResult === 'string') {
            throw new ValidationError(field, validatorResult, value);
          }
        }
      }
    }

    // Sanitização
    if (sanitize && typeof sanitize === 'function') {
      result.sanitized = sanitize(value);
    }

    return result;
  }

  /**
   * Cria schemas predefinidos para o sistema
   */
  registerDefaultSchemas() {
    // Schema de usuário
    this.register('user', {
      name: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 100,
        sanitize: (v) => v.trim()
      },
      email: {
        required: true,
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        sanitize: (v) => v.toLowerCase().trim()
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 128
      },
      accessLevel: {
        type: 'string',
        oneOf: ['Administrador', 'Operador', 'Visualizador'],
        defaultValue: 'Operador'
      },
      badge: {
        type: 'string',
        maxLength: 50,
        sanitize: (v) => v?.toUpperCase().trim()
      },
      role: {
        type: 'string',
        maxLength: 100,
        sanitize: (v) => v?.trim()
      },
      department: {
        type: 'string',
        maxLength: 100,
        sanitize: (v) => v?.trim()
      },
      phone: {
        type: 'string',
        pattern: /^\+?[\d\s\-()]+$/,
        sanitize: (v) => v?.trim()
      },
      active: {
        type: 'boolean',
        defaultValue: true
      },
      avatar: {
        type: 'string',
        maxLength: 2048
      }
    });

    // Schema de ferramenta
    this.register('tool', {
      code: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 50,
        sanitize: (v) => v.toUpperCase().trim()
      },
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 200,
        sanitize: (v) => v.trim()
      },
      category: {
        required: true,
        type: 'string',
        maxLength: 100,
        sanitize: (v) => v.trim()
      },
      status: {
        type: 'string',
        oneOf: ['available', 'borrowed', 'maintenance'],
        defaultValue: 'available'
      },
      description: {
        type: 'string',
        maxLength: 1000,
        sanitize: (v) => v?.trim()
      },
      brand: {
        type: 'string',
        maxLength: 100,
        sanitize: (v) => v?.trim()
      },
      model: {
        type: 'string',
        maxLength: 100,
        sanitize: (v) => v?.trim()
      },
      serialNumber: {
        type: 'string',
        maxLength: 100,
        sanitize: (v) => v?.trim()
      },
      purchaseDate: {
        type: 'string',
        pattern: /^\d{4}-\d{2}-\d{2}$/
      },
      price: {
        type: 'number',
        min: 0
      },
      currentUser: {
        type: 'string',
        maxLength: 100,
        sanitize: (v) => v?.trim()
      },
      imageUrl: {
        type: 'string',
        maxLength: 2048
      },
      notes: {
        type: 'string',
        maxLength: 500,
        sanitize: (v) => v?.trim()
      }
    });

    // Schema de colaborador
    this.register('collaborator', {
      name: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 200,
        sanitize: (v) => v.trim()
      },
      badge: {
        required: true,
        type: 'string',
        maxLength: 50,
        sanitize: (v) => v.toUpperCase().trim()
      },
      role: {
        type: 'string',
        maxLength: 100,
        sanitize: (v) => v?.trim()
      },
      department: {
        type: 'string',
        maxLength: 100,
        sanitize: (v) => v?.trim()
      },
      phone: {
        type: 'string',
        pattern: /^\+?[\d\s\-()]+$/,
        sanitize: (v) => v?.trim()
      },
      email: {
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        sanitize: (v) => v.toLowerCase().trim()
      },
      active: {
        type: 'boolean',
        defaultValue: true
      }
    });

    // Schema de histórico
    this.register('history', {
      toolCode: {
        required: true,
        type: 'string',
        maxLength: 50
      },
      toolName: {
        required: true,
        type: 'string',
        maxLength: 200
      },
      type: {
        required: true,
        type: 'string',
        oneOf: ['in', 'out', 'maintenance', 'return']
      },
      user: {
        required: true,
        type: 'string',
        maxLength: 100
      },
      ip: {
        type: 'string',
        maxLength: 50
      },
      device: {
        type: 'string',
        maxLength: 200
      },
      notes: {
        type: 'string',
        maxLength: 500,
        sanitize: (v) => v?.trim()
      }
    });

    return this;
  }
}

// Singleton instance
export const validator = new Validator();

// Registra schemas padrão
validator.registerDefaultSchemas();
