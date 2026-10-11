class Carta {
    constructor(valor, nipe, tipo = null) {
        this.val = valor;  // string da carta (ex: "A", "10", "K")
        this.valor = 0;    // valor numérico para o jogo
        this.nipe = nipe;
        this.tipo = tipo;

        if (tipo) {
            switch (tipo) {
                case 'dt': // Dragon Tiger
                    if (this.val === "A") this.valor = 1;
                    else if (this.val === "J") this.valor = 11;
                    else if (this.val === "Q") this.valor = 12;
                    else if (this.val === "K") this.valor = 13;
                    else this.valor = parseInt(this.val);
                    break;

                case 'fs': // Football Studio (A alto = 14)
                    if (this.val === "A") this.valor = 14;
                    else if (this.val === "J") this.valor = 11;
                    else if (this.val === "Q") this.valor = 12;
                    else if (this.val === "K") this.valor = 13;
                    else this.valor = parseInt(this.val);
                    break;

                case 'bj': // Blackjack
                    if (this.val === "A") this.valor = 11; // por padrão 11, ajusta depois na mão
                    else if (["K", "Q", "J"].includes(this.val)) this.valor = 10;
                    else this.valor = parseInt(this.val);
                    break;

                case 'bc': // Baccarat
                    if (this.val === "A") this.valor = 1;
                    else if (["K", "Q", "J", "10"].includes(this.val)) this.valor = 0;
                    else this.valor = parseInt(this.val);
                    break;

                default: // genérico (Dragon Tiger padrão)
                    if (this.val === "A") this.valor = 1;
                    else if (this.val === "J") this.valor = 11;
                    else if (this.val === "Q") this.valor = 12;
                    else if (this.val === "K") this.valor = 13;
                    else this.valor = parseInt(this.val);
                    break;
            }
        }
    }
}

class Baralho {
    constructor(qtd, tipo = null) {
        this.deck = [];
        this.baralhos = qtd;
        this.tipo = tipo;
        this.Embaralhar();
    }

    CriarCartas() {
        const nipes = ["♥️", "♦️", "♣️", "♠️"];
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

        for (let i = 0; i < this.baralhos; i++) {
            for (const nipe of nipes) {
                for (const valor of values) {
                    const carta = new Carta(valor, nipe, this.tipo);
                    this.deck.push(carta);
                }
            }
        }
    }

    Embaralhar() {
        this.deck = [];
        this.CriarCartas();

        // Algoritmo Fisher-Yates
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        
        //corta as cartas ?
       // let rdn = Math.round(Math.random()*this.deck.length)+(40*qtd);
      //  this.deck = this.deck.splice(0,rdn);
    }

    Retirar() {
        if(this.deck.length<=0)
       this.Embaralhar();
        
        return this.deck.shift();
    }
}

module.exports = { Carta, Baralho };
