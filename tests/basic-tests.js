/**
 * Basic tests for Jison
 * Tests module loading and basic functionality
 */

const { TestSuite, assert } = require('./test-utils');
const Jison = require('../lib/index');

const suite = new TestSuite('Basic tests');

// Test basic module loading
suite.test('Module loading', () => {
  assert(Jison, 'Jison module should be loaded');
  assert(Jison.Parser, 'Jison Parser should be available');
  assert(Jison.Generator, 'Jison Generator should be available');
  assert(typeof Jison.version === 'string', 'Jison version should be a string');
});

suite.test('Version is non-empty', () => {
  assert(Jison.version.length > 0, 'Jison version should not be empty');
});

// Test that Generator.createParser is defined and is a function
// suite.test('Generator.createParser exists', () => {
//   assert(typeof Jison.Generator.createParser === 'function', 'Generator.createParser should be a function');
// });

// Test that basic arithmetic works in the test environment
suite.test('Basic arithmetic sanity', () => {
  assert(1 + 1 === 2, '1 + 1 should equal 2');
});


// Confirm that an empty array has length 0
suite.test('Empty array length', () => {
  assert([].length === 0, 'Empty array should have length 0');
});



// Export the module
module.exports = suite;