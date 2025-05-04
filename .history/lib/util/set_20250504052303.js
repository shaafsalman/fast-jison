/**
 * File: lib/util/set.js
 * Source: Original lib/util/set.js
 * Refactorings: Extract Method, Move Method
 * Functionality: Set operations utility
 */

// Extract Method: Create a new set
function createSet(elements = []) {
    const set = new Set(elements);
    
    // Add helper methods to the set
    return {
      add: (item) => set.add(item),
      has: (item) => set.has(item),
      remove: (item) => set.delete(item),
      union: (otherSet) => createSet([...set, ...otherSet]),
      intersection: (otherSet) => createSet([...set].filter(x => otherSet.has(x))),
      toArray: () => [...set]
    };
  }
  
  module.exports = { createSet };