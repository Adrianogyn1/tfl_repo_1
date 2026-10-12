const SalaBase = require('./SalaBase');
const { Baralho } = require("./cartas.js");

class SalaFoottball extends SalaBase {
    constructor(nome, image = "") {
        super("foottball", nome, 20, image);
        this.banker = null;
        this.player = null;
        this.baralho = new Baralho(6,'fs'); // 6 ou 8 baralhos
    }

    async GerarResultado() {
        // reset mãos
        this.banker = null;
        this.player = null;

        let result = {
            banker: this.banker,
            player: this.player,
            vencedor: "*",
            time: new Date().toISOString()
        };

        // Player 1 carta
        this.player = this.baralho.Retirar();
        result.player = this.player;
        this.BroadcastParcial(result);
        await this.Esperar(500);

        // Banker 1 carta
        this.banker = this.baralho.Retirar();
        result.banker = this.banker;
        this.BroadcastParcial(result);
        await this.Esperar(500);

        // Totais
        let pTotal = this.player.valor;
        let bTotal = this.banker.valor;

        // decisão final
        result.vencedor = (pTotal === bTotal) ? "d" : (pTotal > bTotal ? "p" : "b");

        this.AddResultado(result); // atualiza e envia para todos
        this.PayoutBets(result);

        await this.Esperar(2000);
    }

    PayoutBets(result) {
        this.bets.forEach(c => {
            let valor = 0;

            if (result.vencedor === "b") {
                // Banker venceu → paga 2x
                valor = c.bet.banker * 2;
            }
            else if (result.vencedor === "p") {
                // Player venceu → paga 2x
                valor = c.bet.player * 2;
            }
            else if (result.vencedor === "d") {
                // Empate → devolve 50% de banker/player + Draw paga 11x
                valor = ((c.bet.banker + c.bet.player) * 0.5) + (c.bet.draw * 11);
            }

            if (valor > 0) {
                this.SendPayout(c.user, valor);
            }
        });

        // limpa apostas para próxima rodada
        this.bets = [];
    }

    GetInfo() {
        const info = super.GetInfo();
        return {
            ...info,
            game: this.game,
            nome: this.nome,
            users: this.userCount,
            status: this.status,
            image: this.image,
            history: this.history.map(n => n.vencedor).reverse().slice(0, 10)
        };
    }
}

module.exports = SalaFoottball;
