class Base {
    constructor(token) {
        this._token = token;
        this.fs = require('fs-extra');
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