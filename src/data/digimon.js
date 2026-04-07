// ─── Digimon roster — all 10 evolution lines ──────────────────────────────────
// Each entry's evoRequires describes what the CURRENT Digimon needs to
// evolve INTO that entry — mirrors Digimon World / Cyber Sleuth criteria:
//   level  — minimum level of the current (pre-evo) Digimon
//   abi    — minimum ABI of the current Digimon
//   stats  — minimum calcStats() values the current Digimon must reach
//             (these come from base + level growth + bonus stats from tasks)
//
// Stat thresholds are set so a player completing ~3-5 tasks/day in the right
// categories reaches each stage in roughly:
//   Baby→In-Training : day 2-3       (level 3)
//   In-Training→Rookie: day 5-7      (level 6)
//   Rookie→Champion  : ~3-4 weeks    (level 10, ABI 5, ~15 category tasks)
//   Champion→Ultimate: ~2-3 months   (level 20, ABI 10, ~40 category tasks)
//   Ultimate→Mega    : ~5-6 months   (level 30, ABI 20, ~80 category tasks)
//
// Stage key: "Baby" | "In-Training" | "Rookie" | "Champion" | "Ultimate" | "Mega"
// Type key:  "Vaccine" | "Virus" | "Data" | "Free"
// Attr key:  "Fire" | "Water" | "Earth" | "Thunder" | "Plant" | "Light" | "Dark" | "Wind" | "None"

