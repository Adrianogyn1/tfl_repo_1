const SalaBase = require('./SalaBase');

class SalaBacboo extends SalaBase {
    constructor(nome, image = "") {
        super('bacboo', nome, 20, image);
        
        this.banker = { dados: [], complete: false };
        this.player = { dados: [], complete: false };
    }
    
    async GerarResultado() {
        // reset mãos
        this.banker.dados = [];
        this.player.dados = [];
        this.banker.complete = false;
        this.player.complete = false;
        
        let result = {
            banker: this.banker,
            player: this.player,
            vencedor: "*",
            time: new Date().toISOString()
        };
        
        for (let i = 0; i < 2; i++) {
            // player
            this.player.dados[i] = Math.floor(Math.random() * 6) + 1;
            this.player.complete = i == 1;
            result.player = { ...this.player };
            this.BroadcastParcial(result);
            await this.Esperar(500);
            
            // banker
            this.banker.dados[i] = Math.floor(Math.random() * 6) + 1;
            this.banker.complete = i == 1;
            result.banker = { ...this.banker };
            this.BroadcastParcial(result);
            await this.Esperar(1000);
        }
        
        let b = this.banker.dados[0] + this.banker.dados[1];
        let p = this.player.dados[0] + this.player.dados[1];
        
        result.vencedor = b === p ? "d" : (p > b ? "p" : "b");
        
        this.banker.complete = true;
        this.player.complete = true;
        this.AddResultado(result);
        this.PayoutBets(result);
        
        await this.Esperar(2000);
    }
    
    PayoutBets(result)
    {
        this.bets.forEach(bet =>
        {
            
            let valor = 0;
            if (result.vencedor == 'd') {
                const t = result.player[0] + result.player[1];
                let mult = 4;
                if (t == 2 || t == 12) mult = 88;
                else if (t == 3 || t == 11) mult = 25;
                else if (t == 4 || t == 10) mult = 10;
                else if (t == 5 || t == 9) mult = 6;
                
                valor += bet.banker * .9 + bet.player * .9;
                valor += bet.draw * mult;
            }
            else if (result.vencedor == 'p') {
                valor = bet.player * 2;
            }
            else if (result.vencedor == 'b') {
                valor = bet.banker * 2;
            }
            
            //envia o pagamento 
            if (valor > 0)
                this.SendPayout(user, valor);
        });
        this.bets = [];
    }
    
    GetInfo() {
        return {
            ...super.GetInfo(),
            game: this.game,
            nome: this.nome,
            users: this.userCount,
            status: this.status,
            image: this.image,
            history: this.history.map(n => n.vencedor).reverse().slice(0, 10)
        };
    }
}

module.exports = SalaBacboo;