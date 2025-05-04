/*
 * File: lib/common/constants.js
 * 
 * Refactorings applied:
 * - Extract Class: Moved constants to dedicated file
 * - Organizing Data: Grouped related constants
 * 
 * Functionality: Provides constants used throughout the Jison codebase
 */

// Constants used for actions in parser tables
exports.SHIFT = 1;   // shift
exports.REDUCE = 2;  // reduce
exports.ACCEPT = 3;  // accept

// Constants for operator precedence
exports.NONASSOC = 0;