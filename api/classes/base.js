
class Base {
    constructor(token) {
        this._token = token;
        this.fs = require('fs-extra');
        this.models = require('../models');
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