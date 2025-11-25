/**
 * Tests for JQLite - Lightweight jq implementation
 */

const JQLite = require('../jq-lite.js');

describe('JQLite', () => {
  let jq;

  beforeEach(() => {
    jq = new JQLite();
  });

  describe('Basic operations', () => {
    test('identity operator returns input as-is', () => {
      const input = { name: 'John', age: 30 };
      const result = jq.apply(input, '.');
      expect(result.success).toBe(true);
      expect(result.result).toEqual(input);
    });

    test('handles JSON string input', () => {
      const input = '{"name": "John", "age": 30}';
      const result = jq.apply(input, '.');
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ name: 'John', age: 30 });
    });

    test('returns error for empty query', () => {
      const input = { name: 'John' };
      const result = jq.apply(input, '');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('handles invalid JSON as string literal', () => {
      const input = '{invalid json}';
      const result = jq.apply(input, '.');
      expect(result.success).toBe(true);
      expect(result.result).toBe('{invalid json}');
    });
  });

  describe('Property access', () => {
    test('accesses single property', () => {
      const input = { name: 'John', age: 30 };
      const result = jq.apply(input, '.name');
      expect(result.success).toBe(true);
      expect(result.result).toBe('John');
    });

    test('accesses nested property', () => {
      const input = { user: { name: 'John', age: 30 } };
      const result = jq.apply(input, '.user.name');
      expect(result.success).toBe(true);
      expect(result.result).toBe('John');
    });

    test('returns undefined for non-existent property', () => {
      const input = { name: 'John' };
      const result = jq.apply(input, '.age');
      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
    });
  });

  describe('Array operations', () => {
    test('array iterator returns entire array', () => {
      const input = [1, 2, 3];
      const result = jq.apply(input, '.[]');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([1, 2, 3]);
    });

    test('array iterator with property maps over array', () => {
      const input = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      const result = jq.apply(input, '.[] | .name');
      expect(result.success).toBe(true);
      expect(result.result).toEqual(['John', 'Jane']);
    });

    test('array index access', () => {
      const input = [10, 20, 30];
      const result = jq.apply(input, '.[1]');
      expect(result.success).toBe(true);
      expect(result.result).toBe(20);
    });

    test('array slice', () => {
      const input = [1, 2, 3, 4, 5];
      const result = jq.apply(input, '.[1:3]');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([2, 3]);
    });

    test('array slice with open end', () => {
      const input = [1, 2, 3, 4, 5];
      const result = jq.apply(input, '.[2:]');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([3, 4, 5]);
    });

    test('array slice with open start', () => {
      const input = [1, 2, 3, 4, 5];
      const result = jq.apply(input, '.[:3]');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([1, 2, 3]);
    });

    test('returns error when iterating non-array', () => {
      const input = { name: 'John' };
      const result = jq.apply(input, '.[]');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot iterate');
    });
  });

  describe('Built-in functions', () => {
    test('keys on object', () => {
      const input = { z: 1, a: 2, m: 3 };
      const result = jq.apply(input, 'keys');
      expect(result.success).toBe(true);
      expect(result.result).toEqual(['a', 'm', 'z']);
    });

    test('keys on array', () => {
      const input = ['a', 'b', 'c'];
      const result = jq.apply(input, 'keys');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([0, 1, 2]);
    });

    test('values on object', () => {
      const input = { a: 1, b: 2, c: 3 };
      const result = jq.apply(input, 'values');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([1, 2, 3]);
    });

    test('length on array', () => {
      const input = [1, 2, 3, 4, 5];
      const result = jq.apply(input, 'length');
      expect(result.success).toBe(true);
      expect(result.result).toBe(5);
    });

    test('length on object', () => {
      const input = { a: 1, b: 2, c: 3 };
      const result = jq.apply(input, 'length');
      expect(result.success).toBe(true);
      expect(result.result).toBe(3);
    });

    test('length on string', () => {
      const input = 'hello';
      const result = jq.apply(input, 'length');
      expect(result.success).toBe(true);
      expect(result.result).toBe(5);
    });

    test('type function', () => {
      expect(jq.apply([1, 2], 'type').result).toBe('array');
      expect(jq.apply({ a: 1 }, 'type').result).toBe('object');
      expect(jq.apply('hello', 'type').result).toBe('string');
      expect(jq.apply(123, 'type').result).toBe('number');
      expect(jq.apply(true, 'type').result).toBe('boolean');
      expect(jq.apply(null, 'type').result).toBe('null');
    });
  });

  describe('Array transformations', () => {
    test('sort numbers', () => {
      const input = [3, 1, 4, 1, 5, 9, 2, 6];
      const result = jq.apply(input, 'sort');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    });

    test('sort strings', () => {
      const input = ['banana', 'apple', 'cherry'];
      const result = jq.apply(input, 'sort');
      expect(result.success).toBe(true);
      expect(result.result).toEqual(['apple', 'banana', 'cherry']);
    });

    test('sort_by property', () => {
      const input = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 }
      ];
      const result = jq.apply(input, 'sort_by(.age)');
      expect(result.success).toBe(true);
      expect(result.result[0].age).toBe(25);
      expect(result.result[2].age).toBe(35);
    });

    test('reverse array', () => {
      const input = [1, 2, 3, 4, 5];
      const result = jq.apply(input, 'reverse');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([5, 4, 3, 2, 1]);
    });

    test('unique values', () => {
      const input = [1, 2, 2, 3, 3, 3, 4];
      const result = jq.apply(input, 'unique');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([1, 2, 3, 4]);
    });

    test('first element', () => {
      const input = [1, 2, 3];
      const result = jq.apply(input, 'first');
      expect(result.success).toBe(true);
      expect(result.result).toBe(1);
    });

    test('last element', () => {
      const input = [1, 2, 3];
      const result = jq.apply(input, 'last');
      expect(result.success).toBe(true);
      expect(result.result).toBe(3);
    });

    test('min value', () => {
      const input = [3, 1, 4, 1, 5, 9];
      const result = jq.apply(input, 'min');
      expect(result.success).toBe(true);
      expect(result.result).toBe(1);
    });

    test('max value', () => {
      const input = [3, 1, 4, 1, 5, 9];
      const result = jq.apply(input, 'max');
      expect(result.success).toBe(true);
      expect(result.result).toBe(9);
    });
  });

  describe('Select and filter', () => {
    test('select with greater than', () => {
      const input = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 }
      ];
      const result = jq.apply(input, 'select(.age > 28)');
      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(2);
      expect(result.result[0].name).toBe('John');
      expect(result.result[1].name).toBe('Bob');
    });

    test('select with equality', () => {
      const input = [
        { name: 'John', active: true },
        { name: 'Jane', active: false },
        { name: 'Bob', active: true }
      ];
      const result = jq.apply(input, 'select(.active == true)');
      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(2);
    });

    test('select with string equality', () => {
      const input = [
        { name: 'John', role: 'admin' },
        { name: 'Jane', role: 'user' },
        { name: 'Bob', role: 'admin' }
      ];
      const result = jq.apply(input, 'select(.role == "admin")');
      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(2);
    });

    test('select single object', () => {
      const input = { age: 30 };
      const result = jq.apply(input, 'select(.age > 25)');
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ age: 30 });
    });

    test('select returns null for non-matching single object', () => {
      const input = { age: 20 };
      const result = jq.apply(input, 'select(.age > 25)');
      expect(result.success).toBe(true);
      expect(result.result).toBeNull();
    });
  });

  describe('Map function', () => {
    test('map property extraction', () => {
      const input = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      const result = jq.apply(input, 'map(.name)');
      expect(result.success).toBe(true);
      expect(result.result).toEqual(['John', 'Jane']);
    });

    test('map with nested property', () => {
      const input = [
        { user: { name: 'John' } },
        { user: { name: 'Jane' } }
      ];
      const result = jq.apply(input, 'map(.user.name)');
      expect(result.success).toBe(true);
      expect(result.result).toEqual(['John', 'Jane']);
    });

    test('map returns error for non-array', () => {
      const input = { name: 'John' };
      const result = jq.apply(input, 'map(.name)');
      expect(result.success).toBe(false);
      expect(result.error).toContain('map only works on arrays');
    });
  });

  describe('Pipe operations', () => {
    test('pipes through multiple operations', () => {
      const input = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 }
      ];
      const result = jq.apply(input, '.[] | select(.age > 26) | .name');
      expect(result.success).toBe(true);
      expect(result.result).toEqual(['John', 'Bob']);
    });

    test('pipes with sort', () => {
      const input = [3, 1, 4, 1, 5];
      const result = jq.apply(input, '. | sort | reverse');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([5, 4, 3, 1, 1]);
    });

    test('complex pipe with filter and map', () => {
      const input = [
        { name: 'John', age: 30, active: true },
        { name: 'Jane', age: 25, active: false },
        { name: 'Bob', age: 35, active: true }
      ];
      const result = jq.apply(input, 'select(.active == true) | map(.name)');
      expect(result.success).toBe(true);
      expect(result.result).toEqual(['John', 'Bob']);
    });
  });

  describe('Edge cases', () => {
    test('handles null values', () => {
      const input = null;
      const result = jq.apply(input, '.');
      expect(result.success).toBe(true);
      expect(result.result).toBeNull();
    });

    test('handles empty array', () => {
      const input = [];
      const result = jq.apply(input, '.[]');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([]);
    });

    test('handles empty object', () => {
      const input = {};
      const result = jq.apply(input, 'keys');
      expect(result.success).toBe(true);
      expect(result.result).toEqual([]);
    });

    test('returns error for unsupported query', () => {
      const input = { name: 'John' };
      const result = jq.apply(input, 'unsupported_function()');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported query');
    });
  });

  describe('getExamples', () => {
    test('returns list of examples', () => {
      const examples = JQLite.getExamples();
      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('query');
      expect(examples[0]).toHaveProperty('description');
    });
  });
});
