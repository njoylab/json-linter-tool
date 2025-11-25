/**
 * jq-lite: A lightweight JavaScript implementation of common jq operations
 * Supports basic jq syntax for JSON querying and transformation
 */

class JQLite {
  constructor() {
    this.data = null;
  }

  /**
   * Apply a jq query to JSON data
   * @param {string|object} jsonInput - JSON string or object
   * @param {string} query - jq query string
   * @returns {object} - { success: boolean, result?: any, error?: string }
   */
  apply(jsonInput, query) {
    try {
      // Parse input if it's a string (but allow primitive types like numbers, booleans)
      if (typeof jsonInput === 'string') {
        try {
          this.data = JSON.parse(jsonInput);
        } catch (e) {
          // If parse fails, treat as string literal
          this.data = jsonInput;
        }
      } else {
        this.data = jsonInput;
      }

      // Clean and validate query
      query = query.trim();
      if (!query) {
        return { success: false, error: 'Query cannot be empty' };
      }

      // Execute the query
      const result = this.executeQuery(query);

      return {
        success: true,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a jq query
   * @param {string} query - jq query string
   * @returns {any} - Query result
   */
  executeQuery(query) {
    // Handle pipe operations: split by | and execute in sequence
    if (query.includes('|') && !this.isInsideString(query, query.indexOf('|'))) {
      const parts = this.splitByPipe(query);
      let result = this.data;

      for (const part of parts) {
        const partQuery = part.trim();

        // Special handling for .[] - it should unwrap arrays for next operation
        if (partQuery === '.[]') {
          if (!Array.isArray(result)) {
            throw new Error('Cannot iterate over non-array');
          }
          // Don't set result yet, continue processing with array items
          const remaining = parts.slice(parts.indexOf(part) + 1);
          if (remaining.length > 0) {
            // Apply remaining operations to each item
            const mappedResults = result.map(item => {
              const subQuery = new JQLite();
              return subQuery.apply(item, remaining.join(' | ').trim()).result;
            }).filter(item => item !== null && item !== undefined);
            return mappedResults;
          } else {
            // No more operations, return array as-is
            return result;
          }
        }

        this.data = result;
        result = this.executeQuery(partQuery);
      }

      return result;
    }

    // Identity: .
    if (query === '.') {
      return this.data;
    }

    // Array iterator: .[]
    if (query === '.[]') {
      if (!Array.isArray(this.data)) {
        throw new Error('Cannot iterate over non-array');
      }
      return this.data;
    }

    // Array index: .[n]
    const arrayIndexMatch = query.match(/^\.\[(\d+)\]$/);
    if (arrayIndexMatch) {
      const index = parseInt(arrayIndexMatch[1]);
      if (!Array.isArray(this.data)) {
        throw new Error('Cannot index non-array');
      }
      return this.data[index];
    }

    // Array slice: .[n:m]
    const sliceMatch = query.match(/^\.\[(\d*):(\d*)\]$/);
    if (sliceMatch) {
      if (!Array.isArray(this.data)) {
        throw new Error('Cannot slice non-array');
      }
      const start = sliceMatch[1] ? parseInt(sliceMatch[1]) : 0;
      const end = sliceMatch[2] ? parseInt(sliceMatch[2]) : this.data.length;
      return this.data.slice(start, end);
    }

    // Property access: .key or .key.subkey
    if (query.startsWith('.') && !query.includes('[') && !query.includes('(')) {
      return this.getProperty(this.data, query.substring(1));
    }

    // Array iterator with property: .[].key
    if (query.startsWith('.[]') && query.length > 3) {
      if (!Array.isArray(this.data)) {
        throw new Error('Cannot iterate over non-array');
      }
      const propertyPath = query.substring(4); // Remove .[] and following dot
      return this.data.map(item => this.getProperty(item, propertyPath));
    }

    // keys function
    if (query === 'keys') {
      if (Array.isArray(this.data)) {
        return Array.from({ length: this.data.length }, (_, i) => i);
      }
      if (typeof this.data === 'object' && this.data !== null) {
        return Object.keys(this.data).sort();
      }
      throw new Error('keys only works on objects and arrays');
    }

    // values function
    if (query === 'values') {
      if (Array.isArray(this.data)) {
        return this.data;
      }
      if (typeof this.data === 'object' && this.data !== null) {
        return Object.values(this.data);
      }
      throw new Error('values only works on objects and arrays');
    }

    // length function
    if (query === 'length') {
      if (Array.isArray(this.data) || typeof this.data === 'string') {
        return this.data.length;
      }
      if (typeof this.data === 'object' && this.data !== null) {
        return Object.keys(this.data).length;
      }
      return null;
    }

    // type function
    if (query === 'type') {
      if (this.data === null) return 'null';
      if (Array.isArray(this.data)) return 'array';
      return typeof this.data;
    }

    // select function: select(.key == value) or select(. > value)
    const selectMatch = query.match(/^select\((.*)\)$/);
    if (selectMatch) {
      return this.executeSelect(selectMatch[1]);
    }

    // map function: map(.key) or map(expression)
    const mapMatch = query.match(/^map\((.*)\)$/);
    if (mapMatch) {
      if (!Array.isArray(this.data)) {
        throw new Error('map only works on arrays');
      }
      const expression = mapMatch[1];
      return this.data.map(item => {
        const subQuery = new JQLite();
        return subQuery.apply(item, expression).result;
      });
    }

    // sort function
    if (query === 'sort') {
      if (!Array.isArray(this.data)) {
        throw new Error('sort only works on arrays');
      }
      return [...this.data].sort();
    }

    // sort_by function: sort_by(.key)
    const sortByMatch = query.match(/^sort_by\((.*)\)$/);
    if (sortByMatch) {
      if (!Array.isArray(this.data)) {
        throw new Error('sort_by only works on arrays');
      }
      const keyPath = sortByMatch[1].startsWith('.') ? sortByMatch[1].substring(1) : sortByMatch[1];
      return [...this.data].sort((a, b) => {
        const aVal = this.getProperty(a, keyPath);
        const bVal = this.getProperty(b, keyPath);
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
        return 0;
      });
    }

    // reverse function
    if (query === 'reverse') {
      if (!Array.isArray(this.data)) {
        throw new Error('reverse only works on arrays');
      }
      return [...this.data].reverse();
    }

    // unique function
    if (query === 'unique') {
      if (!Array.isArray(this.data)) {
        throw new Error('unique only works on arrays');
      }
      return [...new Set(this.data)];
    }

    // first and last
    if (query === 'first') {
      if (!Array.isArray(this.data)) {
        throw new Error('first only works on arrays');
      }
      return this.data[0];
    }

    if (query === 'last') {
      if (!Array.isArray(this.data)) {
        throw new Error('last only works on arrays');
      }
      return this.data[this.data.length - 1];
    }

    // min and max
    if (query === 'min') {
      if (!Array.isArray(this.data)) {
        throw new Error('min only works on arrays');
      }
      return Math.min(...this.data);
    }

    if (query === 'max') {
      if (!Array.isArray(this.data)) {
        throw new Error('max only works on arrays');
      }
      return Math.max(...this.data);
    }

    throw new Error(`Unsupported query: ${query}`);
  }

  /**
   * Execute select expression
   * @param {string} condition - Condition string
   * @returns {any} - Filtered result
   */
  executeSelect(condition) {
    if (!Array.isArray(this.data)) {
      // Single item: evaluate condition
      return this.evaluateCondition(this.data, condition) ? this.data : null;
    }

    // Array: filter items
    return this.data.filter(item => this.evaluateCondition(item, condition));
  }

  /**
   * Evaluate a condition
   * @param {any} item - Data item
   * @param {string} condition - Condition string (e.g., ".age > 18" or ". == true")
   * @returns {boolean} - Condition result
   */
  evaluateCondition(item, condition) {
    // Handle comparison operators
    const operators = ['==', '!=', '>=', '<=', '>', '<'];

    for (const op of operators) {
      if (condition.includes(op)) {
        const [left, right] = condition.split(op).map(s => s.trim());
        const leftValue = this.resolveValue(item, left);
        const rightValue = this.resolveValue(item, right);

        switch (op) {
          case '==': return leftValue === rightValue;
          case '!=': return leftValue !== rightValue;
          case '>': return leftValue > rightValue;
          case '<': return leftValue < rightValue;
          case '>=': return leftValue >= rightValue;
          case '<=': return leftValue <= rightValue;
        }
      }
    }

    // No operator: just evaluate the expression as truthy
    return Boolean(this.resolveValue(item, condition));
  }

  /**
   * Resolve a value from an expression
   * @param {any} item - Data item
   * @param {string} expr - Expression string
   * @returns {any} - Resolved value
   */
  resolveValue(item, expr) {
    expr = expr.trim();

    // String literal
    if ((expr.startsWith('"') && expr.endsWith('"')) ||
        (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    // Number literal
    if (!isNaN(expr) && expr !== '') {
      return parseFloat(expr);
    }

    // Boolean literal
    if (expr === 'true') return true;
    if (expr === 'false') return false;

    // Null literal
    if (expr === 'null') return null;

    // Current item reference
    if (expr === '.') {
      return item;
    }

    // Property access
    if (expr.startsWith('.')) {
      return this.getProperty(item, expr.substring(1));
    }

    return expr;
  }

  /**
   * Get nested property from object
   * @param {object} obj - Object to query
   * @param {string} path - Property path (e.g., "user.name")
   * @returns {any} - Property value
   */
  getProperty(obj, path) {
    if (!path) return obj;

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Split query by pipe, respecting strings
   * @param {string} query - Query string
   * @returns {string[]} - Query parts
   */
  splitByPipe(query) {
    const parts = [];
    let current = '';
    let inString = false;
    let stringChar = null;

    for (let i = 0; i < query.length; i++) {
      const char = query[i];

      if ((char === '"' || char === "'") && (i === 0 || query[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
      }

      if (char === '|' && !inString) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  /**
   * Check if a position is inside a string
   * @param {string} str - String to check
   * @param {number} pos - Position to check
   * @returns {boolean} - True if inside string
   */
  isInsideString(str, pos) {
    let inString = false;
    let stringChar = null;

    for (let i = 0; i < pos; i++) {
      const char = str[i];
      if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
      }
    }

    return inString;
  }

  /**
   * Get list of supported operations
   * @returns {object[]} - List of examples
   */
  static getExamples() {
    return [
      { query: '.', description: 'Identity (return as-is)' },
      { query: '.key', description: 'Access property' },
      { query: '.[]', description: 'Array iterator' },
      { query: '.[0]', description: 'Array index' },
      { query: '.[1:3]', description: 'Array slice' },
      { query: '.[] | .name', description: 'Map property' },
      { query: 'keys', description: 'Get object keys' },
      { query: 'values', description: 'Get object values' },
      { query: 'length', description: 'Get length' },
      { query: 'type', description: 'Get type' },
      { query: 'select(.age > 18)', description: 'Filter by condition' },
      { query: 'map(.name)', description: 'Map transformation' },
      { query: 'sort', description: 'Sort array' },
      { query: 'sort_by(.name)', description: 'Sort by property' },
      { query: 'reverse', description: 'Reverse array' },
      { query: 'unique', description: 'Unique values' },
      { query: 'first', description: 'First element' },
      { query: 'last', description: 'Last element' },
      { query: 'min', description: 'Minimum value' },
      { query: 'max', description: 'Maximum value' }
    ];
  }
}

// Export for Node.js (tests) and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JQLite;
}
