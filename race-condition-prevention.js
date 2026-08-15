/**
 * Race Condition Prevention Utilities
 *
 * Prevents common race conditions in concurrent operations:
 * - Request deduplication
 * - Optimistic locking
 * - Sequential operation queuing
 * - State mutation protection
 *
 * Usage:
 *   const locker = new OperationLock('update-user-1');
 *   await locker.acquire(() => updateUserData());
 */

/**
 * Simple mutual exclusion lock
 */
export class OperationLock {
  constructor(key) {
    this.key = key;
    this.locked = false;
    this.queue = [];
  }

  /**
   * Acquire lock and execute function
   * @param {Function} fn - Function to execute with lock
   * @param {number} timeout - Lock timeout in ms
   * @returns {Promise<*>} - Function result
   */
  async acquire(fn, timeout = 30000) {
    // If locked, queue the operation
    if (this.locked) {
      return new Promise((resolve, reject) => {
        this.queue.push({ fn, resolve, reject, timeout });
      });
    }

    this.locked = true;
    const timeoutHandle = setTimeout(() => {
      this.locked = false;
      this.processQueue();
    }, timeout);

    try {
      const result = await fn();
      clearTimeout(timeoutHandle);
      this.locked = false;
      this.processQueue();
      return result;
    } catch (error) {
      clearTimeout(timeoutHandle);
      this.locked = false;
      this.processQueue();
      throw error;
    }
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const { fn, resolve, reject, timeout } = this.queue.shift();
    this.acquire(fn, timeout).then(resolve).catch(reject);
  }

  /**
   * Check if currently locked
   */
  isLocked() {
    return this.locked;
  }

  /**
   * Force unlock (use with caution)
   */
  forceUnlock() {
    this.locked = false;
    this.processQueue();
  }
}

/**
 * Global lock manager - maintains locks by key
 */
class LockManager {
  constructor() {
    this.locks = new Map();
  }

  /**
   * Get or create lock for key
   */
  getLock(key) {
    if (!this.locks.has(key)) {
      this.locks.set(key, new OperationLock(key));
    }
    return this.locks.get(key);
  }

  /**
   * Execute function with lock for key
   */
  async withLock(key, fn, timeout = 30000) {
    const lock = this.getLock(key);
    return lock.acquire(fn, timeout);
  }

  /**
   * Check if key is locked
   */
  isLocked(key) {
    const lock = this.locks.get(key);
    return lock ? lock.isLocked() : false;
  }

  /**
   * Clear all locks
   */
  clearAll() {
    this.locks.forEach((lock) => lock.forceUnlock());
    this.locks.clear();
  }
}

export const lockManager = new LockManager();

/**
 * Request deduplication - prevents duplicate requests
 */
export class RequestDeduplicator {
  constructor() {
    this.pending = new Map();
  }

  /**
   * Execute request, deduplicate identical concurrent requests
   * @param {string} key - Unique request key
   * @param {Function} fn - Request function
   * @returns {Promise<*>} - Request result
   */
  async deduplicate(key, fn) {
    // If request already pending, return existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Create new request promise
    const promise = fn()
      .then((result) => {
        this.pending.delete(key);
        return result;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    // Store promise while pending
    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Clear deduplicator
   */
  clear() {
    this.pending.clear();
  }

  /**
   * Get number of pending requests
   */
  getPendingCount() {
    return this.pending.size;
  }
}

/**
 * Operation queue - ensures sequential execution
 */
export class OperationQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Enqueue operation
   * @param {Function} fn - Async function to execute
   * @returns {Promise<*>} - Operation result
   */
  async enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      this.process(); // Process next in queue
    }
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length + (this.processing ? 1 : 0);
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
  }
}

/**
 * Optimistic locking for state mutations
 */
export class OptimisticLock {
  constructor(initialValue = null) {
    this.value = initialValue;
    this.version = 0;
  }

  /**
   * Read current value
   */
  read() {
    return { value: this.value, version: this.version };
  }

  /**
   * Update value atomically
   * @param {Function} updateFn - Function that returns new value
   * @returns {object} - { success, value, version }
   */
  update(updateFn) {
    const newValue = updateFn(this.value);
    this.value = newValue;
    this.version++;

    return {
      success: true,
      value: this.value,
      version: this.version,
    };
  }

  /**
   * Compare-and-swap update
   * @param {number} expectedVersion - Expected version before update
   * @param {*} newValue - New value to set
   * @returns {object} - { success, value, version }
   */
  compareAndSwap(expectedVersion, newValue) {
    if (this.version !== expectedVersion) {
      return {
        success: false,
        value: this.value,
        version: this.version,
      };
    }

    this.value = newValue;
    this.version++;

    return {
      success: true,
      value: this.value,
      version: this.version,
    };
  }
}

/**
 * Prevent concurrent state mutations
 */
export class StateGuard {
  constructor(initialState = {}) {
    this.state = initialState;
    this.lock = new OperationLock('state-guard');
  }

  /**
   * Read current state
   */
  read() {
    return { ...this.state };
  }

  /**
   * Update state with lock
   * @param {Function} updateFn - Function that modifies state
   * @returns {Promise<object>} - Updated state
   */
  async update(updateFn) {
    return this.lock.acquire(async () => {
      updateFn(this.state);
      return { ...this.state };
    });
  }

  /**
   * Reset state
   */
  reset(initialState = {}) {
    this.state = initialState;
  }
}

/**
 * Abort controller wrapper for cancellable operations
 */
export class CancellableOperation {
  constructor() {
    this.controller = new AbortController();
    this.promise = null;
  }

  /**
   * Execute operation
   * @param {Function} fn - Function that receives signal
   * @returns {Promise<*>} - Operation result
   */
  async execute(fn) {
    this.promise = fn(this.controller.signal);
    return this.promise;
  }

  /**
   * Cancel operation
   */
  cancel() {
    this.controller.abort();
  }

  /**
   * Check if cancelled
   */
  isCancelled() {
    return this.controller.signal.aborted;
  }
}

/**
 * Batch operations to prevent race conditions
 */
export class OperationBatcher {
  constructor(batchFn, batchSize = 10, batchDelay = 100) {
    this.batchFn = batchFn;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
    this.batch = [];
    this.timeoutHandle = null;
  }

  /**
   * Add operation to batch
   * @param {*} item - Item to batch
   * @returns {Promise<*>} - Operation result
   */
  async add(item) {
    return new Promise((resolve, reject) => {
      this.batch.push({ item, resolve, reject });

      // Execute immediately if batch is full
      if (this.batch.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeoutHandle) {
        // Schedule flush after delay
        this.timeoutHandle = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  /**
   * Flush batch immediately
   */
  async flush() {
    if (this.batch.length === 0) return;

    clearTimeout(this.timeoutHandle);
    this.timeoutHandle = null;

    const currentBatch = this.batch;
    this.batch = [];

    try {
      const results = await this.batchFn(currentBatch.map((b) => b.item));

      currentBatch.forEach((b, index) => {
        b.resolve(results[index]);
      });
    } catch (error) {
      currentBatch.forEach((b) => b.reject(error));
    }
  }

  /**
   * Get current batch size
   */
  size() {
    return this.batch.length;
  }
}

// Export lock manager as singleton
export default {
  lockManager,
  OperationLock,
  RequestDeduplicator,
  OperationQueue,
  OptimisticLock,
  StateGuard,
  CancellableOperation,
  OperationBatcher,
};
