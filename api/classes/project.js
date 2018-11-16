const { Base } = require('./base');

class Member extends Base {
    constructor(ctx) {
        super('399393939');
        this.ctx = ctx;
    }

    error(params) {
        let err = new Error('fuck');
        
        err.code = 400;

        throw err;

        return params;
    }

    async get(params) {
        let member = new this.models.Member();
        let { data, normalized } = await member.find(params);
        //let { data, normalized } = await member.findOne(params);

        return { data, normalized, flags: { auto_merge: 'normalized' }};
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
            
            let saveTo = path.join(process.cwd(), 'uploads');
            this.fs.ensureDirSync(saveTo);
            saveTo = path.join(saveTo, file.filename);

            file.stream.pipe(this.fs.createWriteStream(saveTo));
        }
        
    }

    async _avatar(params, { res }) {
        console.log(params);

        /* let wait = new Promise((resolve) => {
            setTimeout(() => {
                const path = require('path');
                let default_ava = path.join(process.cwd(), 'uploads', 'default', 'ava.png');
                let ava = path.join(process.cwd(), 'uploads', 'ava.jpg');
                !this.fs.pathExistsSync(ava) && (ava = default_ava);
        
                res.locals.sendAsFile = this.fs.pathExistsSync(ava);

                resolve(ava);
            }, 150);
        })

        let ava = await wait;
        return ava; */

        const path = require('path');
        let default_ava = path.join(process.cwd(), 'uploads', 'default', 'ava.png');
        let ava = path.join(process.cwd(), 'uploads', 'ava.jpg');
        !this.fs.pathExistsSync(ava) && (ava = default_ava);

        res.locals.sendAsFile = this.fs.pathExistsSync(ava);
        return ava;
    }
}

module.exports = { Member };