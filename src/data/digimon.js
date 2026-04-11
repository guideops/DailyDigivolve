// ─── Digimon roster ───────────────────────────────────────────────────────────
// Each entry now includes:
//   role:      battle role (Striker / Guardian / Tactician / Support / Vanguard / Balanced)
//   passive:   always-on trait
//   signature: memorable special mechanic
//   crestReq:  { primary, secondary } — ideal crest alignment to evolve INTO this form

export const DIGIMON_DB = [

  // ── In-Training ──────────────────────────────────────────────────────────────
  { id:"koromon",  name:"Koromon",  stage:"In-Training", type:"Free", attr:"None",
    hp:80,  sp:40, atk:30, def:30, int:20, spd:30,
    role:"Balanced", passive:"Adaptable — no penalties in any mode", signature:"Bubble Blow — light AoE poke",
    evolvesTo:["agumon"] },

  { id:"tsunomon", name:"Tsunomon", stage:"In-Training", type:"Free", attr:"None",
    hp:75,  sp:40, atk:28, def:32, int:22, spd:28,
    role:"Balanced", passive:"Hard Shell — Guard +5%", signature:"Bubble Blow — light AoE poke",
    evolvesTo:["gabumon"] },

  { id:"gigimon",  name:"Gigimon",  stage:"In-Training", type:"Free", attr:"None",
    hp:85,  sp:38, atk:34, def:28, int:18, spd:32,
    role:"Balanced", passive:"Hazard Pulse — faint Power surge at low HP", signature:"Bubble Blow — light AoE poke",
    evolvesTo:["guilmon"] },

  { id:"tanemon",  name:"Tanemon",  stage:"In-Training", type:"Free", attr:"None",
    hp:70,  sp:45, atk:22, def:30, int:28, spd:25,
    role:"Balanced", passive:"Absorb — heals 5% of damage dealt", signature:"Bubble Blow — light AoE poke",
    evolvesTo:["palmon"] },

  { id:"sunmon",   name:"Sunmon",   stage:"In-Training", type:"Free", attr:"None",
    hp:78,  sp:42, atk:26, def:28, int:30, spd:30,
    role:"Balanced", passive:"Solar Warmth — team Momentum +5%", signature:"Bubble Blow — light AoE poke",
    evolvesTo:["coronamon"] },

  // ── Agumon line ───────────────────────────────────────────────────────────────
  { id:"agumon", name:"Agumon", stage:"Rookie", type:"Vaccine", attr:"Fire",
    hp:100, sp:50, atk:55, def:45, int:35, spd:50,
    role:"Balanced",
    passive:"Adapt — no role penalty, fits any team composition",
    signature:"Pepper Breath Combo — 20% chance to strike twice per turn",
    evolvesTo:["greymon","tyranomon"] },

  { id:"greymon", name:"Greymon", stage:"Champion", type:"Vaccine", attr:"Fire",
    hp:160, sp:70, atk:90, def:75, int:55, spd:65,
    role:"Striker",
    passive:"Aggression — Power +15% on the opening attack each fight",
    signature:"Nova Blast — AoE strike hitting all enemies for 70% Power",
    crestReq:{ primary:"Courage", secondary:"Care" },
    evolvesTo:["metalgreymon"] },

  { id:"tyranomon", name:"Tyranomon", stage:"Champion", type:"Virus", attr:"Fire",
    hp:165, sp:60, atk:88, def:72, int:45, spd:60,
    role:"Striker",
    passive:"Feral Rush — first attack each turn has +10% Power",
    signature:"Fire Blast — high-damage single target ignoring 10% Guard",
    crestReq:{ primary:"Courage", secondary:"Sincerity" },
    evolvesTo:[] },

  { id:"metalgreymon", name:"MetalGreymon", stage:"Ultimate", type:"Vaccine", attr:"Fire",
    hp:230, sp:100, atk:140, def:110, int:90, spd:95,
    role:"Vanguard",
    passive:"Trident Arm — ignores 20% of enemy Guard on every hit",
    signature:"Giga Blaster — piercing missile that bypasses all shield effects",
    crestReq:{ primary:"Courage", secondary:"Reliability" },
    evolvesTo:["wargreymon"] },

  { id:"wargreymon", name:"WarGreymon", stage:"Mega", type:"Vaccine", attr:"Fire",
    hp:310, sp:130, atk:200, def:160, int:130, spd:145,
    role:"Vanguard",
    passive:"Dramon Slayer — Power +30% against Virus-type enemies",
    signature:"Terra Force — charges for one turn, then deals 180% Power on release",
    crestReq:{ primary:"Courage", secondary:"Hope" },
    evolvesTo:["omnimon"] },

  // ── Agumon X line ─────────────────────────────────────────────────────────────
  { id:"agumon_x", name:"Agumon X", stage:"Rookie", type:"Vaccine", attr:"Fire",
    hp:110, sp:55, atk:61, def:50, int:39, spd:55, isX:true,
    role:"Balanced",
    passive:"X-Adapt — no role penalty, all stats +10% vs Virus types",
    signature:"Pepper Breath X — 25% chance to strike twice",
    evolvesTo:["greymon_x"] },

  { id:"greymon_x", name:"Greymon X", stage:"Champion", type:"Vaccine", attr:"Fire",
    hp:176, sp:77, atk:99, def:83, int:61, spd:72, isX:true,
    role:"Striker",
    passive:"Pressure — reduces enemy Guard by 15% for 2 turns after hit",
    signature:"Nova Flame X — Power boosted by 30% on this form's signature move",
    crestReq:{ primary:"Courage", secondary:"Care" },
    evolvesTo:["metalgreymon_x"] },

  { id:"metalgreymon_x", name:"MetalGreymon X", stage:"Ultimate", type:"Vaccine", attr:"Fire",
    hp:253, sp:110, atk:154, def:121, int:99, spd:105, isX:true,
    role:"Vanguard",
    passive:"Chrome Digizoid — Guard +25%, immune to Guard-break effects",
    signature:"Giga Blaster X — piercing + splash, hits primary target and one adjacent enemy",
    crestReq:{ primary:"Courage", secondary:"Reliability" },
    evolvesTo:["wargreymon_x"] },

  { id:"wargreymon_x", name:"WarGreymon X", stage:"Mega", type:"Vaccine", attr:"Fire",
    hp:341, sp:143, atk:220, def:176, int:143, spd:160, isX:true,
    role:"Vanguard",
    passive:"Dramon Destroyer — Power +40% vs Virus, destroys all enemy barriers on entry",
    signature:"Black Tornado — spinning strike that ignores all Guard",
    crestReq:{ primary:"Courage", secondary:"Hope" },
    evolvesTo:[] },

  // ── Gabumon line ──────────────────────────────────────────────────────────────
  { id:"gabumon", name:"Gabumon", stage:"Rookie", type:"Vaccine", attr:"Earth",
    hp:100, sp:50, atk:50, def:55, int:40, spd:45,
    role:"Balanced",
    passive:"Pelt Shield — Guard +10% on the first hit taken each battle",
    signature:"Blue Blaster — Boosts own Momentum +20% on use",
    evolvesTo:["garurumon"] },

  { id:"garurumon", name:"Garurumon", stage:"Champion", type:"Vaccine", attr:"Earth",
    hp:155, sp:75, atk:85, def:90, int:60, spd:80,
    role:"Guardian",
    passive:"Pack Howl — boosts team Guard by 10% at battle start",
    signature:"Slamming Attack — reduces target's Momentum by 30% for 2 turns",
    crestReq:{ primary:"Reliability", secondary:"Friendship" },
    evolvesTo:["weregarurumon"] },

  { id:"weregarurumon", name:"WereGarurumon", stage:"Ultimate", type:"Vaccine", attr:"Earth",
    hp:220, sp:105, atk:130, def:125, int:95, spd:130,
    role:"Striker",
    passive:"Fighting Spirit — Power scales +5% for every 10% HP lost",
    signature:"Garuru Kick — 2-hit combo where both Power and Momentum feed into damage",
    crestReq:{ primary:"Courage", secondary:"Reliability" },
    evolvesTo:["metalgarurumon","cresgaru"] },

  { id:"metalgarurumon", name:"MetalGarurumon", stage:"Mega", type:"Vaccine", attr:"Earth",
    hp:300, sp:130, atk:185, def:175, int:140, spd:160,
    role:"Tactician",
    passive:"Ice Crystal — enemy Momentum reduced 25% for 2 turns on each hit",
    signature:"Metal Wolf Claw — guaranteed Focus crit, bypasses Focus resistance",
    crestReq:{ primary:"Knowledge", secondary:"Reliability" },
    evolvesTo:["omnimon"] },

  { id:"cresgaru", name:"CresGarurumon", stage:"Mega", type:"Vaccine", attr:"Earth",
    hp:295, sp:135, atk:190, def:170, int:145, spd:170,
    role:"Support",
    passive:"Crest Bond — tamer bond grants entire team +15% to all stats",
    signature:"Shining V — places a Guard barrier on the whole team for 1 turn",
    crestReq:{ primary:"Friendship", secondary:"Light" },
    evolvesTo:[] },

  // ── Guilmon line ──────────────────────────────────────────────────────────────
  { id:"guilmon", name:"Guilmon", stage:"Rookie", type:"Virus", attr:"Fire",
    hp:110, sp:45, atk:65, def:40, int:30, spd:55,
    role:"Striker",
    passive:"Hazard Gene — Power +20%, Guard -15% (high-risk, high-reward)",
    signature:"Pyro Sphere — high-Power fire burst with no Guard reduction",
    evolvesTo:["growlmon"] },

  { id:"growlmon", name:"Growlmon", stage:"Champion", type:"Virus", attr:"Fire",
    hp:170, sp:65, atk:105, def:70, int:50, spd:80,
    role:"Striker",
    passive:"Dragon Howl — reduces enemy Focus by 20% on battle start",
    signature:"Plasma Blade — high single-target damage, ignores 10% Guard",
    crestReq:{ primary:"Courage", secondary:"Sincerity" },
    evolvesTo:["wargrowlmon"] },

  { id:"wargrowlmon", name:"WarGrowlmon", stage:"Ultimate", type:"Virus", attr:"Fire",
    hp:240, sp:95, atk:155, def:105, int:85, spd:110,
    role:"Vanguard",
    passive:"Assault Mode — every 3rd attack surges to +50% Power",
    signature:"Atomic Blaster — massive AoE that hits all enemies at 90% Power",
    crestReq:{ primary:"Courage", secondary:"Hope" },
    evolvesTo:["gallantmon"] },

  { id:"gallantmon", name:"Gallantmon", stage:"Mega", type:"Virus", attr:"Light",
    hp:320, sp:125, atk:195, def:155, int:125, spd:135,
    role:"Guardian",
    passive:"Holy Knight — team Guard +20%, immune to barrier-break effects",
    signature:"Final Elysion — destroys all enemy Guard buffs and barriers, then deals heavy damage",
    crestReq:{ primary:"Sincerity", secondary:"Light" },
    evolvesTo:[] },

  // ── Fusion/DNA ────────────────────────────────────────────────────────────────
  { id:"omnimon", name:"Omnimon", stage:"Mega", type:"Vaccine", attr:"Neutral",
    hp:380, sp:150, atk:230, def:195, int:175, spd:180,
    role:"Vanguard",
    passive:"Supreme Authority — Power +40%, ignores all enemy passive effects",
    signature:"Transcendent Sword — true damage, ignores all Guard — cannot be reduced",
    crestReq:{ primary:"Courage", secondary:"Friendship" },
    evolvesTo:[], fusionOf:["wargreymon","metalgarurumon"] },

  { id:"omnimon_x", name:"Omnimon X", stage:"Mega", type:"Vaccine", attr:"Neutral",
    hp:418, sp:165, atk:253, def:215, int:193, spd:198, isX:true,
    role:"Vanguard",
    passive:"X-Factor Authority — all stats +15% above Omnimon, passive-ignore retained",
    signature:"Grey Sword X — true damage + reduces all enemy stats by 10% for 2 turns",
    crestReq:{ primary:"Courage", secondary:"Friendship" },
    evolvesTo:[], fusionOf:["wargreymon_x","metalgarurumon"] },

  // ── Coronamon line ────────────────────────────────────────────────────────────
  { id:"coronamon", name:"Coronamon", stage:"Rookie", type:"Vaccine", attr:"Fire",
    hp:95, sp:55, atk:52, def:42, int:48, spd:58,
    role:"Balanced",
    passive:"Corona Flame — Power +25% when HP drops below 30%",
    signature:"Petit Prominence — fast triple-hit attack at 40% Power each",
    evolvesTo:["firamon"] },

  { id:"firamon", name:"Firamon", stage:"Champion", type:"Vaccine", attr:"Fire",
    hp:150, sp:80, atk:88, def:70, int:72, spd:85,
    role:"Striker",
    passive:"Mane Flame — applies a Focus-damage burn to the enemy each turn",
    signature:"Prominence Beam — Power + Focus hybrid damage, benefits from both stats",
    crestReq:{ primary:"Courage", secondary:"Hope" },
    evolvesTo:["flaremon"] },

  { id:"flaremon", name:"Flaremon", stage:"Ultimate", type:"Vaccine", attr:"Fire",
    hp:215, sp:110, atk:138, def:105, int:108, spd:120,
    role:"Vanguard",
    passive:"Inextinguishable — revives once per battle at 50% HP",
    signature:"Scarlet Flame — highest single-hit Power in this line",
    crestReq:{ primary:"Courage", secondary:"Light" },
    evolvesTo:["apollomon"] },

  { id:"apollomon", name:"Apollomon", stage:"Mega", type:"Vaccine", attr:"Fire",
    hp:295, sp:140, atk:192, def:150, int:155, spd:165,
    role:"Vanguard",
    passive:"Solar Disk — boosts team Power by 15% for the first 2 turns",
    signature:"Phoebus Impact — devastating AoE that strikes twice at 60% Power each",
    crestReq:{ primary:"Hope", secondary:"Light" },
    evolvesTo:["gracenovamon"] },

  { id:"gracenovamon", name:"GraceNovamon", stage:"Mega", type:"Vaccine", attr:"Light",
    hp:360, sp:155, atk:225, def:185, int:180, spd:178,
    role:"Vanguard",
    passive:"Dual Grace — acts twice per turn at 50% Momentum each",
    signature:"Nova Grace — fusion ultimate: AoE all enemies and heals team for 20% HP",
    crestReq:{ primary:"Light", secondary:"Hope" },
    evolvesTo:[], fusionOf:["apollomon","dianamon"] },

  // ── Palmon line ───────────────────────────────────────────────────────────────
  { id:"palmon", name:"Palmon", stage:"Rookie", type:"Data", attr:"Plant",
    hp:95, sp:60, atk:45, def:50, int:55, spd:40,
    role:"Support",
    passive:"Absorb — heals 10% of damage dealt back to self",
    signature:"Poison Ivy — Focus damage + applies DoT burn for 2 turns",
    evolvesTo:["togemon"] },

  { id:"togemon", name:"Togemon", stage:"Champion", type:"Data", attr:"Plant",
    hp:150, sp:85, atk:80, def:85, int:75, spd:55,
    role:"Guardian",
    passive:"Needle Rain — deals 15% counter-damage when struck",
    signature:"Coconut Punch — reduces enemy Guard by 30% for 2 turns",
    crestReq:{ primary:"Reliability", secondary:"Friendship" },
    evolvesTo:["lillymon"] },

  { id:"lillymon", name:"Lillymon", stage:"Ultimate", type:"Data", attr:"Plant",
    hp:210, sp:115, atk:125, def:115, int:115, spd:90,
    role:"Support",
    passive:"Flower Burst — boosts team Momentum +15% at battle start",
    signature:"Flower Wreath — heals entire team for 25% of their max HP",
    crestReq:{ primary:"Care", secondary:"Friendship" },
    evolvesTo:["rosemon"] },

  { id:"rosemon", name:"Rosemon", stage:"Mega", type:"Data", attr:"Plant",
    hp:285, sp:145, atk:178, def:160, int:168, spd:130,
    role:"Tactician",
    passive:"Thorn Whip — Focus attacks gain +20% critical hit chance",
    signature:"Forbidden Temptation — massive Focus damage + confuses enemy (skip next turn)",
    crestReq:{ primary:"Sincerity", secondary:"Knowledge" },
    evolvesTo:[] },

  // ── BlitzGreymon / Alter-S ────────────────────────────────────────────────────
  { id:"blitzgreymon", name:"BlitzGreymon", stage:"Mega", type:"Vaccine", attr:"Thunder",
    hp:305, sp:130, atk:195, def:155, int:155, spd:170,
    role:"Striker",
    passive:"Thunder Drive — Momentum +30%, chain attacks trigger when Momentum threshold met",
    signature:"Trident Javelin — 3-hit lightning strike, each hit rolls Focus crit independently",
    crestReq:{ primary:"Courage", secondary:"Hope" },
    evolvesTo:["omnimon_alts"] },

  { id:"omnimon_alts", name:"Omnimon Alter-S", stage:"Mega", type:"Vaccine", attr:"Neutral",
    hp:390, sp:155, atk:235, def:200, int:185, spd:190,
    role:"Vanguard",
    passive:"Alter Power — Power scales inversely with enemy Guard (more Guard = more damage dealt)",
    signature:"Omega Blade — execution move: double damage when target is below 25% HP",
    crestReq:{ primary:"Courage", secondary:"Knowledge" },
    evolvesTo:[], fusionOf:["blitzgreymon","cresgaru"] },
];

// Fast lookup map
export const DIGIMON_MAP = {};
DIGIMON_DB.forEach(function(d) { DIGIMON_MAP[d.id] = d; });

export const STARTERS = ["agumon", "gabumon", "guilmon", "palmon", "coronamon"];
