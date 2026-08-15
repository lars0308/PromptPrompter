/**
 * JSDoc Type Definitions & Interfaces
 *
 * Central location for all custom types and interfaces used throughout the application.
 * These are used to provide IDE hints and type safety without TypeScript.
 *
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} email - User email address
 * @property {string} name - User full name
 * @property {'free'|'pro'|'ultimate'} plan - Subscription plan
 * @property {boolean} isAdmin - Whether user is admin
 * @property {number} quota - Remaining API quota
 * @property {Date} createdAt - Account creation date
 * @property {Date} lastLoginAt - Last login timestamp
 *
 * @typedef {Object} Project
 * @property {string} id - Unique project identifier
 * @property {string} userId - Owner user ID
 * @property {string} title - Project title
 * @property {string} description - Project description
 * @property {'guided'|'auto'|'expert'} mode - Project mode
 * @property {string} status - Project status: draft, active, completed
 * @property {Object} config - Project configuration
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 *
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether request was successful
 * @property {*} data - Response data
 * @property {string} [error] - Error message if unsuccessful
 * @property {number} [timestamp] - Server timestamp
 *
 * @typedef {Object} ValidationError
 * @property {string} field - Field name
 * @property {string} message - Error message
 * @property {string} [code] - Error code
 *
 * @typedef {Object} RateLimitInfo
 * @property {number} limit - Rate limit per period
 * @property {number} remaining - Remaining requests
 * @property {number} resetAt - Unix timestamp when limit resets
 */

/**
 * Utility type definitions for common patterns
 *
 * @typedef {null|undefined|*} Optional
 * @typedef {Promise<*>} Thenable
 * @typedef {function(*): void} Callback
 * @typedef {function(*): Promise<void>} AsyncCallback
 */

// Export empty object to make this a module
export const TypeDefs = {};

/**
 * Common JSDoc patterns for API functions
 *
 * Pattern 1: Simple Function
 * @param {string} name - Parameter description
 * @returns {string} Return description
 * @throws {Error} When something goes wrong
 *
 * Pattern 2: Async Function
 * @async
 * @param {number} id - Parameter description
 * @returns {Promise<User>} User object
 * @throws {Error} When user not found
 *
 * Pattern 3: Function with Multiple Return Types
 * @param {string} format - 'json'|'csv'
 * @returns {(Object|string)} Data in requested format
 *
 * Pattern 4: Callback Function
 * @param {Callback} callback - Function to call with result
 * @param {*} context - this context for callback
 * @returns {void}
 *
 * Pattern 5: Class Constructor
 * @class UserManager
 * @param {Object} options - Configuration options
 * @param {string} options.apiUrl - API base URL
 * @param {number} options.timeout - Request timeout in ms
 *
 * Pattern 6: Generic/Array Types
 * @param {Array<string>} tags - List of tags
 * @returns {Array<Object>} Array of results
 *
 * Pattern 7: Union Types
 * @param {(string|number|boolean)} value - Any of these types
 * @returns {Object|null} Result or null
 *
 * Pattern 8: Deprecated Function
 * @deprecated Use newFunction instead
 * @param {string} value - Parameter
 * @returns {void}
 *
 * Pattern 9: Optional Parameters
 * @param {string} name - Required parameter
 * @param {string} [nickname] - Optional parameter
 * @param {number} [age=0] - Optional with default
 * @returns {void}
 *
 * Pattern 10: Example Usage
 * @example
 * const result = await fetchUser(123);
 * console.log(result.name);
 *
 * @param {number} id - User ID
 * @returns {Promise<User>} User object
 */

/**
 * Best practices for JSDoc in this codebase:
 *
 * 1. ALWAYS document public functions with @param and @returns
 * 2. Include @throws for functions that can throw errors
 * 3. Use @async for async functions
 * 4. Use @deprecated for removed/old functions
 * 5. Add @example for complex functions
 * 6. Use custom @typedef for complex types
 * 7. Document class methods with proper context
 * 8. Use meaningful parameter names (no single letters for complex types)
 * 9. Include default values in @param comments
 * 10. Link to related functions with {@link functionName}
 *
 * Tools for validation:
 * - IDE IntelliSense (VS Code, WebStorm)
 * - JSDoc linter (eslint-plugin-jsdoc)
 * - Type checker (TypeScript language server in VSCode)
 *
 * Examples:
 */

/**
 * @example
 * // Good: Clear, well-documented
 * /**
 *  * Fetches user by ID from API
 *  *
 *  * @async
 *  * @param {number} userId - User ID to fetch
 *  * @param {Object} [options] - Optional configuration
 *  * @param {number} [options.timeout=5000] - Request timeout in ms
 *  * @param {boolean} [options.cache=true] - Use cached result if available
 *  * @returns {Promise<User>} User object
 *  * @throws {Error} When user not found (404)
 *  * @throws {Error} When API call fails
 *  *
 *  * @example
 *  * const user = await fetchUser(123);
 *  * const user = await fetchUser(123, { timeout: 10000 });
 *  *\/
 * async function fetchUser(userId, options = {}) { ... }
 */

/**
 * @example
 * // Bad: Unclear, no documentation
 * async function f(id, o) { ... } // What is o? What does it return?
 */

/**
 * Common Error Types for JSDoc
 *
 * @typedef {Object} TypeError
 * @property {string} message - "Expected X, got Y"
 *
 * @typedef {Object} ValidationError
 * @property {string} message - "Field X is required"
 *
 * @typedef {Object} NotFoundError
 * @property {string} message - "Resource not found"
 *
 * @typedef {Object} TimeoutError
 * @property {string} message - "Request timeout"
 */

/**
 * HTTP Status Codes used in this application
 *
 * 2xx - Success
 *   200 - OK
 *   201 - Created
 *   204 - No Content
 *
 * 3xx - Redirect
 *   301 - Moved Permanently
 *   302 - Found
 *   304 - Not Modified
 *
 * 4xx - Client Error
 *   400 - Bad Request
 *   401 - Unauthorized
 *   403 - Forbidden
 *   404 - Not Found
 *   429 - Too Many Requests
 *
 * 5xx - Server Error
 *   500 - Internal Server Error
 *   502 - Bad Gateway
 *   503 - Service Unavailable
 */
