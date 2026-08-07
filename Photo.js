const ModelBase = require('./ModelBase');

class Photo extends ModelBase {
    constructor() {
        super(); // Herda id, createdat, updatedat do ModelBase
        this.userid = '';
        this.url = '';
        this.comments = [];
    }
}

module.exports = Photo;