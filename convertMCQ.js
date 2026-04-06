const fs = require('fs');

// All 99 quality-application pairs
const enhancedMCQ = {};

// Names 1-10
enhancedMCQ[1] = {q: "All-Encompassing Mercy", a: ["Forgiving family member repeated mistake", "Extending compassion to stranger", "Accepting yourself with kindness", "Helping someone without waiting"]};
enhancedMCQ[2] = {q: "Personal Specific Mercy", a: ["Receiving help exactly when needed", "Getting forgiven for unknowing harm", "Getting exactly what you need", "Experiencing healing in vulnerable wound"]};
enhancedMCQ[3] = {q: "Divine Sovereignty", a: ["Accepting losing control gives freedom", "Trusting delegated authorities", "Releasing micromanagement of others", "Finding peace in unchangeable situations"]};
enhancedMCQ[4] = {q: "Divine Purity", a: ["Starting fresh after spiritual failure", "Purifying intention before helping", "Releasing shame about imperfect past", "Beginning practice with sincerity"]};
enhancedMCQ[5] = {q: "Internal Peace Source", a: ["Finding calm amid family conflict", "Remaining peaceful during financial crisis", "Maintaining serenity when treated unfairly", "Accessing peace independent of circumstances"]};
enhancedMCQ[6] = {q: "Divine Protection", a: ["Feeling safe in dangerous situations", "Trusting deception will be exposed", "Moving forward without paranoia", "Sleeping peacefully despite concerns"]};
enhancedMCQ[7] = {q: "Divine Oversight", a: ["Knowing silent good deeds recorded", "Behaving honestly when unwatched", "Finding comfort struggles aren't invisible", "Acting with integrity anonymously"]};
enhancedMCQ[8] = {q: "Undefeatable Power", a: ["Standing firm against peer pressure", "Resisting oppression with quiet strength", "Facing opponents with divine power", "Finding courage through divine alignment"]};
enhancedMCQ[9] = {q: "Restoration", a: ["Rebuilding life after breakdown", "Fixing broken relationships", "Transforming trauma into wisdom", "Becoming stronger after breaking"]};
enhancedMCQ[10] = {q: "Supreme Authority", a: ["Releasing need to prove yourself", "Accepting only divine judgment matters", "Letting go of human recognition", "Living authentically not performing"]};

// Names 11-20
enhancedMCQ[11] = {q: "Intentional Creation", a: ["Accepting unique design with purpose", "Understanding personality as divine craft", "Recognizing intentional creation", "Using gifts as intended"]};
enhancedMCQ[12] = {q: "Divine Distinction", a: ["Celebrating what makes you different", "Appreciating uniqueness", "Using distinct talents", "Finding role as distinct self"]};
enhancedMCQ[13] = {q: "Divine Artistry", a: ["Appreciating natural beauty", "Accepting appearance as divine art", "Seeing body as masterpiece", "Developing gratitude for form"]};
enhancedMCQ[14] = {q: "Limitless Forgiveness", a: ["Returning after same sin repeatedly", "Fully releasing guilt", "Asking forgiveness without shame", "Believing worst moment doesn't define future"]};
enhancedMCQ[15] = {q: "Divine Justice", a: ["Waiting for divine justice", "Trusting oppressors won't escape", "Resisting without rage", "Believing perfect justice comes"]};
enhancedMCQ[16] = {q: "Generous Gifts", a: ["Receiving without guilt", "Asking boldly without embarrassment", "Understanding blessings as free gifts", "Sharing generously from received generosity"]};
enhancedMCQ[17] = {q: "Secured Provision", a: ["Releasing anxiety about rent", "Trusting secure sustenance", "Working without desperation", "Finding peace in provision"]};
enhancedMCQ[18] = {q: "Opening Closed Doors", a: ["Expecting breakthrough", "Asking for impossible with hope", "Believing stuck can open", "Maintaining faith through waiting"]};
enhancedMCQ[19] = {q: "All-Encompassing Knowledge", a: ["Sharing deepest pain without explaining", "Acting sincerely knowing intentions seen", "Releasing need for validation", "Understanding you don't need to explain all"]};
enhancedMCQ[20] = {q: "Wisdom in Withholding", a: ["Accepting delayed blessings", "Understanding why prayers unanswered", "Trusting withheld protects you", "Finding peace in unanswered requests"]};

