const SalaBase = require('./SalaBase');

class SalaFantan extends SalaBase {
    constructor(nome, image = "") {
        super("fantan", nome, 20, image);
    }
    
    async GerarResultado() {
        let result = {
            numero : 0,
            total : 50,
            vencedor: "*",
            time: new Date().toISOString()
        };
        
        let sorteio = Math.floor(Math.random() * 3) + 1;
        result.total += sorteio;
        this.BroadcastParcial(result);
        await this.Esperar(5000);
        this.vencedor = sorteio+"";
        this.AddResultado(result);
        this.PayoutBets(result);
        await this.Esperar(2000);
    }
    
    PayoutBets(result) 
    {
        this.bets.forEach(c => 
        {
            let valor = 0;

            if (result.vencedor == "1") {
                valor = c.bet.um * 1.95;
            }
            else if (result.vencedor == "2" ) {

                valor += c.bet.dois * 1.95;
            }
            else if (result.vencedor == "3" ) {

                valor += c.bet.tres * 1.95;
            }
            else if (result.vencedor == "4" ) {

                valor += c.bet.quatro * 1.95;
            }
            

            if (valor > 0) {
                this.SendPayout(c.user, valor);
            }
        });

        // limpa apostas para próxima rodada
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

module.exports = SalaFantan;