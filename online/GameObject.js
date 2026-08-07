const Component = require('./Component');
const Transform = require('./Transform');

class GameObject {

    constructor(name) {

        this.id = require('crypto').randomBytes(8).toString('hex');

        this.name = name;

        this.components = new Map();
        this._pendingComponents = [];

        this.transform = null;
        this.ownerClient = null;

        this.__lastUpdate = Date.now();
        this.netMessages = [];
    }

    static create(name) {

        const go = new GameObject(name);

        go.transform = go.getOrAddComponent(Transform);

        if (!go.transform) {
            console.log('Transform nulo na criação');
        }

        return go;
    }

    sendNetworkMessage(msg) {

        this.netMessages.push(msg);
    }

    addComponent(ClassRef) {

        const comp = new ClassRef();

        if (!(comp instanceof Component)) {

            console.log('Componente inválido');
            return null;
        }

        comp.go = this;

        if (this.transform && comp.constructor.name !== 'Transform') {
            comp.transform = this.transform;
        }

        this._pendingComponents.push(comp);

        return comp;
    }

    getComponet(ClassRef) {

        return (
            this.components.get(ClassRef.name) ||
            this._pendingComponents.find(c => c.type === ClassRef.name)
        );
    }

    getOrAddComponent(ClassRef) {

        let comp = this.getComponet(ClassRef);

        if (!comp) {
            comp = this.addComponent(ClassRef);
        }

        return comp;
    }

    _processPending() {

        while (this._pendingComponents.length > 0) {

            const comp = this._pendingComponents.shift();

            this.components.set(comp.type, comp);

            comp.transform = this.transform;

            comp.start();
        }
    }

    ___checkTransform() {

        if (!this.transform) {
            this.transform = this.getOrAddComponent(Transform);
        }

        this.components.forEach(c => {
            c.transform = this.transform;
        });

        if (!this.transform) {

            console.log('Transform nulo');

            return false;
        }

        return true;
    }

    update() {

        this.___checkTransform();

        const now = Date.now();

        this.deltaTime = now - this.__lastUpdate;

        this._processPending();

        this.components.forEach(c => {

            c.deltaTime = this.deltaTime;

            if (!c.enabled)
                return;

            c.update();
        });

        this.__lastUpdate = now;
    }

    lateUpdate() {

        this.components.forEach(c => {

            if (!c.enabled)
                return;

            c.lateUpdate();
        });
    }
}

module.exports = GameObject;