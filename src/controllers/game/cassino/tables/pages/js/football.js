$(document).ready(function() {
    
    // ================= VARIÁVEIS =================
    let chipSelected = null;
    const bet = { player: 0, banker: 0, draw: 0, total: 0 };
    let apostaHistorico = [];
    let ultimaAposta = null;
    
    let user = carregarUser();
    if (!user) {
        user = { nome: "user", saldo: 1000 };
        salvarUser(user.nome, user.saldo);
    }
    
    
    
    const $el = {
        betBoxes: $("#bet_player, #bet_banker, #bet_draw"),
        log: $("#log"),
        history: $('#history'),
        playerDeck: $('#player'),
        bankerDeck: $('#banker'),
        historico: $('#historico'),
        tempo: $('#tempo'),
        status: $('#status'),
        error: $('#error'),
        userName : $('.playerInfo .nome'),
        userSaldo :$('.playerInfo .saldo'),
        userAposta :$('.playerInfo .aposta'),
        userLucro : $('.playerInfo .lucro'),
    };
    
    //users
    $el.userName.text(user.nome);
    $el.userSaldo.text(formatarBRL(user.saldo));
    
    const params = new URLSearchParams(window.location.search);
    const $roomName = params.get('room');
    const socket = io("https://cassinoserver-production.up.railway.app");
    const myHistorico = [];
    
    // ================= FUNÇÕES =================
    function salvarHistorico() {
        const estado = {};
        $el.betBoxes.each(function() {
            const id = $(this).attr("id");
            const total = $(this).find(".chip").toArray()
                .reduce((sum, c) => sum + parseFloat($(c).data("value")) || 0, 0);
            estado[id] = total;
        });
        apostaHistorico.push(estado);
    }
    
    function updateBet() {
        $el.betBoxes.each(function() {
            const id = $(this).attr("id");
            const total = $(this).find(".chip").toArray()
                .reduce((sum, c) => sum + parseFloat($(c).data("value")) || 0, 0);
            if (id.includes("player")) bet.player = total;
            if (id.includes("banker")) bet.banker = total;
            if (id.includes("draw")) bet.draw = total;
        });
        bet.total = bet.player + bet.banker + bet.draw;
        
        $el.userAposta.text(formatarBRL(bet.total));
        $el.userSaldo.text(formatarBRL(user.saldo -bet.total));
       
        // salva histórico somente se houver mudança
        const ultimo = apostaHistorico[apostaHistorico.length - 1] || {};
        if (!ultimo || bet.player !== (ultimo["bet_player"] || 0) ||
            bet.banker !== (ultimo["bet_banker"] || 0) ||
            bet.draw !== (ultimo["bet_draw"] || 0)) {
            salvarHistorico();
            socket.emit("mybet", bet);
        }
    }
    
    function addChip(value, container) {
        const $first = container.find(".chip").first();
        if ($first.length) {
            value += parseFloat($first.data("value"));
            $first.remove();
        }
        
        const $chip = $(`<div class="chip" data-value="${value}">${value}</div>`)
            .draggable({
                helper: "original",
                cursor: "move",
                revert: "invalid",
                start: (e, ui) => ui.helper.css("z-index", 1000),
                stop: (e, ui) => { if (!ui.helper.data("dropped")) { ui.helper.remove();
                        updateBet(); } }
            });
        
        container.append($chip);
        updateBet();
    }
    
    function LimparAposta() {
        $el.betBoxes.each(function() { $(this).find(".chip").remove(); });
        updateBet();
    }
    
    function DobrarAposta() 
    {
        $el.betBoxes.each(function() {
            const $chip = $(this).find(".chip");
            if ($chip.length) {
                const value = parseFloat($chip.data("value")) * 2;
                $chip.data("value", value).text(value);
            }
        });
        updateBet();
    }
    
    function VoltarAposta() 
    {
        if (apostaHistorico.length < 2) return;
        apostaHistorico.pop();
        const ultimo = apostaHistorico[apostaHistorico.length - 1];
        $el.betBoxes.each(function() {
            const id = $(this).attr("id");
            const $box = $(this).find(".bet-amount");
            $box.empty();
            if (ultimo[id] > 0) $("<div>").addClass("chip").attr("data-value", ultimo[id]).text(ultimo[id]).appendTo($box);
        });
        updateBet();
    }
    
    function Reapostar() 
    {
        if (!ultimaAposta) return;
        $el.betBoxes.each(function() {
            const id = $(this).attr("id");
            const $box = $(this).find(".bet-amount");
            $box.empty();
            if (ultimaAposta[id] > 0) addChip(ultimaAposta[id], $box);
        });
    }
    
    function RoundEnd() 
    {
        if (bet.total <= 0) return;
        ultimaAposta = {};
        $el.betBoxes.each(function() {
            const id = $(this).attr("id");
            const $chip = $(this).find(".chip");
            if ($chip.length) ultimaAposta[id] = parseFloat($chip.data("value"));
        });
        LimparAposta();
    }
    
    // ================= CHIP EVENTS =================
    $(".chip").click(function() { chipSelected = parseFloat($(this).data("value")); });
    
    $el.betBoxes.click(function() {
        if (!chipSelected && chipSelected <= 0) return;
        const $amount = $(this).find(".bet-amount");
        addChip(chipSelected, $amount);
    });
    
    $el.betBoxes.droppable({
        accept: ".chip",
        hoverClass: "border border-3 border-warning",
        drop: function(event, ui) {
            const value = parseFloat(ui.helper.data("value"));
            const $amount = $(this).find(".bet-amount");
            ui.helper.data("dropped", true).remove();
            addChip(value, $amount);
        }
    });
    
    // ================= BOTÕES =================
    $("#btnRepostar").click(Reapostar);
    $("#btnVoltar").click(VoltarAposta);
    $("#btnDobrar").click(DobrarAposta);
    $("#btnLimpar").click(LimparAposta);
    
    // ================= CARD & HISTORY =================
    function renderCarta(c) {
        //console.log(c);
        if(!c)return"";
        const cor = (c.nipe === "♥" || c.nipe === "♦") ? "text-danger" : "text-dark";
        return `<div class="carta col-auto mb-2">
            <div class="card border-dark bg-white text-center d-flex flex-column justify-content-between">
                <div class="d-flex justify-content-start p-1"><span class="${cor} fw-bold">${c.val}${c.nipe}</span></div>
                <div class="d-flex align-items-center justify-content-center flex-grow-1"><span class="${cor} fs-2">${c.nipe}</span></div>
                <div class="d-flex justify-content-end p-1"><span class="${cor} fw-bold" style="transform:rotate(180deg)">${c.val}${c.nipe}</span></div>
            </div>
        </div>`;
    }
    
    function addDeck(data) {
        $el.playerDeck.html(renderCarta(data.player));
        $el.bankerDeck.html(renderCarta(data.banker));
    }
    
    function atualizarHistoricoBigRoad(array) {
        $el.historico.empty();
        let lastType = null,
            $col;
        array.forEach(v => {
            //console.log(v);
            
            if(v!=='d')
            if (v !== lastType) {
                $col = $("<div>").css({ display: "flex", "flex-direction": "column-reverse", gap: "5px", "align-items": "center" });
                $el.historico.append($col);
              
               
                lastType = v;
            }
         
            
            $("<div>").addClass("bead").css({

                "background-color": v === 'b' ? 'red' : v === 'p' ? 'blue' : 'green'
            }).text(v.toUpperCase())
            .appendTo($col);
        });
        $el.historico.scrollLeft($el.historico[0].scrollWidth);
    }
    
    function log(msg) { $el.log.append(`<div>${msg}</div>`);
        $el.log.scrollTop($el.log[0].scrollHeight); }
    
    // ================= SOCKET =================
    socket.on('connect', () => {
        $el.status.text("Conectado");
        socket.emit("joinRoom", $roomName);
        log(`✅ Conectado (ID:${socket.id})`);
    });
    socket.on('disconnect', () => $el.status.text("Desconectado"));
    socket.on('connect_error', err => $el.status.text(`Erro: ${err.message}`));
    socket.on('reconnect_attempt', a => $el.status.text(`Reconectando... #${a}`));
    
    socket.on('history', data => {
        myHistorico.push(...data);
        atualizarHistoricoBigRoad(myHistorico.map(c => c.vencedor));
    //$el.history.html(data.map(r => `<b>${r.vencedor}</b>`).join(''));
        log(`📜 Histórico carregado (${data.length})`);
    });
    
    socket.on('newResult', data => {
        addDeck(data);
        myHistorico.push(data);
        atualizarHistoricoBigRoad(myHistorico.map(c => c.vencedor));
        setTimeout(() => { $el.playerDeck.empty();
            $el.bankerDeck.empty(); }, 4000);
        RoundEnd(); // salva ultima aposta e limpa fichas
        log(`🎲 Novo resultado ${data.vencedor}`);
    });
    
    socket.on('registerBet', data => { log("bet aceita"); });
    socket.on('payout', data => { 
        log("ganhou: " + data); 
        user.saldo+=data;
        salvarSaldo(user.saldo);
        $el.userSaldo.text(formatarBRL(user.saldo));
    });
    
    socket.on('requere-payout', data => {
       log("requere"+data);
        user.saldo -= data;
        salvarSaldo(user.saldo);
        $el.userSaldo.text(formatarBRL(user.saldo));
      });
    
    
    
    
    socket.on('round', addDeck);
    socket.on('tempo', data => $el.tempo.text(data));
    socket.on('status', data => $el.status.text(data));
    socket.on('error', data => $el.error.text(data.error || data));
    
});