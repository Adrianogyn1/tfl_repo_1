const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');

const webService = "ws://localhost:5000";
const myIP = "127.0.0.1";
const token = "app_open";

const godotExecPath = "/media/not/Godot_v4.7-stable_mono_linux_x86_64/Godot_v4.7-stable_mono_linux.x86_64";
const projectPath = "/media/not/Win Docs/godot/tfl-1";

const instances = {};
let wsClient = null;
let reconnectInterval = null;

function connectWebSocket() {
    console.log('🔄 Tentando conectar ao servidor de WebSocket...');
    wsClient = new WebSocket(`${webService}?token=${token}&host=${myIP}`);

    wsClient.on('open', () => {
        console.log('✅ Conectado ao WebSocket!');
        
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }

        syncRunningRooms();
    });

    wsClient.on('close', () => {
        console.log('❌ Conexão com o WebSocket caiu.');
        scheduleReconnect();
    });

    wsClient.on('error', (err) => {
        console.error('⚠️ Erro na conexão do WebSocket:', err.message);
        wsClient.close();
    });

    wsClient.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.Event === "OnCreateRoom") {
                // Decodifica a string Base64 enviada pelo servidor
                const jsonString = Buffer.from(data.Data, 'base64').toString('utf-8');
                const roomData = JSON.parse(jsonString);
                
                createRoomInstance(roomData);
            }
        } catch (e) {
            console.error("Erro ao processar mensagem do WebSocket:", e);
        }
    });
}

function scheduleReconnect() {
    if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
            connectWebSocket();
        }, 5000);
    }
}

function syncRunningRooms() {
    const activeRooms = Object.values(instances);
    if (activeRooms.length > 0 && wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({
            Event: "SyncRooms",
            Data: activeRooms
        }));
        console.log(`📡 Re-sincronizadas ${activeRooms.length} salas ativas com o master.`);
    }
}
function createRoomInstance(room) {
    room.host = myIP;

    // Converte o objeto da sala para Base64
    const roomB64 = Buffer.from(JSON.stringify(room)).toString('base64');

    const args = [
        '--path', projectPath,
        '--headless',
        '--audio-driver', 'Dummy',
        `--room-data=${roomB64}` // Alterado para bater com o C# (TryParse)
    ];

    const childProcess = spawn(godotExecPath, args, {
        detached: false,
        stdio: 'inherit'
    });

    const pid = childProcess.pid;

    if (!pid) {
        console.error(`❌ Falha ao criar o processo da sala`);
        return;
    }

    instances[pid] = room;

    childProcess.on('exit', (code) => {
        console.log(`ℹ️ Processo da sala (PID: ${pid}) finalizado com código ${code}`);
        delete instances[pid];
    });

    console.log(`🚀 Sala criada via Godot (PID: ${pid}, Porta: ${room.port || 'Desconhecida'})`);

    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({
            Event: "RoomCreated",
            Data: { uid: room.uid, host: room.host, port: room.port, pid: pid }
        }));
    }
}



connectWebSocket();

// --- LIMPEZA DE PROCESSOS AO FECHAR O APP ---
function killAllRooms() {
    console.log('🧹 Encerrando todas as salas abertas...');
    for (const pid of Object.keys(instances)) {
        try {
            process.kill(Number(pid), 'SIGKILL');
        } catch (e) {}
    }
}

process.on('SIGINT', () => { killAllRooms(); process.exit(0); });
process.on('SIGTERM', () => { killAllRooms(); process.exit(0); });
process.on('exit', () => { killAllRooms(); });