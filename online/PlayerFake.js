const Component = require('./Component');

class PlayerFaker extends Component {

    constructor(name = 'Player') {
        super(name);

        this.pos = { x: 0, y: 0 };
        this.speed = 3;
        this.color = { r: 255, g: 0, b: 0 };
        //rdn color
        this.color.r = Math.floor(Math.random() * 256);
        this.color.g = Math.floor(Math.random() * 256);
        this.color.b = Math.floor(Math.random() * 256);
        this.tempo =0;

        this.waypoints = [
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            { x: 0, y: 0 }
        ];

        this.targetIndex = 0;
        this.arriveDistance = 0.1;
    }

    update() {

        this.tempo += this.deltaTime;
        if(this.tempo > 10){
            this.sendMessage({'color':this.color});
            this.tempo = 0;
        }
        const dt = (this.deltaTime || 0) * 0.001;

        const target = this.waypoints[this.targetIndex];

        const dx = target.x - this.pos.x;
        const dy = target.y - this.pos.y;

        const distance = Math.hypot(dx, dy);

        // chegou no waypoint
        if (distance <= this.arriveDistance) {

            this.pos.x = target.x;
            this.pos.y = target.y;

            this.targetIndex++;

            if (this.targetIndex >= this.waypoints.length) {
                this.targetIndex = 0;
            }

            return;
        }

        // direção normalizada
        const dirX = dx / distance;
        const dirY = dy / distance;

        // movimento
        this.pos.x += dirX * this.speed * dt;
        this.pos.y += dirY * this.speed * dt;

        // atualiza transform
        if (this.transform) {
            this.transform.position.x = this.pos.x;
            this.transform.position.y = this.pos.y;
        }
    }
}

module.exports = PlayerFaker;