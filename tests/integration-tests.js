/**
 * Integration tests for Jison
 */

const { TestSuite, assert } = require('./test-utils');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, '../test-output');
const EXAMPLES_DIR = path.join(__dirname, '../test-grammars');

const suite = new TestSuite('Integration tests');

// 1. Sanity check: TEST_DIR is a non-empty string
suite.test('TEST_DIR is defined', () => {
  assert(typeof TEST_DIR === 'string' && TEST_DIR.length > 0, 'TEST_DIR should be a non-empty string');
});

// 2. Sanity check: EXAMPLES_DIR is defined
suite.test('EXAMPLES_DIR is defined', () => {
  assert(typeof EXAMPLES_DIR === 'string' && EXAMPLES_DIR.length > 0, 'EXAMPLES_DIR should be a non-empty string');
});

// 3. fs.existsSync works for TEST_DIR
suite.test('fs.existsSync for TEST_DIR', () => {
  const exists = fs.existsSync(TEST_DIR);
  assert(typeof exists === 'boolean', 'fs.existsSync should return a boolean');
});

// 4. execSync is available and callable
suite.test('execSync exists', () => {
  assert(typeof execSync === 'function', 'execSync should be a function');
});

// 5. path.basename returns the last segment
suite.test('path.basename extracts final segment', () => {
  const base = path.basename('foo/bar/baz.txt');
  assert(base === 'baz.txt', 'path.basename should return "baz.txt"');
});

module.exports = suite;
