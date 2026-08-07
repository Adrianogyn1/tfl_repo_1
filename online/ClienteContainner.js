class ClienteContainer {

    constructor(ws, world) {

        this.id = require('crypto')
            .randomBytes(8)
            .toString('hex');

        this.ws = ws;

        this.world = world;

        this.gameObjects = new Set();
        
    }

    addGameObject(go) {

        go.ownerClient = this;
        go.isOwner = this === go.owner;
        this.gameObjects.add(go);

        this.spawn(go);
    }

    ____syncWorld(){
        for (const go of this.gameObjects)
            {
              this.send({
                  type: 'spawn',
                  netId: go.id,
                  name: go.name,
                  pos: go.transform.pos || { x: 0, y: 0 , z: 0 },
                  rot: go.transform.rot|| { x: 0, y: 0 , z: 0 },
                  scale: go.transform.scale || { x: 1, y: 1 , z: 1 },
                  owner: go.ownerClient==this
              })          
        }
    }

    ____onDisconnect()
    {
        for (const go of this.gameObjects) {
            this.despawn(go);
        }
    }

    ____resolveMessage(msg) {

        var dir = "";   
        if (msg.type === 'move') {
            this.gameObjects.forEach(go => {
                if (go.isOner == this)
                    go.transform.pos.x += 1;
            });
        }
        else if (msg.type === 'despawn') {
            this.despawn(msg);
        }
    }


    spawn(go) {
        
        this.world.broadcast(JSON.stringify({
            type: 'spawn',
            netId: go.id,
            name: go.name,
            pos: go.transform.pos || { x: 0, y: 0 , z: 0 },
            rot: go.transform.rot || { x: 0, y: 0 , z: 0 },
            scale: go.transform.scale || { x: 1, y: 1 , z: 1 },
            isOner: go.ClienteContainer == this
        }));
    }

    despawn(go) {

        this.world.broadcast(JSON.stringify({
            type: 'despawn',
            netId: go.id
        }));
    }

    send(data) {

        if (this.ws.readyState !== 1)
            return;

        this.ws.send(JSON.stringify(data));
    }
    broadcast(data) {
        this.world.broadcast(JSON.stringify(data));
    }

    tick() {

        this.gameObjects.forEach(go => {

            go.update();

            go.lateUpdate();

            // envia mensagens de rede
            while (go.netMessages.length > 0) {

               // this.send(go.netMessages.shift());
               this.world.broadcast(JSON.stringify(go.netMessages.shift()));
            }
        });
    }
}

module.exports = ClienteContainer;