const fs = require('fs');
const path = require('path');
const seedPath = 'c:/Users/Administrator/Documents/Wahid_Mobile_Backend/prisma/seed.js';

let content = fs.readFileSync(seedPath, 'utf8');

const startStr = '// ─── 99 Names of Allah ────────────────────────────────────────────────────────';
const endStr = '// ─── Category Map (sourced from Wahid HTML data) ─────────────────────────────';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

const newArr = `// ─── 99 Names of Allah ────────────────────────────────────────────────────────
const fsPath = require('path');
const namesDataPath = fsPath.join(__dirname, '../../Wahid_Mobile_Frontend/src/data/namesData.js');
const namesDataContent = require('fs').readFileSync(namesDataPath, 'utf8');
const arrayString = namesDataContent.substring(namesDataContent.indexOf('['), namesDataContent.lastIndexOf(']') + 1);
const names99 = eval('(' + arrayString + ')');

`;

content = content.substring(0, startIdx) + newArr + content.substring(endIdx);

const oldLoopStart = '  for (const name of names99) {';
const newLoopStart = `  for (const raw of names99) {
    const nameWithCategory = {
      number: raw.n,
      arabic: raw.ar,
      transliteration: raw.tr,
      meaning: raw.en.split(' — ')[0]?.trim() || raw.en,
      description: raw.en.split(' — ')[1]?.trim() || raw.en,
      category: raw.cat || 'mercy',
      reflection: raw.reflection || '',
      benefits: raw.benefits || [],
      quran: raw.quran || [],
      mcq: raw.mcq || [],
      moods: raw.moods || []
    };`;

const loopStartIdx = content.indexOf(oldLoopStart);
const loopMidIdx = content.indexOf('    try {', loopStartIdx);
if (loopStartIdx !== -1 && loopMidIdx !== -1) {
  content = content.substring(0, loopStartIdx) + newLoopStart + '\n' + content.substring(loopMidIdx);
}

content = content.replace(/where: { number: name\.number },/g, 'where: { number: raw.n },');
content = content.replace(/\$\{name\.number\}/g, '${raw.n}');
content = content.replace(/\$\{name\.transliteration\}/g, '${raw.tr}');

fs.writeFileSync(seedPath, content);
console.log('Seed updated!');
