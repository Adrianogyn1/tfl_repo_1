class NumInfo {
  static numerosPretos = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
  static numerosVermelhos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  static numeros = [
    0, 32, 15, 19, 4, 21, 2, 25,
    17, 34, 6, 27, 13, 36, 11, 30,
    8, 23, 10, 5, 24, 16, 33, 1,
    20, 14, 31, 9, 22, 18, 29, 7,
    28, 12, 35, 3, 26
  ];
  static voisins = [25, 2, 21, 4, 19, 28, 7, 29, 18, 22];
  static tiers = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
  static orphelins = [1, 20, 14, 31, 9, 6, 34, 17];

  constructor(numero) {
    this.numero = numero;

    if (numero === 0) {
      this.color = "green";
      this.region = "Vizinhos";
      this.imparPar = "Zero";
    } else {
      this.color = NumInfo.numerosVermelhos.includes(numero) ? "red" : "black";
      this.dezena = numero < 13 ? 1 : numero < 25 ? 2 : 3;
      this.coluna = numero % 3 === 1 ? 1 : numero % 3 === 2 ? 2 : 3;
      this.imparPar = numero % 2 === 0 ? "Par" : "Impar";
      this.region = this.Region(numero);
    }

    this.terminal = this.getTerminal(numero);
    this.index = NumInfo.numeros.indexOf(numero);
  }

  getTerminal(n) {
    let s = n.toString();
    if (s.length > 1) s = s.substring(0, s.length - 1);
    return parseInt(s) || 0;
  }

  Region(numero) {
    if (NumInfo.voisins.includes(numero)) return "Voisins";
    else if (NumInfo.tiers.includes(numero)) return "Tier";
    else if (NumInfo.orphelins.includes(numero)) return "Orphelins";
    return "Vizinhos";
  }

  getColor() {
    return this.color;
  }
}

module.exports = NumInfo;

/*
// --- exemplo de uso ---
function spin() {
  let numero = Math.floor(Math.random() * 37);
  let n = new NumInfo(numero);

  console.log("🎲 Número:", n.numero);
  console.log("🎨 Cor:", n.color);
  console.log("📍 Região:", n.region);
  console.log("↔️ Par/Ímpar:", n.imparPar);
  console.log("🔟 Dezena:", n.dezena || "—");
  console.log("📊 Coluna:", n.coluna || "—");
  console.log("🎯 Terminal:", n.terminal);
  console.log("---------------------------");
}

// rodar 5 giros
for (let i = 0; i < 5; i++) {
  spin();
}
*/