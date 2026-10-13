// Gerador de nomes realistas e de RPG para Avatares e Salas

const FIRST_NAMES_MASC = [
  "Arthur", "Erick", "Lucas", "Gabriel", "Kael", "Dante", "Victor", "Rafael", "Thorin", "Vaelin",
  "Rodrigo", "Leandro", "Bruno", "Alan", "Gael", "Felipe", "Matheus", "Kayn", "Zane", "Rowan"
];

const FIRST_NAMES_FEM = [
  "Luna", "Aria", "Maya", "Elena", "Sophia", "Beatriz", "Clara", "Aurora", "Freya", "Lyra",
  "Isabella", "Lara", "Juliana", "Camila", "Melissa", "Diana", "Thalia", "Kira", "Nyx", "Ember"
];

const LAST_NAMES = [
  "Silva", "Vance", "Storm", "Shadow", "Nightshade", "Falcão", "Lumin", "Frost", "Silver",
  "Moraes", "Duarte", "Raven", "Blackwood", "Valente", "Ironheart", "Dorn", "Albuquerque", "Starling"
];

const ROOM_ADJECTIVES = [
  "Mística", "Aconchegante", "Moderna", "Escondida", "Secreta", "Celestial", "Sombria",
  "Dourada", "Subterrânea", "Praiana", "Flutuante", "Cyber", "Neon", "Rústica", "Imperial"
];

const ROOM_NOUNS = [
  "Mansão", "Cabana", "Vila", "Suíte", "Fortaleza", "Penthouse", "Taverna", "Refúgio",
  "Residência", "Estúdio", "Lounge", "Santuário", "Castelo", "Loft", "Observatório"
];

const ROOM_THEMES = [
  "das Estrelas", "do Horizonte", "dos Sonhos", "do Crepúsculo", "da Alvorada", "Zen",
  "Cyberpunk", "Vintage", "dos Amigos", "Tropical", "da Meia-Noite", "do Vale"
];

function generateAvatarName(gender = 1) {
  const firstList = gender === 0 ? FIRST_NAMES_FEM : FIRST_NAMES_MASC;
  const first = firstList[Math.floor(Math.random() * firstList.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function generateRoomName() {
  const noun = ROOM_NOUNS[Math.floor(Math.random() * ROOM_NOUNS.length)];
  const adjOrTheme = Math.random() > 0.5
    ? ROOM_ADJECTIVES[Math.floor(Math.random() * ROOM_ADJECTIVES.length)]
    : ROOM_THEMES[Math.floor(Math.random() * ROOM_THEMES.length)];
  return `${noun} ${adjOrTheme}`;
}

module.exports = {
  generateAvatarName,
  generateRoomName
};
