const fs = require('fs');

// Enhanced MCQ data for all 99 names - simplified for better regex replacement
const enhancedMCQ = {
  1: { quality: "All-Encompassing Mercy", apps: ["Forgiving family member repeated mistake", "Extending compassion to stranger in need", "Accepting yourself with kindness after failure", "Helping someone who hurt you without waiting"] },
  2: { quality: "Personal Specific Mercy", apps: ["Receiving help exactly when needed", "Getting forgiven for unknowing harm", "Getting exactly what you need not asked", "Experiencing healing in vulnerable wound"] },
  3: { quality: "Divine Sovereignty", apps: ["Accepting losing control gives freedom", "Trusting delegated authorities", "Releasing micromanagement of others", "Finding peace in unchangeable situations"] },
  4: { quality: "Divine Purity", apps: ["Starting fresh after spiritual failure", "Purifying intention before helping", "Releasing shame about imperfect past", "Beginning spiritual practice with sincerity"] },
  5: { quality: "Internal Peace Source", apps: ["Finding calm amid family conflict", "Remaining peaceful during financial crisis", "Maintaining serenity when treated unfairly", "Accessing peace independent of circumstances"] },
  6: { quality: "Divine Protection", apps: ["Feeling safe in dangerous situations", "Trusting deception will be exposed", "Moving forward without paranoia", "Sleeping peacefully despite concerns"] },
  7: { quality: "Divine Oversight", apps: ["Knowing silent good deeds are recorded", "Behaving honestly when unwatched", "Finding comfort struggles aren't invisible", "Acting with integrity anonymously"] },
  8: { quality: "Undefeatable Power", apps: ["Standing firm against peer pressure", "Resisting oppression with quiet strength", "Facing opponents with divine power", "Finding courage through divine alignment"] },
  9: { quality: "Restoration", apps: ["Rebuilding life after breakdown", "Fixing broken relationships", "Transforming trauma into wisdom", "Becoming stronger after breaking"] },
  10: { quality: "Supreme Authority", apps: ["Releasing need to prove yourself", "Accepting only divine judgment matters", "Letting go of human recognition", "Living authentically not performing"] },
  11: { quality: "Intentional Creation", apps: ["Accepting unique design with purpose", "Understanding personality as divine craft", "Recognizing intentional creation", "Using gifts as intended"] },
  12: { quality: "Divine Distinction", apps: ["Celebrating what makes you different", "Appreciating uniqueness", "Using distinct talents", "Finding role as distinct self"] },
  13: { quality: "Divine Artistry", apps: ["Appreciating natural beauty", "Accepting appearance as divine art", "Seeing body as masterpiece", "Developing gratitude for form"] },
  14: { quality: "Limitless Forgiveness", apps: ["Returning after same sin repeatedly", "Fully releasing guilt", "Asking forgiveness without shame", "Believing worst moment doesn't define future"] },
  15: { quality: "Divine Justice", apps: ["Waiting for divine justice", "Trusting oppressors won't escape", "Resisting without rage", "Believing perfect justice comes"] },
  16: { quality: "Generous Gifts", apps: ["Receiving without guilt", "Asking boldly without embarrassment", "Understanding blessings as free gifts", "Sharing generously from received generosity"] },
  17: { quality: "Secured Provision", apps: ["Releasing anxiety about rent", "Trusting secure sustenance", "Working without desperation", "Finding peace in provision"] },
  18: { quality: "Opening Closed Doors", apps: ["Expecting breakthrough", "Asking for impossible with hope", "Believing stuck can open", "Maintaining faith through waiting"] },
  19: { quality: "All-Encompassing Knowledge", apps: ["Sharing deepest pain without explaining", "Acting sincerely knowing intentions seen", "Releasing need for validation", "Understanding you don't need to explain all"] },
  20: { quality: "Wisdom in Withholding", apps: ["Accepting delayed blessings", "Understanding why prayers unanswered", "Trusting withheld protects you", "Finding peace in unanswered requests"] },
  21: { quality: "Expansion After Hardship", apps: ["Expecting abundance after scarcity", "Maintaining hope during drought", "Knowing winter leads to spring", "Planning expansion during contraction"] },
  22: { quality: "Humbling of Arrogant", apps: ["Releasing arrogance before destruction", "Accepting humility as protection", "Watching arrogant face consequences", "Choosing humility to stay elevated"] },
  23: { quality: "Elevation of Humble", apps: ["Knowing humility elevates truly", "Stopping self-promotion", "Watching humble people rise", "Rising without pride through submission"] },
  24: { quality: "Divine Honor", apps: ["Feeling honored by divine attention", "Seeking dignity from divine source", "Standing in value despite rejection", "Living with honor loss can't take"] },
  25: { quality: "Shame to Transgressor", apps: ["Trusting evil-doers face shame", "Releasing own shame", "Watching wrongdoers face consequences", "Moving forward unburdened"] },
  26: { quality: "Perfect Hearing", apps: ["Speaking du'a without others hearing", "Knowing whispered prayer perfectly heard", "Finding comfort cry never unheard", "Speaking with confidence to perfect listener"] },
  27: { quality: "Perfect Sight", apps: ["Living with integrity when alone", "Knowing unseen struggles witnessed", "Acting with sincerity privately", "Understanding divine witnessing"] },
  28: { quality: "Divine Judgment", apps: ["Leaving justice to divine", "Trusting perfect judgment", "Finding closure final judgment coming", "Waiting for divine verdict"] },
  29: { quality: "Perfect Divine Justice", apps: ["Accepting unfairness as wise plan", "Trusting invisible justice", "Surrendering need to see fairness", "Knowing imbalance perfectly balanced"] },
  30: { quality: "Subtle Divine Care", apps: ["Noticing blessings arrive unexpectedly", "Recognizing divine help in coincidences", "Seeing gentle guidance daily", "Appreciating silent care"] },
  31: { quality: "Complete Awareness of Motives", apps: ["Dropping pretense since intentions known", "Acting from pure intention", "Understanding why matters more", "Aligning motivations divinely"] },
  32: { quality: "Divine Patience with Sin", apps: ["Observing divine delay punishment", "Understanding forbearance aids repentance", "Learning patience from divine model", "Extending patience as divine extends"] },
  33: { quality: "Divine Magnificence", apps: ["Shifting perspective when problems huge", "Realizing worries infinitesimal", "Finding calm in divine vastness", "Releasing anxiety through awe"] },
  34: { quality: "Complete Forgiveness Coverage", apps: ["Experiencing complete guilt release", "Believing sins utterly erased", "Feeling shame completely dissolved", "Starting fresh after tawbah"] },
  35: { quality: "Appreciation of Small Deeds", apps: ["Continuing small good acts", "Believing tiny efforts massive reward", "Finding meaning in small actions", "Persisting in small goodness"] },
  36: { quality: "Transcendent Reality", apps: ["Directing ambitions upward", "Valuing truly high", "Aspiring to divine connection", "Seeking ultimate not temporary highs"] },
  37: { quality: "Incomparable Greatness", apps: ["Reciting Allahu Akbar with weight", "Realizing fears less than divine", "Finding Allahu Akbar as solution", "Understanding divine greatness surpasses fears"] },
  38: { quality: "Divine Preservation", apps: ["Trusting deeds safely kept", "Knowing nothing for divine lost", "Feeling good being preserved", "Working without irrelevance fear"] },
  39: { quality: "Moment-to-Moment Sustenance", apps: ["Becoming conscious of dependence", "Gratitude at each meal", "Understanding continuous gift", "Appreciating being alive"] },
  40: { quality: "Perfect Record Keeping", apps: ["Acting honestly knowing accuracy", "Trusting divine count", "Being honest since truth known", "Releasing miscalculation anxiety"] },
  41: { quality: "Majestic Beauty", apps: ["Approaching with awe and love", "Experiencing reverent intimacy", "Balancing respect with bold hope", "Finding prayer combining fear and love"] },
  42: { quality: "Overflowing Generosity", apps: ["Asking boldly without shame", "Believing asking increases love", "Moving from scarcity to abundance", "Recognizing unmatched generosity"] },
  43: { quality: "Divine Watchfulness", apps: ["Developing natural god-consciousness", "Stopping harmful behavior", "Acting honestly when watched", "Building integrity through presence"] },
  44: { quality: "Responsive to All Prayer", apps: ["Praying with response conviction", "Understanding delayed still response", "Trusting every prayer answered", "Accepting no as valid answer"] },
  45: { quality: "Boundless Reach", apps: ["Feeling hope never too far gone", "Trusting mercy everywhere always", "Moving beyond hopelessness", "Believing never outside reach"] },
  46: { quality: "Perfect Wisdom", apps: ["Trusting wisdom without understanding", "Accepting suffering contains wisdom", "Waiting for hidden wisdom", "Surrendering need to understand all"] },
  47: { quality: "Unconditional Love", apps: ["Believing divine loves unconditionally", "Receiving love unearned", "Loving others as divine model", "Releasing unlovable fear"] },
  48: { quality: "Majesty with Generosity", apps: ["Combining reverence with asking", "Experiencing warm majesty", "Building fearful hopeful prayer", "Understanding glory flows toward us"] },
  49: { quality: "Resurrection Certainty", apps: ["Living purposefully beyond life", "Preparing for accountability", "Finding hope death not final", "Making eternal perspective choices"] },
  50: { quality: "Divine Witnessing", apps: ["Removing human validation need", "Acting with private integrity", "Behaving well unobserved", "Building character from divine witness"] },
  51: { quality: "Absolute Reality", apps: ["Grounding in ultimate truth", "Releasing temporary illusions", "Anchoring identity in divine truth", "Building on ultimate reality"] },
  52: { quality: "Complete Trust in Trustee", apps: ["Releasing outcomes completely", "Surrendering results after action", "Practicing tawakkul", "Finding peace through reliance"] },
  53: { quality: "Absolute Power", apps: ["Drawing divine strength", "Facing enemies with backing", "Accessing courage divinely", "Overcoming weakness divinely"] },
  54: { quality: "Unwavering Foundation", apps: ["Building on unshakeable ground", "Finding stability amid chaos", "Creating internal firmness", "Grounding identity divinely"] },
  55: { quality: "Protective Closeness", apps: ["Experiencing intimate alliance", "Finding loyal friendship", "Moving closer to friend", "Building friendship through closeness"] },
  56: { quality: "Divine Praiseworthiness", apps: ["Enriching gratitude meaning", "Saying Alhamdulillah fully", "Practicing praise spiritually", "Making gratitude constant"] },
  57: { quality: "Perfect Enumeration", apps: ["Trusting small deeds counted", "Continuing knowing count matters", "Building sincerity through counting", "Persisting in small goodness"] },
  58: { quality: "Unique Origination", apps: ["Marveling at creation", "Strengthening faith through proof", "Appreciating divine uniqueness", "Wondering at creation"] },
  59: { quality: "Certainty of Restoration", apps: ["Believing resurrection guaranteed", "Living urgently", "Making meaningful choices", "Preparing seriously"] },
  60: { quality: "Spiritual Revival", apps: ["Seeking dormant heart revival", "Asking for awakening", "Moving from deadness to aliveness", "Pursuing spiritual rebirth"] },
  61: { quality: "Appointed Mortality", apps: ["Accepting divine appointment", "Finding urgency through mortality", "Making aware choices", "Living intentionally finite"] },
  62: { quality: "Eternal Aliveness", apps: ["Grounding in eternally living", "Experiencing present divine", "Building with living reality", "Anchoring eternal presence"] },
  63: { quality: "Continuous Sustenance", apps: ["Aware of moment-sustaining", "Grateful at each breath", "Understanding continuous grace", "Appreciating sustained miracle"] },
  64: { quality: "Divine Perception", apps: ["Aware of being fully known", "Releasing pretense", "Accepting divine understanding", "Moving toward authenticity"] },
  65: { quality: "Infinite Nobility", apps: ["Aspiring to nobility", "Understanding generous nobility", "Combining majesty with generosity", "Building noble character"] },
  66: { quality: "Absolute Singularity", apps: ["Releasing multiple dependencies", "Directing toward One", "Unifying allegiances", "Orienting toward divine"] },
  67: { quality: "Incomparable Uniqueness", apps: ["Grasping monotheism deeply", "Eliminating comparison", "Understanding divine uniqueness", "Building absolute faith"] },
  68: { quality: "Self-Sufficiency", apps: ["Stopping at source", "Releasing human dependence", "Directing needs directly", "Building divine independence"] },
  69: { quality: "Absolute Capability", apps: ["Believing all possible", "Asking boldly", "Releasing impossible despair", "Trusting divine ability"] },
  70: { quality: "Precise Execution", apps: ["Trusting perfect plans", "Releasing detailed control", "Watching precision manifest", "Observing impossible execution"] },
  71: { quality: "Divine Expedition", apps: ["Receiving early blessings", "Recognizing premature wisdom", "Noticing early provision", "Appreciating early blessings"] },
  72: { quality: "Divine Delays as Mercy", apps: ["Trusting delay wisdom", "Waiting without despair", "Accepting late timing perfectly", "Finding delayed wisdom"] },
  73: { quality: "Eternal Precedence", apps: ["Grounding in precedent divine", "Understanding ultimate origin", "Building eternal certainty", "Anchoring pre-eternal faith"] },
  74: { quality: "Eternal Continuance", apps: ["Finding eternal comfort", "Preparing eternal meeting", "Understanding eternal horizon", "Making eternal choices"] },
  75: { quality: "Clear Revelation", apps: ["Reading creation proclamation", "Seeing life signs", "Moving from doubt to certainty", "Building evidence faith"] },
  76: { quality: "Hidden Intimacy", apps: ["Recognizing hidden closeness", "Discovering divine mystery", "Moving beyond perception", "Building unseen relationship"] },
  77: { quality: "Divine Governance", apps: ["Trusting divine rule", "Reducing world anxiety", "Accepting just governance", "Finding divine peace"] },
  78: { quality: "Transcendent Exaltation", apps: ["Releasing limited concepts", "Embracing divine mystery", "Accepting incomprehensibility", "Building beyond-understanding faith"] },
  79: { quality: "Boundless Goodness", apps: ["Expanding goodness expectation", "Recognizing universal goodness", "Witnessing equal rain", "Practicing universal gratitude"] },
  80: { quality: "Continuous Tawbah Acceptance", apps: ["Returning infinitely", "Believing never-closing repentance", "Releasing permanent rejection fear", "Moving from wallowing to action"] },
  81: { quality: "Certain Divine Retribution", apps: ["Trusting justice for oppressors", "Releasing revenge", "Waiting patient justice", "Believing guaranteed justice"] },
  82: { quality: "Complete Sin Erasure", apps: ["Experiencing total liberation", "Believing utter erasure", "Releasing shame hold", "Starting clean slate"] },
  83: { quality: "Tender Divine Compassion", apps: ["Experiencing divine gentleness", "Showing vulnerability tenderness", "Receiving weakness care", "Building divine compassion"] },
  84: { quality: "Divine Sovereignty Distribution", apps: ["Understanding temporary power", "Not clinging authority", "Accepting power transitions", "Seeking divine elevation"] },
  85: { quality: "Majesty with Bounty", apps: ["Approaching awe-bold hopeful", "Combining reverence with asking", "Balancing fear and dua confidence", "Building respectful-hopeful prayer"] },
  86: { quality: "Perfect Impartiality", apps: ["Trusting divine beyond corruption", "Becoming fair", "Believing perfect service", "Releasing vindication burden"] },
  87: { quality: "Ultimate Assembly", apps: ["Believing gathering for reckoning", "Preparing seriously", "Finding righteous reunion comfort", "Making judgment day choices"] },
  88: { quality: "Divine Self-Sufficiency", apps: ["Understanding worship enriches you", "Moving transactional to transformational", "Shifting self-serving to sincere", "Deepening proper-understanding worship"] },
  89: { quality: "Beyond-Material Enrichment", apps: ["Recognizing heart soul enrichment", "Finding beyond-account wealth", "Seeking relationship spirit enrichment", "Moving beyond money-worldview"] },
  90: { quality: "Wisdom in Refusal", apps: ["Trusting withheld protection", "Accepting merciful no", "Finding unanswered wisdom", "Releasing divine-refusal resentment"] },
  91: { quality: "Purpose in Hardship", apps: ["Understanding difficulty curriculum", "Learning not just suffering", "Finding challenge growth", "Extracting adversity wisdom"] },
  92: { quality: "Universal Benefit Source", apps: ["Sourcing exclusively divine", "Removing human help anxiety", "Understanding divine benefit trace", "Building divine trust"] },
  93: { quality: "Spiritual Illumination", apps: ["Seeking guidance", "Finding darkness light", "Turning toward divine", "Allowing clarity seeking"] },
  94: { quality: "Active Divine Guidance", apps: ["Sincerely seeking", "Receiving through receptivity", "Walking guided path", "Asking directional wisdom"] },
  95: { quality: "Creative Originality", apps: ["Reflecting divine creativity", "Creating without fear", "Developing unique talents", "Celebrating human originality"] },
  96: { quality: "Eternal Endurance", apps: ["Investing eternal", "Building forever-lasting", "Releasing passing attachment", "Making eternally significant choices"] },
  97: { quality: "Ultimate Ownership", apps: ["Understanding stewardship", "Giving from trust", "Releasing possession attachment", "Recognizing return to divine"] },
  98: { quality: "Perfect Right Guidance", apps: ["Surrendering to divine direction", "Trusting best outcome guidance", "Following direction over preference", "Allowing divine wisdom direction"] },
  99: { quality: "Divine Patience Model", apps: ["Learning from divine example", "Extending others patience", "Practicing forbearance discipline", "Building core patience character"]}
};

let content = fs.readFileSync('src/data/namesData.js', 'utf-8');

let count = 0;

// Replace each name's MCQ one by one
for (let n = 1; n <= 99; n++) {
  if (enhancedMCQ[n]) {
    const q = enhancedMCQ[n].quality;
    const a = enhancedMCQ[n].apps;
    const mcqNew = `mcq:[{quality:"${q}",applications:["${a[0]}","${a[1]}","${a[2]}","${a[3]}"]}]`;
    
    // Find and replace the entire mcq array for this name
    const regex = new RegExp(`(n:${n},[^}]*?)mcq:\\[[^\\]]*\\]`, 's');
    
    if (regex.test(content)) {
      content = content.replace(regex, `$1${mcqNew}`);
      count++;
    }
  }
}

fs.writeFileSync('src/data/namesData.js', content, 'utf-8');

console.log(`✅ Enhanced ${count} MCQ items with Quality-Application matching`);
