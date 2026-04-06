/**
 * PHASE 2: Add Surah Luqman 31:26 Special Reference
 * 
 * Verse: "Indeed, all that is in the heavens and earth belongs to Allah"
 * 
 * This verse speaks to divine ownership, control, and sovereignty.
 * It should be integrated into names that directly relate to:
 * - Ownership & Sovereignty (Al-Malik, Malik al-Mulk)
 * - Uniqueness & Oneness (Al-Ahad, Al-Wahid)
 * - Sustenance & Creation (As-Samad, Al-Hayy, Al-Qayyum)
 * 
 * TARGET NAMES (8-12 names):
 * 1. Al-Malik (#3) - The King
 * 2. Malik al-Mulk (#84) - Owner of All Sovereignty
 * 3. Al-Wahid (#66) - The One
 * 4. Al-Ahad (#67) - The Unique
 * 5. As-Samad (#68) - The Self-Sufficient
 * 6. Al-Hayy (#62) - The Ever-Living
 * 7. Al-Qayyum (#63) - The Sustainer
 * 8. Al-Haqq (#51) - The Truth
 * 9. Al-Ali (#36) - The Most High
 * 10. Al-Mutakabbir (#10) - The Supreme
 */

const fs = require('fs');
const path = require('path');

// Read namesData.js
const filePath = 'src/data/namesData.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Define the special Luqman reference
const luqmanReference = {
  ar: "إِنَّ الَّذِي فِي السَّمَاءِ وَالْأَرْضِ لِلَّهِ",
  tr: "Indeed, all that is in the heavens and earth belongs to Allah",
  ref: "Surah Luqman 31:26",
  special: true,
  note: "This Quranic verse emphasizes divine ownership and sovereignty"
};

// Names to update with Luqman reference
const targetNames = [3, 84, 66, 67, 68, 62, 63, 51, 36, 10];

let updatedCount = 0;

// Process each target name
targetNames.forEach(nameNumber => {
  // Pattern to find the quran array for this specific name
  const pattern = new RegExp(
    `({ n:${nameNumber},.*?quran:\\[)`,
    's'
  );
  
  if (pattern.test(content)) {
    // Add Luqman reference at the beginning of the quran array
    content = content.replace(
      pattern,
      `$1{ar:"${luqmanReference.ar}",tr:"${luqmanReference.tr}",ref:"${luqmanReference.ref}",special:true},`
    );
    updatedCount++;
    console.log(`✅ Added Luqman 31:26 to Name #${nameNumber}`);
  }
});

// Write back
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`\n✅ Luqman 31:26 Integration Complete!`);
console.log(`   Updated ${updatedCount} names with special Quranic reference`);
console.log(`   Target names: Al-Malik, Malik al-Mulk, Al-Wahid, Al-Ahad, As-Samad, Al-Hayy, Al-Qayyum, Al-Haqq, Al-Ali, Al-Mutakabbir`);
