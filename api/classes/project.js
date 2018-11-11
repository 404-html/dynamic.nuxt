const { Base } = require('./base');

class Member extends Base {
    constructor(ctx) {
        super('399393939');
        this.ctx = ctx;
    }

    error(params) {
        throw new Error('fuck');

        return params;
    }

    echo(params) {
        return params;
    }

    name() {
        return 'name';
    }

    age(params) {
        console.log('age:', params);
        return error;
    }

    formData(params) {
        console.log(params);

        const path = require('path');

        for(let key in params.files) {
            let file = params.files[key];
            
            let saveTo = path.join(process.cwd(), 'uploads', file.filename);

            file.stream.pipe(this.fs.createWriteStream(saveTo));
        }
        
    }

    _avatar(params, { res }) {
        console.log(params);

        const path = require('path');
        let ava = path.join(process.cwd(), 'uploads', 'ava.jpg');
        
        res.locals.sendAsFile = true;
        return ava;
    }
}

module.exports = { Member };