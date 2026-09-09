const repo = require("../repository");
const { spawn } = require('child_process');
const dgram = require('dgram');
const { Op } = require('sequelize');
require("dotenv").config();

const serverIP = process.env.SERVER_IP || "127.0.0.1";
const balancerPort = 7000;

const useServerApp = process.env.USE_SERVER_APP === 'true';
const godotExecPath = process.env.GODOT_EXEC_PATH;
const projectPath = process.env.PROJECT_PATH;
const serverAppPath = process.env.SERVER_APP;

class GameBalancer
{
    constructor()
    {
        this.clientSessions = new Map(); // clientKey -> targetPort
        this.roomProcesses = new Map();
        this.roomPortsToClients = new Map(); // targetPort -> Set(clientKey)

        this.server = dgram.createSocket('udp4');
        this.clientSocket = dgram.createSocket('udp4');
        this.clientSocket.bind(0);

        this._setupListeners();
    }

    _setupListeners()
    {
        this.server.on('message', async (msg, rinfo) =>
        {
            const clientKey = `${rinfo.address}:${rinfo.port}`;

            // Handshake (Opcode 0x01)
            if (msg.length > 0 && msg[0] === 0x01)
            {
                console.log(`Handshake recebido de ${clientKey}`);
                const roomId = msg.slice(1).toString().trim();
                if (isNaN(roomId)) return;

                const roomModel = await repo.RoomModel.findOne({ where: { id: roomId } });
                if (!roomModel) return;

                let serverRecord = await repo.Server.findOne({
                    where: {
                        roomId: roomId,
                        playersCount: { [Op.lt]: roomModel.maxPlayers }
                    }
                });

                if (!serverRecord)
                {
                    serverRecord = await createNewServerInstance(roomModel);
                }

                const targetPort = serverRecord.port;
                this.clientSessions.set(clientKey, targetPort);

                if (!this.roomPortsToClients.has(targetPort))
                {
                    this.roomPortsToClients.set(targetPort, new Set());
                }
                this.roomPortsToClients.get(targetPort).add(clientKey);

                if (!this.roomProcesses.has(targetPort))
                {
                    this.launchGameInstance(serverRecord);
                }
                return;
            }

            // Cleanup (Opcode 0x02)
            if (msg.length > 0 && msg[0] === 0x02)
            {
                this.cleanupClient(clientKey);
                return;
            }

            // Tráfego do ENet: Se não tem sessão exata, tenta achar pelo IP do cliente para mapear a nova porta efêmera do ENet
            let targetPort = this.clientSessions.get(clientKey);
            if (!targetPort)
            {
                for (const [key, port] of this.clientSessions.entries())
                {
                    if (key.startsWith(rinfo.address))
                    {
                        targetPort = port;
                        this.clientSessions.set(clientKey, targetPort);
                        this.roomPortsToClients.get(targetPort)?.add(clientKey);
                        break;
                    }
                }
            }

            if (!targetPort) return;

            // Encaminha o pacote do cliente para a instância do Godot correspondente
            this.clientSocket.send(msg, targetPort, '127.0.0.1', (err) =>
            {
                if (err) console.error('Erro ao enviar para o jogo:', err);
            });
        });

        this.clientSocket.on('message', (msg, rinfo) =>
        {
            const clients = this.roomPortsToClients.get(rinfo.port);
            if (clients)
            {
                for (const clientKey of clients)
                {
                    const [address, port] = clientKey.split(':');
                    this.server.send(msg, parseInt(port), address, (err) =>
                    {
                        if (err) console.error('Erro ao devolver ao cliente:', err);
                    });
                }
            }
        });
    }

    cleanupClient(clientKey)
    {
        const targetPort = this.clientSessions.get(clientKey);
        if (targetPort)
        {
            this.clientSessions.delete(clientKey);
            const clients = this.roomPortsToClients.get(targetPort);
            if (clients)
            {
                clients.delete(clientKey);
                if (clients.size === 0)
                {
                    this.roomPortsToClients.delete(targetPort);
                }
            }
        }
    }

    launchGameInstance(serverInfo)
    {
        console.log(`Subindo nova instância da sala ${serverInfo.roomId} na porta ${serverInfo.port}...`);

        let command, args;
        if (useServerApp)
        {
            command = serverAppPath;
            args = [`--port=${serverInfo.port}`, `--room=${serverInfo.roomId}`, `--uid=${serverInfo.uid}`];
        } else
        {
            command = godotExecPath;
            args = ['--path', projectPath, '--headless', `--port=${serverInfo.port}`, `--room=${serverInfo.roomId}`, `--uid=${serverInfo.uid}`];
        }

        const proc = spawn(command, args, { stdio: 'inherit' });
        this.roomProcesses.set(serverInfo.port, proc);
        console.log(`Processo da porta ${serverInfo.port} iniciado.`);

        proc.on('close', async () =>
        {
            console.log(`Processo da porta ${serverInfo.port} encerrado.`);
            this.roomProcesses.delete(serverInfo.port);
            this.roomPortsToClients.delete(serverInfo.port);

            for (const [clientKey, p] of this.clientSessions.entries())
            {
                if (p === serverInfo.port)
                {
                    this.clientSessions.delete(clientKey);
                }
            }

            await repo.Server.destroy({ where: { port: serverInfo.port } });
        });
    }

    start()
    {
        this.server.bind(balancerPort, "0.0.0.0", () =>
        {
            console.log(`Balanceador UDP rodando na porta ${balancerPort}`);
        });
    }
}

async function createNewServerInstance(room)
{
    let serverInfo = {};
    serverInfo.uid = new Date().getTime();
    serverInfo.roomId = room.id;
    serverInfo.name = room.name;
    serverInfo.maxPlayers = room.maxPlayers;
    serverInfo.playersCount = 0;
    serverInfo.ip = serverIP;

    const usedPorts = (await repo.Server.findAll()).map(s => s.port);
    let assignedPort = 7001;
    while (usedPorts.includes(assignedPort))
    {
        assignedPort++;
    }

    serverInfo.port = assignedPort;
    serverInfo.publicPort = 10000 + assignedPort;
    serverInfo.scene = room.scene;
    serverInfo.token = "12345";

    const created = await repo.Server.create(serverInfo);
    return created.get({ plain: true });
}

var balance = new GameBalancer();
balance.start();

module.exports = balance;