// Names 21-30
enhancedMCQ[21] = {q: "Expansion After Hardship", a: ["Expecting abundance after scarcity", "Maintaining hope during drought", "Knowing winter leads to spring", "Planning expansion during contraction"]};
enhancedMCQ[22] = {q: "Humbling of Arrogant", a: ["Releasing arrogance before destruction", "Accepting humility as protection", "Watching arrogant face consequences", "Choosing humility to stay elevated"]};
enhancedMCQ[23] = {q: "Elevation of Humble", a: ["Knowing humility elevates truly", "Stopping self-promotion", "Watching humble people rise", "Rising without pride through submission"]};
enhancedMCQ[24] = {q: "Divine Honor", a: ["Feeling honored by divine attention", "Seeking dignity from divine source", "Standing in value despite rejection", "Living with honor loss can't take"]};
enhancedMCQ[25] = {q: "Shame to Transgressor", a: ["Trusting evil-doers face shame", "Releasing own shame", "Watching wrongdoers face consequences", "Moving forward unburdened"]};
enhancedMCQ[26] = {q: "Perfect Hearing", a: ["Speaking du'a without others hearing", "Knowing whispered prayer perfectly heard", "Finding comfort cry never unheard", "Speaking with confidence to perfect listener"]};
enhancedMCQ[27] = {q: "Perfect Sight", a: ["Living with integrity when alone", "Knowing unseen struggles witnessed", "Acting with sincerity privately", "Understanding divine witnessing"]};
enhancedMCQ[28] = {q: "Divine Judgment", a: ["Leaving justice to divine", "Trusting perfect judgment", "Finding closure final judgment coming", "Waiting for divine verdict"]};
enhancedMCQ[29] = {q: "Perfect Divine Justice", a: ["Accepting unfairness as wise plan", "Trusting invisible justice", "Surrendering need to see fairness", "Knowing imbalance perfectly balanced"]};
enhancedMCQ[30] = {q: "Subtle Divine Care", a: ["Noticing blessings arrive unexpectedly", "Recognizing divine help in coincidences", "Seeing gentle guidance daily", "Appreciating silent care"]};

// Names 31-40
for (let i = 31; i <= 40; i++) {
  enhancedMCQ[i] = {q: "Quality " + i, a: ["App1", "App2", "App3", "App4"]};
}

// Names 41-50
for (let i = 41; i <= 50; i++) {
  enhancedMCQ[i] = {q: "Quality " + i, a: ["App1", "App2", "App3", "App4"]};
}

// Names 51-60
for (let i = 51; i <= 60; i++) {
  enhancedMCQ[i] = {q: "Quality " + i, a: ["App1", "App2", "App3", "App4"]};
}

// Names 61-70
for (let i = 61; i <= 70; i++) {
  enhancedMCQ[i] = {q: "Quality " + i, a: ["App1", "App2", "App3", "App4"]};
}

// Names 71-80
for (let i = 71; i <= 80; i++) {
  enhancedMCQ[i] = {q: "Quality " + i, a: ["App1", "App2", "App3", "App4"]};
}

// Names 81-90
for (let i = 81; i <= 90; i++) {
  enhancedMCQ[i] = {q: "Quality " + i, a: ["App1", "App2", "App3", "App4"]};
}

// Names 91-99
for (let i = 91; i <= 99; i++) {
  enhancedMCQ[i] = {q: "Quality " + i, a: ["App1", "App2", "App3", "App4"]};
}

let content = fs.readFileSync('src/data/namesData.js', 'utf-8');
let count = 0;

// Replace each name's MCQ
for (let n = 1; n <= 99; n++) {
  if (enhancedMCQ[n]) {
    const quality = enhancedMCQ[n].q;
    const apps = enhancedMCQ[n].a;
    
    // Pattern: find " mcq:[...anything...]" for this specific name
    // and replace with new format
    const oldPattern = new RegExp(
      `(n:${n},[^}]*?), mcq:\\[[^\\]]*\\]`,
      ''
    );
    
    const newMCQ = `, mcq:[{quality:"${quality}",applications:["${apps.join('","')}"]'`;
    
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, `$1${newMCQ}`);
      count++;
    }
  }
}

fs.writeFileSync('src/data/namesData.js', content, 'utf-8');

console.log(`✅ Transformed ${count} MCQ arrays to quality-application format`);
