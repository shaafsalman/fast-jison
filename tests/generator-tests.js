/**
 * Tests for different generator types
 */

const { TestSuite, assert } = require('./test-utils');
const Jison = require('../lib/index');

const suite = new TestSuite('Generator tests');

// Very simple sanity: Jison.Generator should exist
suite.test('Generator exists', () => {
  assert(Jison.Generator, 'Jison.Generator should be defined');
});

// Check that Jison.Generator is a function (constructor)
suite.test('Generator is a function', () => {
  assert(typeof Jison.Generator === 'function', 'Jison.Generator should be a function');
});

// Basic arithmetic to confirm test runner is working
suite.test('Basic arithmetic sanity', () => {
  assert(2 + 2 === 4, '2 + 2 should equal 4');
});

module.exports = suite;
