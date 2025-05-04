/**
 * Test utilities for Jison test suite
 */

const assert = require('assert');

// Test framework utilities
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  runTests() {
    let passed = 0;
    let failed = 0;
    
    for (const { name, fn } of this.tests) {
      try {
        console.log(`  Running test: ${name}`);
        fn();
        console.log(`  ✓ Passed: ${name}`);
        passed++;
      } catch (error) {
        console.log(`  ✗ Failed: ${name}`);
        console.log(`    Error: ${error.message}`);
        console.log(`    Stack: ${error.stack.split('\n').slice(0, 3).join('\n    ')}`);
        failed++;
      }
    }
    
    return {
      total: this.tests.length,
      passed,
      failed
    };
  }
}

module.exports = {
  TestSuite,
  assert
};