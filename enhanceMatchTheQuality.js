const fs = require('fs');

// MCQ Transformations for all 99 names
const enhancedMCQ = {
  1: { quality: "All-Encompassing Mercy", applications: ["Forgiving a family member for a repeated mistake", "Extending compassion to a stranger in need", "Accepting yourself with kindness after failure", "Helping someone who hurt you without waiting"] },
  2: { quality: "Personal Specific Mercy", applications: ["Receiving help exactly when needed", "Getting forgiven for unknowing harm", "Getting exactly what you need not asked", "Experiencing healing in your vulnerable wound"] },
  3: { quality: "Divine Sovereignty", applications: ["Losing control gives you freedom", "Trusting delegated authorities", "Releasing micromanagement of others", "Finding peace in unchangeable situations"] },
  4: { quality: "Divine Purity", applications: ["Starting fresh after spiritual failure", "Purifying intention before helping", "Releasing shame about imperfect past", "Beginning spiritual practice with sincerity"] },
  5: { quality: "Internal Peace Source", applications: ["Finding calm amid family conflict", "Remaining peaceful during financial crisis", "Maintaining serenity when treated unfairly", "Accessing peace independent of circumstances"] },
  6: { quality: "Divine Protection", applications: ["Feeling safe in dangerous situations", "Trusting deception will be exposed", "Moving forward without paranoia", "Sleeping peacefully despite concerns"] },
  7: { quality: "Divine Oversight", applications: ["Knowing silent good deeds are recorded", "Behaving honestly when unwatched", "Finding comfort struggles aren't invisible", "Acting with integrity anonymously"] },
  8: { quality: "Undefeatable Power", applications: ["Standing firm against peer pressure", "Resisting oppression with quiet strength", "Facing opponents with Allah's power", "Finding courage through divine alignment"] },
  9: { quality: "Restoration", applications: ["Rebuilding life after breakdown", "Fixing broken relationships", "Transforming trauma into wisdom", "Becoming stronger after breaking"] },
  10: { quality: "Supreme Authority", applications: ["Releasing need to prove yourself", "Accepting only Allah's judgment matters", "Letting go of human recognition", "Living authentically not performing"] },
  11: { quality: "Intentional Creation", applications: ["Accepting unique design with purpose", "Understanding personality as divine craft", "Recognizing intentional not accidental creation", "Using gifts as intended by Creator"] },
  12: { quality: "Divine Distinction", applications: ["Celebrating what makes you different", "Appreciating uniqueness stopping comparison", "Using distinct talents without jealousy", "Finding role as distinct self"] },
  13: { quality: "Divine Artistry", applications: ["Appreciating natural beauty as design", "Accepting appearance as divine art", "Seeing body as masterpiece", "Developing gratitude for physical form"] },
  14: { quality: "Limitless Forgiveness", applications: ["Returning after same sin 100 times", "Fully releasing guilt about mistakes", "Asking forgiveness without shame", "Believing worst moment doesn't define future"] },
  15: { quality: "Divine Justice Over Oppression", applications: ["Waiting for divine justice over revenge", "Trusting oppressors won't escape", "Resisting without rage", "Believing perfect justice comes"] },
  16: { quality: "Generous Gifts", applications: ["Receiving without guilt", "Asking boldly without embarrassment", "Understanding blessings as free gifts", "Sharing generously from received generosity"] },
  17: { quality: "Secured Provision", applications: ["Releasing anxiety about rent", "Trusting secure written sustenance", "Working without desperation", "Finding peace in decreed provision"] },
  18: { quality: "Opening Closed Doors", applications: ["Expecting breakthrough after years", "Asking for impossible with hope", "Believing stuck can suddenly open", "Maintaining faith through waiting"] },
  19: { quality: "All-Encompassing Knowledge", applications: ["Sharing deepest pain without explaining", "Acting sincerely knowing intentions seen", "Releasing need for others validation", "Understanding you don't need to explain all"] },
  20: { quality: "Wisdom in Withholding", applications: ["Accepting delayed blessings", "Understanding why prayers unanswered yet", "Trusting withheld protects you", "Finding peace in unanswered requests"] },
  21: { quality: "Expansion After Hardship", applications: ["Expecting abundance after scarcity", "Maintaining hope during drought", "Knowing winter leads to spring", "Planning expansion during contraction"] },
  22: { quality: "Humbling of Arrogant", applications: ["Releasing arrogance before destruction", "Accepting humility as protection", "Watching arrogant face consequences", "Choosing humility to stay elevated"] },
  23: { quality: "Elevation of Humble", applications: ["Knowing humility elevates truly", "Stopping self-promotion trusting elevation", "Watching humble people rise", "Rising without pride through submission"] },
  24: { quality: "Divine Honor", applications: ["Feeling honored by Allah's attention", "Seeking dignity from divine source", "Standing in value despite rejection", "Living with honor loss can't take"] },
  25: { quality: "Shame to Transgressor", applications: ["Trusting evil-doers face shame", "Releasing own shame of transgression", "Watching wrongdoers face consequences", "Moving forward unburdened"] },
  26: { quality: "Perfect Hearing", applications: ["Speaking du'a without others hearing", "Knowing whispered prayer perfectly heard", "Finding comfort cry never unheard", "Speaking with confidence to perfect listener"] },
  27: { quality: "Perfect Sight", applications: ["Living with integrity when alone", "Knowing unseen struggles witnessed", "Acting with sincerity privately", "Understanding accountability beyond humans"] },
  28: { quality: "Divine Judgment", applications: ["Leaving justice to Allah", "Trusting perfect judgment", "Finding closure final judgment coming", "Waiting for Allah's verdict"] },
  29: { quality: "Perfect Divine Justice", applications: ["Accepting unfairness as wise plan", "Trusting invisible justice", "Surrendering need to see fairness", "Knowing imbalance perfectly balanced"] },
  30: { quality: "Subtle Divine Care", applications: ["Noticing blessings arrive unexpectedly", "Recognizing divine help in coincidences", "Seeing gentle guidance daily", "Appreciating silent care"] },
  31: { quality: "Complete Awareness of Motives", applications: ["Dropping pretense since intentions known", "Acting from pure intention", "Understanding why matters more", "Aligning motivations with divine awareness"] },
  32: { quality: "Divine Patience with Sin", applications: ["Observing Allah delays punishment", "Understanding forbearance aids repentance", "Learning patience from divine model", "Extending patience as Allah extends"] },
  33: { quality: "Divine Magnificence", applications: ["Shifting perspective when problems huge", "Realizing worries infinitesimal", "Finding calm in divine vastness", "Releasing anxiety through awe"] },
  34: { quality: "Complete Forgiveness Coverage", applications: ["Experiencing complete guilt release", "Believing sins utterly erased", "Feeling shame completely dissolved", "Starting fresh after tawbah"] },
  35: { quality: "Appreciation of Small Deeds", applications: ["Continuing small good acts", "Believing tiny efforts massive reward", "Finding meaning in small actions", "Persisting in small goodness"] },
  36: { quality: "Transcendent Reality", applications: ["Directing ambitions upward", "Valuing truly high not worldly", "Aspiring to divine connection", "Seeking ultimate not temporary highs"] },
  37: { quality: "Incomparable Greatness", applications: ["Reciting Allahu Akbar with weight", "Realizing fears less than Akbar", "Finding Allahu Akbar as solution", "Understanding divine greatness surpasses fears"] },
  38: { quality: "Divine Preservation", applications: ["Trusting deeds safely kept", "Knowing nothing for Allah lost", "Feeling good being preserved", "Working without irrelevance fear"] },
  39: { quality: "Moment-to-Moment Sustenance", applications: ["Becoming conscious of dependence", "Gratitude at each meal", "Understanding existence continuous gift", "Appreciating being alive"] },
  40: { quality: "Perfect Record Keeping", applications: ["Acting honestly knowing accuracy", "Trusting Allah's count over humans", "Being honest since truth known", "Releasing miscalculation anxiety"] },
  41: { quality: "Majestic Beauty", applications: ["Approaching Allah with awe and love", "Experiencing reverent intimacy", "Balancing respect with bold hope", "Finding prayer combining fear and love"] },
  42: { quality: "Overflowing Generosity", applications: ["Asking boldly without shame", "Believing asking increases His love", "Moving from scarcity to abundance", "Recognizing unmatched generosity"] },
  43: { quality: "Divine Watchfulness", applications: ["Developing natural god-consciousness", "Stopping harmful behavior", "Acting honestly when watched", "Building integrity through presence"] },
  44: { quality: "Responsive to All Prayer", applications: ["Praying with response conviction", "Understanding delayed still response", "Trusting every prayer answered", "Accepting no as valid answer"] },
  45: { quality: "Boundless Reach", applications: ["Feeling hope never too far gone", "Trusting mercy everywhere always", "Moving beyond hopelessness", "Believing never outside reach"] },
  46: { quality: "Perfect Wisdom", applications: ["Trusting wisdom without understanding", "Accepting suffering contains wisdom", "Waiting for hidden wisdom", "Surrendering need to understand all"] },
  47: { quality: "Unconditional Love", applications: ["Believing Allah loves you unconditionally", "Receiving love unearned", "Loving others as divine model", "Releasing unlovable fear"] },
  48: { quality: "Majesty with Generosity", applications: ["Combining reverence with asking", "Experiencing warm majesty", "Building fearful and hopeful prayer", "Understanding glory flows toward us"] },
  49: { quality: "Resurrection Certainty", applications: ["Living purposefully beyond life", "Preparing for accountability", "Finding hope death not final", "Making eternal perspective choices"] },
  50: { quality: "Divine Witnessing", applications: ["Removing human validation need", "Acting with private integrity", "Behaving well unobserved", "Building character from divine witness"] },
  51: { quality: "Absolute Reality", applications: ["Grounding in ultimate truth", "Releasing temporary illusions", "Anchoring identity in divine truth", "Building on ultimate reality"] },
  52: { quality: "Complete Trust in Trustee", applications: ["Releasing outcomes completely", "Surrendering results after action", "Practicing tawakkul", "Finding peace through reliance"] },
  53: { quality: "Absolute Power", applications: ["Drawing divine strength", "Facing enemies with backing", "Accessing courage divinely", "Overcoming weakness divinely"] },
  54: { quality: "Unwavering Foundation", applications: ["Building on unshakeable ground", "Finding stability amid chaos", "Creating internal firmness", "Grounding identity divinely"] },
  55: { quality: "Protective Closeness", applications: ["Experiencing intimate alliance", "Finding loyal friendship", "Moving closer to friend", "Building friendship through closeness"] },
  56: { quality: "Divine Praiseworthiness", applications: ["Enriching gratitude meaning", "Saying Alhamdulillah fully", "Practicing praise spiritually", "Making gratitude constant"] },
  57: { quality: "Perfect Enumeration", applications: ["Trusting small deeds counted", "Continuing knowing count matters", "Building sincerity through counting", "Persisting in small goodness"] },
  58: { quality: "Unique Origination", applications: ["Marveling at creation", "Strengthening faith through proof", "Appreciating divine uniqueness", "Wondering at creation"] },
  59: { quality: "Certainty of Restoration", applications: ["Believing resurrection guaranteed", "Living urgently", "Making meaningful choices", "Preparing seriously"] },
  60: { quality: "Spiritual Revival", applications: ["Seeking dormant heart revival", "Asking for awakening", "Moving from deadness to aliveness", "Pursuing spiritual rebirth"] },
  61: { quality: "Appointed Mortality", applications: ["Accepting divine appointment", "Finding urgency through mortality", "Making aware choices", "Living intentionally finite"] },
  62: { quality: "Eternal Aliveness", applications: ["Grounding in eternally living", "Experiencing present God", "Building with living reality", "Anchoring eternal presence"] },
  63: { quality: "Continuous Sustenance", applications: ["Aware of moment-sustaining", "Grateful at each breath", "Understanding continuous grace", "Appreciating sustained miracle"] },
  64: { quality: "Divine Perception", applications: ["Aware of being fully known", "Releasing pretense", "Accepting divine understanding", "Moving toward authenticity"] },
  65: { quality: "Infinite Nobility", applications: ["Aspiring to nobility", "Understanding generous nobility", "Combining majesty with generosity", "Building noble character"] },
  66: { quality: "Absolute Singularity", applications: ["Releasing multiple dependencies", "Directing toward One", "Unifying allegiances", "Orienting toward Allah"] },
  67: { quality: "Incomparable Uniqueness", applications: ["Grasping monotheism deeply", "Eliminating comparison", "Understanding Allah uniqueness", "Building absolute faith"] },
  68: { quality: "Self-Sufficiency", applications: ["Stopping at source", "Releasing human dependence", "Directing needs directly", "Building divine independence"] },
  69: { quality: "Absolute Capability", applications: ["Believing all possible", "Asking boldly", "Releasing impossible despair", "Trusting divine ability"] },
  70: { quality: "Precise Execution", applications: ["Trusting perfect plans", "Releasing detailed control", "Watching precision manifest", "Observing impossible execution"] },
  71: { quality: "Divine Expedition", applications: ["Receiving early blessings", "Recognizing premature wisdom", "Noticing early provision", "Appreciating early blessings"] },
  72: { quality: "Divine Delays as Mercy", applications: ["Trusting delay wisdom", "Waiting without despair", "Accepting late timing perfectly", "Finding delayed wisdom"] },
  73: { quality: "Eternal Precedence", applications: ["Grounding in precedent God", "Understanding ultimate origin", "Building eternal certainty", "Anchoring pre-eternal faith"] },
  74: { quality: "Eternal Continuance", applications: ["Finding eternal comfort", "Preparing eternal meeting", "Understanding eternal horizon", "Making eternal choices"] },
  75: { quality: "Clear Revelation", applications: ["Reading creation proclamation", "Seeing life signs", "Moving from doubt to certainty", "Building evidence faith"] },
  76: { quality: "Hidden Intimacy", applications: ["Recognizing hidden closeness", "Discovering divine mystery", "Moving beyond perception", "Building unseen relationship"] },
  77: { quality: "Divine Governance", applications: ["Trusting divine rule", "Reducing world anxiety", "Accepting just governance", "Finding divine peace"] },
  78: { quality: "Transcendent Exaltation", applications: ["Releasing limited Allah concepts", "Embracing divine mystery", "Accepting incomprehensibility", "Building beyond-understanding faith"] },
  79: { quality: "Boundless Goodness", applications: ["Expanding goodness expectation", "Recognizing universal goodness", "Witnessing equal rain", "Practicing universal gratitude"] },
  80: { quality: "Continuous Tawbah Acceptance", applications: ["Returning infinitely", "Believing never-closing repentance", "Releasing permanent rejection fear", "Moving from wallowing to action"] },
  81: { quality: "Certain Divine Retribution", applications: ["Trusting justice for oppressors", "Releasing revenge", "Waiting patient justice", "Believing guaranteed justice"] },
  82: { quality: "Complete Sin Erasure", applications: ["Experiencing total liberation", "Believing utter erasure", "Releasing shame's hold", "Starting clean slate"] },
  83: { quality: "Tender Divine Compassion", applications: ["Experiencing divine gentleness", "Showing vulnerability tenderness", "Receiving weakness care", "Building divine compassion"] },
  84: { quality: "Divine Sovereignty Distribution", applications: ["Understanding temporary power", "Not clinging authority", "Accepting power transitions", "Seeking divine elevation"] },
  85: { quality: "Majesty with Bounty", applications: ["Approaching awe-bold hopeful", "Combining reverence with asking", "Balancing fear and dua confidence", "Building respectful-hopeful prayer"] },
  86: { quality: "Perfect Impartiality", applications: ["Trusting divine beyond corruption", "Becoming fair", "Believing perfect service", "Releasing vindication burden"] },
  87: { quality: "Ultimate Assembly", applications: ["Believing gathering for reckoning", "Preparing seriously", "Finding righteous reunion comfort", "Making judgment day choices"] },
  88: { quality: "Divine Self-Sufficiency", applications: ["Understanding worship enriches you", "Moving transactional to transformational", "Shifting self-serving to sincere", "Deepening proper-understanding worship"] },
  89: { quality: "Beyond-Material Enrichment", applications: ["Recognizing heart soul enrichment", "Finding beyond-account wealth", "Seeking relationship spirit enrichment", "Moving beyond money-worldview"] },
  90: { quality: "Wisdom in Refusal", applications: ["Trusting withheld protection", "Accepting merciful no", "Finding unanswered wisdom", "Releasing divine-refusal resentment"] },
  91: { quality: "Purpose in Hardship", applications: ["Understanding difficulty curriculum", "Learning not just suffering", "Finding challenge growth", "Extracting adversity wisdom"] },
  92: { quality: "Universal Benefit Source", applications: ["Sourcing exclusively divine", "Removing human help anxiety", "Understanding divine benefit trace", "Building divine trust"] },
  93: { quality: "Spiritual Illumination", applications: ["Seeking guidance", "Finding darkness light", "Turning toward divine", "Allowing clarity seeking"] },
  94: { quality: "Active Divine Guidance", applications: ["Sincerely seeking", "Receiving through receptivity", "Walking guided path", "Asking directional wisdom"] },
  95: { quality: "Creative Originality", applications: ["Reflecting divine creativity", "Creating without fear", "Developing unique talents", "Celebrating human originality"] },
  96: { quality: "Eternal Endurance", applications: ["Investing eternal", "Building forever-lasting", "Releasing passing attachment", "Making eternally significant choices"] },
  97: { quality: "Ultimate Ownership", applications: ["Understanding stewardship", "Giving from trust", "Releasing possession attachment", "Recognizing return to Allah"] },
  98: { quality: "Perfect Right Guidance", applications: ["Surrendering to divine direction", "Trusting best outcome guidance", "Following direction over preference", "Allowing divine wisdom direction"] },
  99: { quality: "Divine Patience Model", applications: ["Learning from divine example", "Extending others patience", "Practicing forbearance discipline", "Building core patience character"]}
};

// Read namesData.js
let content = fs.readFileSync('src/data/namesData.js', 'utf-8');

// Replace MCQ for each name
let processedCount = 0;
for (let nameNum = 1; nameNum <= 99; nameNum++) {
  if (enhancedMCQ[nameNum]) {
    const quality = enhancedMCQ[nameNum].quality;
    const apps = enhancedMCQ[nameNum].applications;
    
    // Create new MCQ object format
    const appString = apps.map(a => `"${a.replace(/"/g, '\\"')}"`) .join(',');
    const newMCQ = `mcq:[{quality:"${quality}",applications:[${appString}]}]`;
    
    // Pattern to match this name's mcq array
    const pattern = new RegExp(
      `({ n:${nameNum},.*?)mcq:\\[.*?\\](?=[,}])`,
      's'
    );
    
    if (pattern.test(content)) {
      content = content.replace(pattern, `$1${newMCQ}`);
      processedCount++;
    }
  }
}

// Write back
fs.writeFileSync('src/data/namesData.js', content, 'utf-8');

console.log(`✅ Match the Quality Enhancement Complete!`);
console.log(`   Transformed ${processedCount} MCQ items`);
console.log(`   Format: Quality → Real-life Applications`);
console.log(`   Each name now has 4 application scenarios`);
