const path = require('path');
const fs = require('fs');
const express = require('express');
const crypto = require('crypto');
const { SalaRoleta, SalaBaccarat, SalaBacboo, SalaFoottball, SalaFantan } = require('./AllTables');

const router = express.Router();

/* ===================== Configuração ===================== */

const PAGINAS = path.resolve(__dirname, '../../../../paginas/cassino');
const BET_COOLDOWN_MS = 200;

// tipo -> { classe, quantidade, imagem, página }
const TIPOS = {
    roullet:   { Classe: SalaRoleta,    nome: 'Roullet',   qtd: 10, img: '/images/imm.jpg',          page: 'roleta.html' },
    baccarat:  { Classe: SalaBaccarat,  nome: 'Baccarat',  qtd: 10, img: '/images/bacarat_0.jpeg',   page: 'baccarat.html' },
    bacboo:    { Classe: SalaBacboo,    nome: 'Bacboo',    qtd: 10, img: '/images/bacboo_b.webp',    page: 'bacboo.html' },
    foottball: { Classe: SalaFoottball, nome: 'Foottball', qtd: 10, img: '/images/bacboo_i.webp',    page: 'foottball.html' },
    fantan:    { Classe: SalaFantan,    nome: 'Fantan',    qtd: 10, img: '/images/bacboo_i.webp',    page: 'fantan.html' }
};

/* ===================== Registro de salas ===================== */

const salas = [];            // lista (compatível com quem importa { salas })
const salasById = new Map(); // id -> sala
let started = false;

function init() {
    if (started) return;
    started = true;

    for (const [tipo, cfg] of Object.entries(TIPOS)) {
        for (let i = 0; i < cfg.qtd; i++) {
            const id = `${tipo}-${i}`;
            const sala = new cfg.Classe(`${cfg.nome} ${i}`, cfg.img);
            sala.roomId = id;
            sala.uid = crypto.randomUUID();
            sala.tipo = tipo;
            salas.push(sala);
            salasById.set(id, sala);
        }
    }

    for (const s of salas) {
        try { s.Start(); } catch (err) { console.error(`[cassino] Start falhou em ${s.roomId}:`, err); }
    }
    console.log(`[cassino] ${salas.length} salas iniciadas`);
}

function shutdown() {
    if (!started) return;
    for (const s of salas) {
        try { s.Stop?.(); } catch (err) { console.error(`[cassino] Stop falhou em ${s.roomId}:`, err); }
    }
    salas.length = 0;
    salasById.clear();
    started = false;
}

const getSala = (id) => {
    const sala = salasById.get(id);
    if(!sala){
        for(const s of salas){
            if(s.uid === id) return s;
        }
    }
    if (!sala) return null;
    return { ...sala.GetInfo(), id: sala.roomId, tipo: sala.tipo };
};
const roomChannel = (id) => `room:${id}`;

const infoOf = (s) => ({ ...s.GetInfo(), id: s.roomId, tipo: s.tipo });

/* ===================== HTTP ===================== */

function sendPage(res, file) {
    const full = path.join(PAGINAS, file);
    if (!fs.existsSync(full)) return res.status(404).send('Página não encontrada');
    res.sendFile(full);
}

router.get('/', (req, res) => sendPage(res, 'index.html'));
for (const cfg of Object.values(TIPOS)) {
    router.get('/' + cfg.page.replace('.html', ''), (req, res) => sendPage(res, cfg.page));
}

router.get('/rooms', (req, res) => {
    const { tipo } = req.query;
    const list = typeof tipo === 'string' ? salas.filter(s => s.tipo === tipo) : salas;
    res.json(list.map(infoOf));
});

router.get('/teste', (req, res) => res.json({ salas: salas.length, started }));

/* ===================== Socket.IO ===================== */

function onConnection(socket, nsp) {
    let current = null;   // sala atual
    let lastBet = 0;

    const leave = () => {
        if (!current) return;
        const sala = current;
        current = null;
        socket.leave(roomChannel(sala.roomId));
        try { sala.RemovePlayer?.(socket); } catch (err) { console.error('[cassino] RemovePlayer:', err); }
    };

    socket.on('rooms', (payload, ack) => {
        if (typeof ack !== 'function') return;
        const tipo = payload?.tipo;
        const list = typeof tipo === 'string' ? salas.filter(s => s.tipo === tipo) : salas;
        ack({ ok: true, rooms: list.map(infoOf) });
    });

    socket.on('joinRoom', (payload, ack) => {
        const sala = getSala(payload?.roomId);
        if (!sala) return ack?.({ ok: false, message: 'Sala inválida' });

        if (current === sala) return ack?.({ ok: true, info: infoOf(sala) });

        leave();
        socket.join(roomChannel(sala.roomId));
        current = sala;
        try {
            sala.AddPlayer?.(socket, nsp);
        } catch (err) {
            console.error('[cassino] AddPlayer:', err);
            leave();
            return ack?.({ ok: false, message: 'Não foi possível entrar na sala' });
        }
        ack?.({ ok: true, info: infoOf(sala) });
    });

    socket.on('leaveRoom', (_p, ack) => {
        leave();
        ack?.({ ok: true });
    });

    socket.on('mybet', (bet, ack) => {
        if (!socket.data.user) return ack?.({ ok: false, message: 'Login necessário' });
        if (!current) return ack?.({ ok: false, message: 'Entre em uma sala primeiro' });
        if (bet === null || typeof bet !== 'object') return ack?.({ ok: false, message: 'Aposta inválida' });

        const now = Date.now();
        if (now - lastBet < BET_COOLDOWN_MS) return ack?.({ ok: false, message: 'Muitas apostas seguidas' });
        lastBet = now;

        Promise.resolve()
            .then(() => current.Bet(socket, bet))
            .then((result) => ack?.({ ok: true, result }))
            .catch((err) => ack?.({ ok: false, message: err.message || 'Erro ao apostar' }));
    });

    socket.on('disconnect', leave);
}

 init(); 

module.exports = { router, salas, init, shutdown, onConnection };