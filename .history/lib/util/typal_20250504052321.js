/**
 * File: lib/util/typal.js
 * Source: Original lib/util/typal.js
 * Refactorings: Extract Method, Replace Constructor with Factory Method
 * Functionality: Type system helpers
 */

// Extract Method: Create a type helper
function createTypeHelper(baseType = {}) {
    return {
      extend: function(props) {
        return Object.assign(Object.create(baseType), props);
      },
      
      implement: function(obj, interface) {
        // Verify that obj implements all methods in interface
        for (const key in interface) {
          if (typeof interface[key] === 'function' && typeof obj[key] !== 'function') {
            throw new Error(`Object must implement ${key} method`);
          }
        }
        return obj;
      },
      
      // Factory Method: Create a new instance of a type
      create: function(props) {
        return this.extend(props);
      }
    };
  }
  
  module.exports = { createTypeHelper };