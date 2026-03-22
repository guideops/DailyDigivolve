// ─── Digimon roster ───────────────────────────────────────────────────────────
// Single source of truth for all Digimon species data.
// Used by: web app, future mobile app, future API validation layer.

export const DIGIMON_DB = [
  // Agumon line
  { id:"koromon",       name:"Koromon",        stage:"Baby",     type:"Free",    attr:"None",   hp:80,  sp:40,  atk:30,  def:30,  int:20,  spd:30,  evolvesTo:["agumon","gabumon"] },
  { id:"agumon",        name:"Agumon",          stage:"Rookie",   type:"Vaccine", attr:"Fire",   hp:100, sp:50,  atk:55,  def:45,  int:35,  spd:50,  evolvesTo:["greymon","tyranomon"] },
  { id:"greymon",       name:"Greymon",         stage:"Champion", type:"Vaccine", attr:"Fire",   hp:160, sp:70,  atk:90,  def:75,  int:55,  spd:65,  evolvesTo:["metalgreymon"] },
  { id:"metalgreymon",  name:"MetalGreymon",    stage:"Ultimate", type:"Vaccine", attr:"Fire",   hp:230, sp:100, atk:140, def:110, int:90,  spd:95,  evolvesTo:["wargreymon"] },
  { id:"wargreymon",    name:"WarGreymon",       stage:"Mega",     type:"Vaccine", attr:"Fire",   hp:310, sp:130, atk:200, def:160, int:130, spd:145, evolvesTo:["omnimon"] },
  // Agumon X line
  { id:"agumon_x",      name:"Agumon X",         stage:"Rookie",   type:"Vaccine", attr:"Fire",   hp:110, sp:55,  atk:61,  def:50,  int:39,  spd:55,  evolvesTo:["greymon_x"],      isX:true },
  { id:"greymon_x",     name:"Greymon X",        stage:"Champion", type:"Vaccine", attr:"Fire",   hp:176, sp:77,  atk:99,  def:83,  int:61,  spd:72,  evolvesTo:["metalgreymon_x"], isX:true },
  { id:"metalgreymon_x",name:"MetalGreymon X",   stage:"Ultimate", type:"Vaccine", attr:"Fire",   hp:253, sp:110, atk:154, def:121, int:99,  spd:105, evolvesTo:["wargreymon_x"],   isX:true },
  { id:"wargreymon_x",  name:"WarGreymon X",      stage:"Mega",     type:"Vaccine", attr:"Fire",   hp:341, sp:143, atk:220, def:176, int:143, spd:160, evolvesTo:[],                 isX:true },
  // Gabumon line
  { id:"gabumon",       name:"Gabumon",          stage:"Rookie",   type:"Vaccine", attr:"Earth",  hp:100, sp:50,  atk:50,  def:55,  int:40,  spd:45,  evolvesTo:["garurumon"] },
  { id:"garurumon",     name:"Garurumon",        stage:"Champion", type:"Vaccine", attr:"Earth",  hp:155, sp:75,  atk:85,  def:90,  int:60,  spd:80,  evolvesTo:["weregarurumon"] },
  { id:"weregarurumon", name:"WereGarurumon",    stage:"Ultimate", type:"Vaccine", attr:"Earth",  hp:220, sp:105, atk:130, def:125, int:95,  spd:130, evolvesTo:["metalgarurumon","cresgaru"] },
  { id:"metalgarurumon",name:"MetalGarurumon",   stage:"Mega",     type:"Vaccine", attr:"Earth",  hp:300, sp:130, atk:185, def:175, int:140, spd:160, evolvesTo:["omnimon"] },
  { id:"cresgaru",      name:"CresGarurumon",    stage:"Mega",     type:"Vaccine", attr:"Earth",  hp:295, sp:135, atk:190, def:170, int:145, spd:170, evolvesTo:[] },
  // Guilmon line
  { id:"guilmon",       name:"Guilmon",          stage:"Rookie",   type:"Virus",   attr:"Fire",   hp:110, sp:45,  atk:65,  def:40,  int:30,  spd:55,  evolvesTo:["growlmon"] },
  { id:"growlmon",      name:"Growlmon",         stage:"Champion", type:"Virus",   attr:"Fire",   hp:170, sp:65,  atk:105, def:70,  int:50,  spd:80,  evolvesTo:["wargrowlmon"] },
  { id:"wargrowlmon",   name:"WarGrowlmon",      stage:"Ultimate", type:"Virus",   attr:"Fire",   hp:240, sp:95,  atk:155, def:105, int:85,  spd:110, evolvesTo:["gallantmon"] },
  { id:"gallantmon",    name:"Gallantmon",       stage:"Mega",     type:"Virus",   attr:"Light",  hp:320, sp:125, atk:195, def:155, int:125, spd:135, evolvesTo:[] },
  // Fusion/DNA
  { id:"omnimon",       name:"Omnimon",          stage:"Mega",     type:"Vaccine", attr:"Neutral",hp:380, sp:150, atk:230, def:195, int:175, spd:180, evolvesTo:[], fusionOf:["wargreymon","metalgarurumon"] },
  { id:"omnimon_x",     name:"Omnimon X",         stage:"Mega",     type:"Vaccine", attr:"Neutral",hp:418, sp:165, atk:253, def:215, int:193, spd:198, evolvesTo:[], isX:true, fusionOf:["wargreymon_x","metalgarurumon"] },
  // Coronamon line
  { id:"coronamon",     name:"Coronamon",        stage:"Rookie",   type:"Vaccine", attr:"Fire",   hp:95,  sp:55,  atk:52,  def:42,  int:48,  spd:58,  evolvesTo:["firamon"] },
  { id:"firamon",       name:"Firamon",          stage:"Champion", type:"Vaccine", attr:"Fire",   hp:150, sp:80,  atk:88,  def:70,  int:72,  spd:85,  evolvesTo:["flaremon"] },
  { id:"flaremon",      name:"Flaremon",         stage:"Ultimate", type:"Vaccine", attr:"Fire",   hp:215, sp:110, atk:138, def:105, int:108, spd:120, evolvesTo:["apollomon"] },
  { id:"apollomon",     name:"Apollomon",        stage:"Mega",     type:"Vaccine", attr:"Fire",   hp:295, sp:140, atk:192, def:150, int:155, spd:165, evolvesTo:["gracenovamon"] },
  { id:"gracenovamon",  name:"GraceNovamon",     stage:"Mega",     type:"Vaccine", attr:"Light",  hp:360, sp:155, atk:225, def:185, int:180, spd:178, evolvesTo:[], fusionOf:["apollomon","dianamon"] },
  // Palmon line
  { id:"palmon",        name:"Palmon",           stage:"Rookie",   type:"Data",    attr:"Plant",  hp:95,  sp:60,  atk:45,  def:50,  int:55,  spd:40,  evolvesTo:["togemon"] },
  { id:"togemon",       name:"Togemon",          stage:"Champion", type:"Data",    attr:"Plant",  hp:150, sp:85,  atk:80,  def:85,  int:75,  spd:55,  evolvesTo:["lillymon"] },
  { id:"lillymon",      name:"Lillymon",         stage:"Ultimate", type:"Data",    attr:"Plant",  hp:210, sp:115, atk:125, def:115, int:115, spd:90,  evolvesTo:["rosemon"] },
  { id:"rosemon",       name:"Rosemon",          stage:"Mega",     type:"Data",    attr:"Plant",  hp:285, sp:145, atk:178, def:160, int:168, spd:130, evolvesTo:[] },
  // BlitzGreymon line
  { id:"blitzgreymon",  name:"BlitzGreymon",     stage:"Mega",     type:"Vaccine", attr:"Thunder",hp:305, sp:130, atk:195, def:155, int:155, spd:170, evolvesTo:["omnimon_alts"] },
  { id:"omnimon_alts",  name:"Omnimon Alter-S",  stage:"Mega",     type:"Vaccine", attr:"Neutral",hp:390, sp:155, atk:235, def:200, int:185, spd:190, evolvesTo:[], fusionOf:["blitzgreymon","cresgaru"] },
];

// Fast lookup map — use this instead of .find() everywhere
export const DIGIMON_MAP = {};
DIGIMON_DB.forEach(function(d) { DIGIMON_MAP[d.id] = d; });

export const STARTERS = ["agumon", "gabumon", "guilmon", "palmon", "coronamon"];
