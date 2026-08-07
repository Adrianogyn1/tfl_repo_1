const Component = require('./Component');

class Transform extends Component {

    constructor(x = 0, y = 0, z = 0) {

        super();

        this.position = { x, y, z };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = { x: 1, y: 1, z: 1 };

        this.syncPosition = true;
        this.syncRotation = false;
        this.syncScale = false;
        this.precision = 100;
        this._cache = {

            position: { ...this.position },
            rotation: { ...this.rotation },
            scale: { ...this.scale }
        };
    }

    lateUpdate() {

        const payload = {};

        let hasChanges = false;

        const check = (group, key) => {

            const raw = this[group][key];

            // mais rápido que toFixed
            const val =
                Math.round(raw * this.precision)
                / this.precision;

            if (val === this._cache[group][key])return;

            const prefix = group[0];
            payload[`${prefix}${key}`] = val;
            this._cache[group][key] = val;
            hasChanges = true;
        };

        if (this.syncPosition) {

            check('position', 'x');
            check('position', 'y');
            check('position', 'z');
        }

        if (this.syncRotation) {

            check('rotation', 'x');
            check('rotation', 'y');
            check('rotation', 'z');
        }

        if (this.syncScale) {

            check('scale', 'x');
            check('scale', 'y');
            check('scale', 'z');
        }

        if (!hasChanges)
            return;

        payload.netId = this.go? this.go.id: null;
        payload.type = 'tr';
        this.sendMessage({type: 'sync',payload});
    }
}

module.exports = Transform;