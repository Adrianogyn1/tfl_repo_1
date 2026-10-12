const SalaBase = require('./SalaBase');
const NumInfo = require('./NumInfo');

class SalaRoleta extends SalaBase {
    constructor(nome, image = "") {
        super("roleta", nome, 20, image);
        this.pretos = 0;
        this.vermelhos = 0;
        this.total = 0;
        this.last = 0;
    }
    
    async GerarResultado() {
    
       
       this.RequerePayout();
       
        const numero = Math.round(Math.random() * 36); // whell[targetIndex];
        
        const info = new NumInfo(numero);
        
        // Atualiza contadores
        if (info.color === "red") this.vermelhos++;
        if (info.color === "black") this.pretos++;
        this.total++;
        this.last = numero;
        
        // Cria resultado
        const resultado = {
            numero: numero,
            numInfo: info,
            time: new Date().toISOString()
        };
        //round start ui?
        this.BroadcastParcial(resultado);
        // Simula o tempo de roleta girando
        await this.Esperar(10000);
        //envia o resultado 
        this.AddResultado(resultado);
        //faz o pagamento 
        this.PayoutBets(resultado);
        // pausa para recomeçar 20+10+2=32 total de 32 seg por rodada
        await this.Esperar(2000);
    }
    
    
    PayoutBets(result) {
    this.bets.forEach(c => {
        let valor = 0;

        try {
            // procura se o número sorteado está entre as apostas do usuário
            var bt = c.bet.find(el => el.numero == result.numero);

            if (bt) {
                valor = bt.valor * 36; // multiplicador de payout
            } else {
                c.user.emit("log", "não encontrado bet");
            }

            if (valor > 0) {
                // envia payout
                this.SendPayout(c.user, valor);
            }

        } catch (e) {
            c.user.emit("log", e.message ?? e);
            console.log(e);
        }
    });

    // limpa apostas para próxima rodada
    this.bets = [];
}

    
    GetInfo() {
        var info = super.GetInfo();
        return {
            ...info,
            total: this.total,
            vermelho: this.vermelhos,
            pretos: this.pretos,
            game: this.game,
            nome: this.nome,
            users: this.userCount,
            status: this.status,
            image: this.image,
            history: this.history.map(n => n.numero).reverse().slice(0, 10)
        };
    }
}

module.exports = SalaRoleta;