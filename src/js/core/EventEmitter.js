/**
 * EventEmitter - Sistema avançado de eventos
 * Pattern: Observer com suporte a wildcards e once
 */
export class EventEmitter {
  constructor() {
    this._events = new Map();
    this._maxListeners = 100;
  }

  on(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    if (!this._events.has(event)) {
      this._events.set(event, []);
    }

    const listeners = this._events.get(event);
    if (listeners.length >= this._maxListeners) {
      console.warn(
        `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${listeners.length} ${event} listeners added.`
      );
    }

    listeners.push(listener);
    return this;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };
    onceWrapper._original = listener;
    return this.on(event, onceWrapper);
  }

  off(event, listener) {
    if (!this._events.has(event)) return this;

    const listeners = this._events.get(event);

    if (!listener) {
      this._events.delete(event);
      return this;
    }

    const filtered = listeners.filter((l) => l !== listener && l._original !== listener);

    if (filtered.length === 0) {
      this._events.delete(event);
    } else {
      this._events.set(event, filtered);
    }

    return this;
  }

  emit(event, ...args) {
    if (!this._events.has(event)) return false;

    const listeners = this._events.get(event) || [];

    listeners.forEach((listener) => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });

    // Wildcard support - emit to all listeners
    if (event !== '*') {
      const allListeners = this._events.get('*') || [];
      allListeners.forEach((listener) => {
        try {
          listener(event, ...args);
        } catch (error) {
          console.error(`Error in wildcard listener:`, error);
        }
      });
    }

    return true;
  }

  removeAllListeners(event) {
    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
    return this;
  }

  listenerCount(event) {
    return this._events.has(event) ? this._events.get(event).length : 0;
  }

  setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0) {
      throw new RangeError('maxListeners must be a positive number');
    }
    this._maxListeners = n;
    return this;
  }
}

// Singleton instance
export const eventBus = new EventEmitter();