export const DIGIMON_DB = [

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED — Baby & In-Training stages appear in multiple lines
  // ══════════════════════════════════════════════════════════════════════════

  // ── Agumon origin ────────────────────────────────────────────────────────
  {
    id:"botamon", name:"Botamon", stage:"Baby", type:"Free", attr:"None",
    hp:55, sp:20, atk:18, def:20, int:15, spd:18,
    evolvesTo:["koromon","tsunomon"],
    evoRequires: null,
  },
  {
    id:"koromon", name:"Koromon", stage:"In-Training", type:"Free", attr:"None",
    hp:80, sp:32, atk:28, def:32, int:24, spd:30,
    evolvesTo:["agumon"],
    evoRequires: { level:3, abi:0, stats:{} },
  },
  // ── Gabumon In-Training (Botamon can also go here) ───────────────────────
  {
    id:"tsunomon", name:"Tsunomon", stage:"In-Training", type:"Free", attr:"None",
    hp:78, sp:30, atk:26, def:36, int:22, spd:30,
    evolvesTo:["gabumon"],
    evoRequires: { level:3, abi:0, stats:{} },
  },

  // ── Patamon shared origin ─────────────────────────────────────────────────
  {
    id:"punimon", name:"Punimon", stage:"Baby", type:"Free", attr:"None",
    hp:50, sp:20, atk:15, def:22, int:18, spd:16,
    evolvesTo:["tokomon"],
    evoRequires: null,
  },
  {
    id:"tokomon", name:"Tokomon", stage:"In-Training", type:"Free", attr:"None",
    hp:75, sp:33, atk:24, def:36, int:30, spd:28,
    evolvesTo:["patamon"],
    evoRequires: { level:3, abi:0, stats:{} },
  },

  // ── Salamon & Renamon shared origin ──────────────────────────────────────
  {
    id:"poyomon", name:"Poyomon", stage:"Baby", type:"Free", attr:"None",
    hp:48, sp:22, atk:14, def:18, int:20, spd:20,
    evolvesTo:["nyaromon"],
    evoRequires: null,
  },
  {
    id:"nyaromon", name:"Nyaromon", stage:"In-Training", type:"Free", attr:"None",
    hp:72, sp:36, atk:22, def:30, int:34, spd:34,
    evolvesTo:["salamon","renamon"],
    evoRequires: { level:3, abi:0, stats:{} },
  },

  // ── Tentomon shared origin ────────────────────────────────────────────────
  {
    id:"pabumon", name:"Pabumon", stage:"Baby", type:"Free", attr:"None",
    hp:52, sp:22, atk:16, def:20, int:22, spd:18,
    evolvesTo:["bukamon"],
    evoRequires: null,
  },
  {
    id:"bukamon", name:"Bukamon", stage:"In-Training", type:"Free", attr:"None",
    hp:78, sp:34, atk:26, def:32, int:36, spd:28,
    evolvesTo:["tentomon"],
    evoRequires: { level:3, abi:0, stats:{} },
  },

  // ── Palmon shared origin ──────────────────────────────────────────────────
  {
    id:"kuramon", name:"Kuramon", stage:"Baby", type:"Free", attr:"None",
    hp:50, sp:24, atk:14, def:18, int:24, spd:16,
    evolvesTo:["tanemon"],
    evoRequires: null,
  },
  {
    id:"tanemon", name:"Tanemon", stage:"In-Training", type:"Free", attr:"Plant",
    hp:72, sp:38, atk:20, def:28, int:36, spd:24,
    evolvesTo:["palmon"],
    evoRequires: { level:3, abi:0, stats:{} },
  },

  // ── Veemon shared origin ──────────────────────────────────────────────────
  {
    id:"viximon", name:"Viximon", stage:"Baby", type:"Free", attr:"None",
    hp:54, sp:20, atk:20, def:18, int:18, spd:22,
    evolvesTo:["chibimon"],
    evoRequires: null,
  },
  {
    id:"chibimon", name:"Chibimon", stage:"In-Training", type:"Free", attr:"None",
    hp:78, sp:30, atk:30, def:26, int:26, spd:34,
    evolvesTo:["veemon"],
    evoRequires: { level:3, abi:0, stats:{} },
  },

  // ── Guilmon shared origin ─────────────────────────────────────────────────
  {
    id:"jyarimon", name:"Jyarimon", stage:"Baby", type:"Free", attr:"None",
    hp:58, sp:18, atk:22, def:18, int:14, spd:20,
    evolvesTo:["gigimon"],
    evoRequires: null,
  },
  {
    id:"gigimon", name:"Gigimon", stage:"In-Training", type:"Free", attr:"None",
    hp:85, sp:30, atk:36, def:28, int:22, spd:32,
    evolvesTo:["guilmon"],
    evoRequires: { level:3, abi:0, stats:{} },
  },

  // ── Lopmon shared origin ──────────────────────────────────────────────────
  {
    id:"pagumon", name:"Pagumon", stage:"Baby", type:"Free", attr:"None",
    hp:52, sp:20, atk:16, def:24, int:18, spd:18,
    evolvesTo:["lopmon_it"],
    evoRequires: null,
  },
  {
    // Lopmon at In-Training stage — same name, different stage
    id:"lopmon_it", name:"Lopmon", stage:"In-Training", type:"Free", attr:"None",
    hp:78, sp:30, atk:26, def:38, int:28, spd:26,
    evolvesTo:["lopmon"],
    evoRequires: { level:3, abi:0, stats:{} },
    spriteId:"lopmon", // share sprites with Champion Lopmon
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 1 — Agumon / Fire Dragon
  // ATK + HP focused. Completing ATK tasks and HP tasks drives this line.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"agumon", name:"Agumon", stage:"Rookie", type:"Vaccine", attr:"Fire",
    hp:100, sp:50, atk:55, def:45, int:35, spd:50,
    evolvesTo:["greymon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"greymon", name:"Greymon", stage:"Champion", type:"Vaccine", attr:"Fire",
    hp:162, sp:72, atk:92, def:74, int:56, spd:78,
    evolvesTo:["metalgreymon"],
    // Requires ATK tasks + HP tasks to meet thresholds
    evoRequires: { level:10, abi:5, stats:{ ATK:80, HP:155 } },
  },
  {
    id:"metalgreymon", name:"MetalGreymon", stage:"Ultimate", type:"Vaccine", attr:"Fire",
    hp:234, sp:102, atk:142, def:112, int:90, spd:110,
    evolvesTo:["wargreymon"],
    evoRequires: { level:20, abi:5, stats:{ ATK:140, HP:240 } },
  },
  {
    id:"wargreymon", name:"WarGreymon", stage:"Mega", type:"Vaccine", attr:"Fire",
    hp:315, sp:134, atk:202, def:162, int:130, spd:155,
    evolvesTo:[],
    evoRequires: { level:30, abi:15, stats:{ ATK:205, HP:340 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 2 — Patamon / Holy Wind
  // HP + DEF focused. Completing HP and DEF tasks drives this line.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"patamon", name:"Patamon", stage:"Rookie", type:"Vaccine", attr:"Wind",
    hp:102, sp:56, atk:44, def:52, int:56, spd:54,
    evolvesTo:["angemon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"angemon", name:"Angemon", stage:"Champion", type:"Vaccine", attr:"Light",
    hp:160, sp:82, atk:72, def:84, int:88, spd:82,
    evolvesTo:["magnaangemon"],
    evoRequires: { level:10, abi:5, stats:{ HP:160, DEF:75 } },
  },
  {
    id:"magnaangemon", name:"MagnaAngemon", stage:"Ultimate", type:"Vaccine", attr:"Light",
    hp:228, sp:114, atk:112, def:124, int:132, spd:124,
    evolvesTo:["seraphimon"],
    evoRequires: { level:20, abi:5, stats:{ HP:255, DEF:130 } },
  },
  {
    id:"seraphimon", name:"Seraphimon", stage:"Mega", type:"Vaccine", attr:"Light",
    hp:308, sp:150, atk:162, def:178, int:188, spd:172,
    evolvesTo:[],
    evoRequires: { level:30, abi:15, stats:{ HP:370, DEF:195 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 3 — Salamon / Holy Maiden
  // DEF + INT focused. DEF and INT tasks. Branches at Mega.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"salamon", name:"Salamon", stage:"Rookie", type:"Vaccine", attr:"Light",
    hp:112, sp:52, atk:40, def:56, int:52, spd:46,
    evolvesTo:["tailmon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"tailmon", name:"Tailmon", stage:"Champion", type:"Vaccine", attr:"Light",
    hp:164, sp:78, atk:68, def:92, int:82, spd:78,
    evolvesTo:["angewomon"],
    evoRequires: { level:10, abi:5, stats:{ DEF:80, INT:75 } },
  },
  {
    id:"angewomon", name:"Angewomon", stage:"Ultimate", type:"Vaccine", attr:"Light",
    hp:230, sp:112, atk:108, def:138, int:128, spd:118,
    evolvesTo:["magnadramon","ophanimon"],
    evoRequires: { level:20, abi:5, stats:{ DEF:145, INT:130 } },
  },
  {
    id:"magnadramon", name:"Magnadramon", stage:"Mega", type:"Vaccine", attr:"Light",
    hp:316, sp:148, atk:158, def:195, int:178, spd:158,
    evolvesTo:[],
    // More DEF-heavy path
    evoRequires: { level:30, abi:15, stats:{ DEF:220, HP:365 } },
  },
  {
    id:"ophanimon", name:"Ophanimon", stage:"Mega", type:"Vaccine", attr:"Light",
    hp:305, sp:158, atk:148, def:188, int:195, spd:152,
    evolvesTo:[],
    // More INT-heavy path
    evoRequires: { level:30, abi:15, stats:{ INT:215, DEF:200 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 4 — Gabumon / Ice Wolf
  // DEF + SPD focused. Shares Botamon/Koromon with Agumon line.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"gabumon", name:"Gabumon", stage:"Rookie", type:"Vaccine", attr:"Earth",
    hp:100, sp:50, atk:48, def:58, int:40, spd:46,
    evolvesTo:["garurumon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"garurumon", name:"Garurumon", stage:"Champion", type:"Vaccine", attr:"Earth",
    hp:158, sp:76, atk:82, def:94, int:62, spd:82,
    evolvesTo:["weregarurumon"],
    evoRequires: { level:10, abi:5, stats:{ DEF:84, SPD:75 } },
  },
  {
    id:"weregarurumon", name:"WereGarurumon", stage:"Ultimate", type:"Vaccine", attr:"Earth",
    hp:226, sp:108, atk:128, def:136, int:96, spd:132,
    evolvesTo:["metalgarurumon"],
    evoRequires: { level:20, abi:5, stats:{ DEF:148, SPD:135 } },
  },
  {
    id:"metalgarurumon", name:"MetalGarurumon", stage:"Mega", type:"Vaccine", attr:"Earth",
    hp:306, sp:142, atk:186, def:194, int:142, spd:190,
    evolvesTo:[],
    evoRequires: { level:30, abi:15, stats:{ DEF:210, SPD:200 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 5 — Tentomon / Thunder Insect
  // INT + ATK focused. INT and ATK tasks drive this line.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"tentomon", name:"Tentomon", stage:"Rookie", type:"Vaccine", attr:"Thunder",
    hp:106, sp:52, atk:50, def:46, int:62, spd:46,
    evolvesTo:["kabuterimon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"kabuterimon", name:"Kabuterimon", stage:"Champion", type:"Vaccine", attr:"Thunder",
    hp:168, sp:76, atk:88, def:76, int:98, spd:66,
    evolvesTo:["megakabuterimon"],
    evoRequires: { level:10, abi:5, stats:{ INT:88, ATK:80 } },
  },
  {
    id:"megakabuterimon", name:"MegaKabuterimon", stage:"Ultimate", type:"Vaccine", attr:"Thunder",
    hp:240, sp:108, atk:134, def:118, int:148, spd:102,
    evolvesTo:["herculeskabuterimon"],
    evoRequires: { level:20, abi:5, stats:{ INT:152, ATK:136 } },
  },
  {
    id:"herculeskabuterimon", name:"HerculesKabuterimon", stage:"Mega", type:"Vaccine", attr:"Thunder",
    hp:320, sp:144, atk:192, def:168, int:208, spd:148,
    evolvesTo:[],
    evoRequires: { level:30, abi:15, stats:{ INT:220, ATK:200 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 6 — Palmon / Plant
  // SP + INT focused. SP (mindfulness/learning) and INT tasks drive this line.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"palmon", name:"Palmon", stage:"Rookie", type:"Data", attr:"Plant",
    hp:96, sp:62, atk:44, def:50, int:56, spd:40,
    evolvesTo:["togemon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"togemon", name:"Togemon", stage:"Champion", type:"Data", attr:"Plant",
    hp:154, sp:88, atk:78, def:82, int:88, spd:58,
    evolvesTo:["lillymon"],
    evoRequires: { level:10, abi:5, stats:{ SP:80, INT:82 } },
  },
  {
    id:"lillymon", name:"Lillymon", stage:"Ultimate", type:"Data", attr:"Plant",
    hp:218, sp:122, atk:120, def:120, int:132, spd:94,
    evolvesTo:["rosemon"],
    evoRequires: { level:20, abi:5, stats:{ SP:135, INT:138 } },
  },
  {
    id:"rosemon", name:"Rosemon", stage:"Mega", type:"Data", attr:"Plant",
    hp:295, sp:158, atk:172, def:170, int:190, spd:135,
    evolvesTo:[],
    evoRequires: { level:30, abi:15, stats:{ SP:200, INT:210 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 7 — Veemon / Dragon Man
  // ATK + SPD focused. Fast-paced tasks (SPD) and physical (ATK) drive this.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"veemon", name:"Veemon", stage:"Rookie", type:"Vaccine", attr:"Earth",
    hp:106, sp:46, atk:62, def:44, int:40, spd:62,
    evolvesTo:["exveemon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"exveemon", name:"ExVeemon", stage:"Champion", type:"Vaccine", attr:"Fire",
    hp:168, sp:66, atk:102, def:72, int:64, spd:98,
    evolvesTo:["aeroveedramon"],
    evoRequires: { level:10, abi:5, stats:{ ATK:92, SPD:88 } },
  },
  {
    id:"aeroveedramon", name:"AeroVeedramon", stage:"Ultimate", type:"Vaccine", attr:"Wind",
    hp:235, sp:98, atk:154, def:112, int:98, spd:148,
    evolvesTo:["ulforceveedramon"],
    evoRequires: { level:20, abi:5, stats:{ ATK:160, SPD:152 } },
  },
  {
    id:"ulforceveedramon", name:"UlforceVeedramon", stage:"Mega", type:"Vaccine", attr:"Light",
    hp:315, sp:134, atk:214, def:164, int:144, spd:210,
    evolvesTo:[],
    evoRequires: { level:30, abi:15, stats:{ ATK:225, SPD:225 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 8 — Guilmon / Dragon Virus
  // ATK heavy. Pure offensive — ATK tasks mainly.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"guilmon", name:"Guilmon", stage:"Rookie", type:"Virus", attr:"Fire",
    hp:112, sp:44, atk:66, def:40, int:30, spd:56,
    evolvesTo:["growlmon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"growlmon", name:"Growlmon", stage:"Champion", type:"Virus", attr:"Fire",
    hp:174, sp:64, atk:108, def:68, int:50, spd:84,
    evolvesTo:["megagargomon"],
    evoRequires: { level:10, abi:5, stats:{ ATK:100 } },
  },
  {
    id:"megagargomon", name:"MegaGargomon", stage:"Ultimate", type:"Virus", attr:"Earth",
    hp:248, sp:94, atk:160, def:108, int:80, spd:118,
    evolvesTo:["gallantmon"],
    evoRequires: { level:20, abi:5, stats:{ ATK:168, HP:255 } },
  },
  {
    id:"gallantmon", name:"Gallantmon", stage:"Mega", type:"Virus", attr:"Light",
    hp:328, sp:128, atk:225, def:158, int:125, spd:145,
    evolvesTo:[],
    evoRequires: { level:30, abi:15, stats:{ ATK:240, HP:380 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 9 — Lopmon / Earth Guardian
  // DEF + HP focused. Skips Rookie — Pagumon→Lopmon(IT)→Lopmon(Champion).
  // ══════════════════════════════════════════════════════════════════════════
  {
    // Champion Lopmon — same name as In-Training but distinct stage
    id:"lopmon", name:"Lopmon", stage:"Champion", type:"Data", attr:"Earth",
    hp:152, sp:72, atk:68, def:94, int:66, spd:62,
    evolvesTo:["antylamon"],
    evoRequires: { level:6, abi:0, stats:{ DEF:70, HP:120 } },
  },
  {
    id:"antylamon", name:"Antylamon", stage:"Ultimate", type:"Data", attr:"Earth",
    hp:220, sp:104, atk:108, def:144, int:102, spd:92,
    evolvesTo:["cherubimon"],
    evoRequires: { level:18, abi:5, stats:{ DEF:160, HP:240 } },
  },
  {
    id:"cherubimon", name:"Cherubimon (Virtue)", stage:"Mega", type:"Vaccine", attr:"Fire",
    hp:300, sp:138, atk:188, def:200, int:148, spd:148,
    evolvesTo:[],
    evoRequires: { level:28, abi:15, stats:{ DEF:222, HP:355 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LINE 10 — Renamon / Fox Mystic
  // INT + SPD focused. Shares Poyomon/Nyaromon with Salamon line.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"renamon", name:"Renamon", stage:"Rookie", type:"Data", attr:"Earth",
    hp:96, sp:56, atk:50, def:44, int:62, spd:62,
    evolvesTo:["kyubimon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"kyubimon", name:"Kyubimon", stage:"Champion", type:"Data", attr:"Fire",
    hp:152, sp:82, atk:80, def:72, int:98, spd:92,
    evolvesTo:["taomon"],
    evoRequires: { level:10, abi:5, stats:{ INT:90, SPD:84 } },
  },
  {
    id:"taomon", name:"Taomon", stage:"Ultimate", type:"Data", attr:"Light",
    hp:220, sp:114, atk:122, def:108, int:148, spd:132,
    evolvesTo:["sakuyamon"],
    evoRequires: { level:20, abi:5, stats:{ INT:158, SPD:138 } },
  },
  {
    id:"sakuyamon", name:"Sakuyamon", stage:"Mega", type:"Data", attr:"Earth",
    hp:295, sp:150, atk:172, def:154, int:210, spd:188,
    evolvesTo:[],
    evoRequires: { level:30, abi:15, stats:{ INT:230, SPD:205 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEGACY / FUSION — kept for backward compatibility
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:"wargrowlmon", name:"WarGrowlmon", stage:"Ultimate", type:"Virus", attr:"Fire",
    hp:242, sp:96, atk:156, def:106, int:86, spd:112,
    evolvesTo:["gallantmon"],
    evoRequires: { level:20, abi:5, stats:{ ATK:165 } },
  },
  {
    id:"omnimon", name:"Omnimon", stage:"Mega", type:"Vaccine", attr:"Neutral",
    hp:385, sp:154, atk:234, def:198, int:178, spd:182,
    evolvesTo:[], fusionOf:["wargreymon","metalgarurumon"],
    evoRequires: { level:30, abi:30, stats:{ ATK:240, DEF:210 } },
  },
  // Coronamon line (kept, not one of the 10 starter lines)
  {
    id:"coronamon", name:"Coronamon", stage:"Rookie", type:"Vaccine", attr:"Fire",
    hp:96, sp:56, atk:52, def:42, int:48, spd:58,
    evolvesTo:["firamon"],
    evoRequires: { level:6, abi:1, stats:{} },
  },
  {
    id:"firamon", name:"Firamon", stage:"Champion", type:"Vaccine", attr:"Fire",
    hp:152, sp:82, atk:90, def:70, int:72, spd:86,
    evolvesTo:["flaremon"],
    evoRequires: { level:10, abi:5, stats:{ ATK:82 } },
  },
  {
    id:"flaremon", name:"Flaremon", stage:"Ultimate", type:"Vaccine", attr:"Fire",
    hp:218, sp:112, atk:140, def:106, int:110, spd:122,
    evolvesTo:[],
    evoRequires: { level:20, abi:5, stats:{ ATK:145 } },
  },
];

// ── Fast lookup ───────────────────────────────────────────────────────────────
export const DIGIMON_MAP = {};
DIGIMON_DB.forEach(function(d) { DIGIMON_MAP[d.id] = d; });

// ── Starter Baby forms (one per distinct line) ───────────────────────────────
// Players pick their companion at signup; the Baby quickly evolves to Rookie.
export const STARTERS = [
  "botamon",   // → Koromon→Agumon (Fire ATK) or Tsunomon→Gabumon (Earth DEF)
  "punimon",   // → Tokomon→Patamon (Holy HP/DEF)
  "poyomon",   // → Nyaromon→Salamon (Holy) or →Renamon (Fox INT/SPD)
  "pabumon",   // → Bukamon→Tentomon (Thunder INT/ATK)
  "kuramon",   // → Tanemon→Palmon (Plant SP/INT)
  "viximon",   // → Chibimon→Veemon (Dragon ATK/SPD)
  "jyarimon",  // → Gigimon→Guilmon (Dragon Virus ATK)
  "pagumon",   // → Lopmon→Antylamon→Cherubimon (Earth DEF/HP)
];
