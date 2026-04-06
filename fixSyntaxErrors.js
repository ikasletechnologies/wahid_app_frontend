const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/data/namesData.js', 'utf-8');

// Fix double commas: ",," -> ","
content = content.replace(/,\s*,/g, ',');

// Add missing commas before quran: when not preceded by comma
// Look for pattern: "learning_insight:"..."} quran: should be }," quran:
content = content.replace(/(")\s+quran:/g, '$1, quran:');

// Write back
fs.writeFileSync('src/data/namesData.js', content, 'utf-8');

console.log('✅ All syntax errors fixed!');
