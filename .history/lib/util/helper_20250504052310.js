/**
 * File: lib/util/helper.js
 * Source: New utility extracted from various functions
 * Refactorings: Extract Method, Move Method
 * Functionality: Common helper functions
 */

// Replace Error Code with Exception
function validateInput(input, type) {
    if (!input) {
      throw new Error('Input is required');
    }
    
    if (type && typeof input !== type) {
      throw new Error(`Input must be of type ${type}`);
    }
    
    return true;
  }
  
  // Parameterize Method: General purpose string formatter
  function formatString(template, values) {
    return Object.entries(values).reduce(
      (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
      template
    );
  }
  
  module.exports = {
    validateInput,
    formatString
  };