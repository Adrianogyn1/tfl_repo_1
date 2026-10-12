const SalaBase = require('./SalaBase.js');
const { Baralho } = require("./cartas.js");

class SalaBaccarat extends SalaBase 
{
    constructor(nome, image = "") 
    {
        super("baccarat", nome, 20, image);
        this.banker = [];
        this.player = [];
        this.baralho = new Baralho(6, "bc"); // 6 ou 8 baralhos
    }
    
    async GerarResultado() {
        // reset mãos
        this.banker = [];
        this.player = [];
        
        this.RequerePayout();
        
        let result = {
            banker: this.banker,
            player: this.player,
            vencedor: "*",
            time: new Date().toISOString()
        };
        
        // Player 2 cartas
        for (let i = 0; i < 2; i++) {
            let carta = this.baralho.Retirar();
            this.player.push(carta);
            result.player = [...this.player];
            this.BroadcastParcial(result);
            await this.Esperar(500);
        }
        
        // Banker 2 cartas
        for (let i = 0; i < 2; i++) {
            let carta = this.baralho.Retirar();
            this.banker.push(carta);
            result.banker = [...this.banker];
            this.BroadcastParcial(result);
            await this.Esperar(500);
        }
        
        // calcula totais iniciais
        let pTotal = this.getTotal(this.player);
        let bTotal = this.getTotal(this.banker);
        
        // natural? (8 ou 9)
        if (pTotal < 8 && bTotal < 8) {
            // Player compra 3ª carta se <= 5
            let playerThird = null;
            if (pTotal <= 5) {
                playerThird = this.baralho.Retirar();
                this.player.push(playerThird);
                result.player = [...this.player];
                this.BroadcastParcial(result);
                await this.Esperar(500);
                pTotal = this.getTotal(this.player);
            }
            
            // Banker decide
            if (playerThird === null) {
                // Player não comprou 3ª carta
                if (bTotal <= 5) {
                    let carta = this.baralho.Retirar();
                    this.banker.push(carta);
                    result.banker = [...this.banker];
                    this.BroadcastParcial(result);
                    await this.Esperar(500);
                    bTotal = this.getTotal(this.banker);
                }
            } else {
                // Player comprou 3ª carta
                let v = playerThird.valor;
                if (bTotal <= 2) {
                    let carta = this.baralho.Retirar();
                    this.banker.push(carta);
                } else if (bTotal === 3 && v !== 8) {
                    this.banker.push(this.baralho.Retirar());
                } else if (bTotal === 4 && v >= 2 && v <= 7) {
                    this.banker.push(this.baralho.Retirar());
                } else if (bTotal === 5 && v >= 4 && v <= 7) {
                    this.banker.push(this.baralho.Retirar());
                } else if (bTotal === 6 && (v === 6 || v === 7)) {
                    this.banker.push(this.baralho.Retirar());
                }
                
                result.banker = [...this.banker];
                this.BroadcastParcial(result);
                await this.Esperar(500);
                bTotal = this.getTotal(this.banker);
            }
        }
        
        // decisão final
        result.vencedor = (pTotal === bTotal) ? "d" : (pTotal > bTotal ? "p" : "b");
        
        this.AddResultado(result); //atualiza e envia para todos
        this.PayoutBets(result);
        
        await this.Esperar(2000);
    }
    
    RequerePayout()
    {
        try 
        {
            this.bets.forEach(c => {
                // soma todos os valores apostados desse usuário
                let total = c.bet.total;
                
                // envia o total para o cliente
                c.user.emit("requere-payout", total);
            });
        }
        catch (e) {
            
        }
    }
    
    
    PayoutBets(result) {
        this.bets.forEach(c => {
            let valor = 0;
            
            if (result.vencedor === "b") {
                // Banker venceu (com comissão de 5%)
                valor = c.bet.banker*2;// + (c.bet.banker * 0.95);
            }
            else if (result.vencedor === "p") {
                // Player venceu
                valor = c.bet.player * 2;
            }
            else if (result.vencedor === "d") {
                // Empate → devolve banker/player e paga Draw 8:1
                valor = (c.bet.banker + c.bet.player) + (c.bet.draw * 8);
            }
            
            if (valor > 0) {
                this.SendPayout(c.user,  valor );
            }
        });
        
        // limpa apostas para próxima rodada
        this.bets = [];
    }
    
    
    
    
    // calcula soma no Baccarat (último dígito)
    getTotal(cartas) {
        return cartas.reduce((acc, c) => acc + c.valor, 0) % 10;
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

module.exports = SalaBaccarat;