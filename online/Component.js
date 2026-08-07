class Component {

    constructor(name = null) {

        this.id = require('crypto').randomBytes(8).toString('hex');

        this.type = this.constructor.name;

        this.name = name || this.type;

        this.msgs = new Set();

        this.go = null;

        this.deltaTime = 0;

        this.transform = null;

        this.enabled = true;

        // ownership
        this.owner = null;
    }

    get isOwner() {

        if (!this.go)
            return false;

        return this.go.ownerClient === this.owner;
    }

    get ownerClient() {

        return this.go?.ownerClient || null;
    }

    sendMessage(payload) {

        if(this.go){
            this.go.sendNetworkMessage(payload);
          //  console.log('Mensagem enviada');            
        }
        else{
            console.log('Component sem go');
        }
     /*   this.msgs.add(JSON.stringify({
            cType: this.type,
            cId: this.id,
            goId: this.go?.id,
            data: payload
        }));*/
    }

    start() {}
    update() {}
    lateUpdate() {}
}

module.exports = Component;