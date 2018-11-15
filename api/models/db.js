class DatabaseDriver {
    constructor({} = {}) {
    }

    async find(pattern, options) {}

    async findOne() {}

    async query() {}

    async save() {}

    async update() {}

    async delete() {}
}

const neo4j = require('neo4j-driver').v1;
const driver = neo4j.driver(process.env.NEO_URL, neo4j.auth.basic("neo4j", "123"));

class NeoDriver extends DatabaseDriver {
    constructor(params) {
        super(params);
    }

    async query(cql, params, options) {
        const session = driver.session();

        return new Promise((resolve, reject) => {
            session
                .run(cql, params)
                .subscribe({
                    onNext: function (record) {
                        console.log(record.get('n'));
                        //resolve(record);
                    },
                    onCompleted: function (records) {
                        session.close();
                        resolve(record);
                    },
                    onError: function (error) {
                        console.log(error);
                        reject(error);
                    }
                });
        })

        // or
        // the Promise way, where the complete result is collected before we act on it:
        /* session
            .run('MERGE (james:Person {name : {nameParam} }) RETURN james.name AS name', {nameParam: 'James'})
            .then(function (result) {
                result.records.forEach(function (record) {
                    console.log(record.get('name'));
                });
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            }); */
    }
}

module.exports = { driver: new NeoDriver() };