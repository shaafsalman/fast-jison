const fs = require('fs');
const parser = require('./calculator.js');

try {
  const input = fs.readFileSync('./testcalc', 'utf8').trim();
  console.log("Input:", input);
  const result = parser.parse(input);
  console.log("Result:", result);
} catch (e) {
  console.error("Error:", e.message);
  console.error("Stack:", e.stack);
}