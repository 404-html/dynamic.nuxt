class Base {
    constructor(token) {
        this._token = token;
        this.fs = require('fs');
    }

    get() {

    }

    get token() {
        return this._token;
    }

    _security() {
        return true;
    }
}

module.exports = { Base };