const stringify = (obj_from_json) => {
    if(typeof obj_from_json !== "object" || Array.isArray(obj_from_json)){
        // not an object, stringify using native function
        return JSON.stringify(obj_from_json);
    }
    // Implements recursive object serialization according to JSON spec
    // but without quotes around the keys.
    let props = Object
        .keys(obj_from_json)
        .map(key => `${key}:${stringify(obj_from_json[key])}`)
        .join(",");
    return `{${props}}`;
}

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

    async query({ cql, params, options, model }) {
        const session = driver.session();

        return new Promise((resolve, reject) => {
            session
                .run(cql, params)
                .then(function (result) {
                    result.records = result.records.map(function (record) {
                        return record.get('n');
                    });
                    
                    resolve(result.records);
                    session.close();
                })
                .catch(function (error) {
                    console.log(error);
                    reject(error);
                });
                
                /* .subscribe({
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
                }); */
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