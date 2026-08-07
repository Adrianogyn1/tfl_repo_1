const ClienteContainer = require('./ClienteContainner');

const {
    GameObject,
    PlayerFaker
} = require('./Engine');

class WorldContainer {

    constructor() {

        this.clients = new Set();
        this.enqueueNextTick = [];
    }

    addClient(ws) {

        const container = new ClienteContainer(ws, this);

        this.clients.add(container);

        console.log(`Novo usuário conectado: ${container.id}`);

        // envia dados de sincronização
        this.enqueueNextTick.push(
            container.____syncWorld.bind(container)
        );

        // cria player
        const go = GameObject.create(
            "Player Fake " + this.clients.size
        );

        // ownership
        go.ownerClient = container;

        // adiciona comportamento
        go.addComponent(PlayerFaker);

        // adiciona ao cliente
        container.addGameObject(go);

        console.log(`Novo GameObject criado: ${go.id} total ${this.clients.size}`);

        return container;
    }

    removeClient(ws) {

        console.log(`Cliente desconectado: ${ws.id}`);
        for (const client of this.clients) {

            if (client.ws === ws) {
                client.____onDisconnect();
                this.clients.delete(client);
                console.log(`Cliente removido: ${client.id}`);
                break;
            }
        }
    }

    tick() {

        // executa fila
        this.enqueueNextTick.forEach(evt => {
            evt();
        });

        // limpa depois
        this.enqueueNextTick = [];

        // tick clients
        this.clients.forEach(client => {
            client.tick();
        });
    }

    broadcast(data) {

        this.clients.forEach(client => {

            if (
                client.ws &&
                client.ws.readyState === 1
            ) {
                client.ws.send(data);
            }
        });
    }
}

module.exports = WorldContainer;