
import Ajv from 'ajv';
import deepmerge from 'deepmerge';
import { schema as Schema, normalize } from 'normalizr';

import { driver } from '../db';

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
};

const parseLabels = (labels) => {
    return labels.split(':').reduce((memo, label) => {
        label && memo.push(label);

        return memo;
    }, []);
};


const config = {
    schemaId: 'title',
    allErrors: true,
    verbose: true,
    removeAdditional: 'all',
    coerceTypes: true,
    useDefaults: true,
    extendRefs: true,
    $data: true
}

const ajv = new Ajv(config);
require('ajv-keywords')(ajv);

const schemas = {};
const maps = {};
let models = {};

class BaseModel {
    constructor({ data } = {}) {
        this.data = data;

        this.ajv = ajv;
        this._schema = schemas[this.title];
        this.maps = maps;
        this.map = maps[this.title];

        const handler = {
            get(target, key, receiver) {
                const origin = target[key];

                if(key === 'schema') {
                    let schema = (!origin.type || (origin.type && target.__proto__.__proto__.schema.type === origin.type)) ? deepmerge(target.__proto__.__proto__.schema, origin) : origin;
                    //console.log(schema);
                    return schema;
                }
                
                return origin;
            }
        };

        return new Proxy(this, handler);
    }

    get schema() {
        return {
            title: '',
        }
    }

    normalize() {
        try {
            let data = deepmerge(this.data, {});

            const isValid = this.ajv.validate(this.title, data);

            if (!isValid) {
                throw new Error(this.ajv.errorsText());
            }

            //this.parseRefs()

            return normalize(data, this._schema);
        }
        catch(err) {
            console.err(err);
        }
    }

    parseRefs() {
        const { title, properties, required, type, items } = this.schema;
      
        let define = (props, parent, parent_type) => {
            let map = {};
    
            Object.getOwnPropertyNames(props).forEach(key => {
                let { $ref, $rel, type, items } = props[key]
    
                let deep = ['array', 'object'].includes(type);
                deep && type === 'array' && !Array.isArray(props[key].items) && (deep = false);
    
                if(!deep) {
                    if ($ref) {
                        $rel = $rel || $ref;

                        let schemaName = $ref.replace('#/definitions/', '');
                                            
                        this._schema.define(parent ? { [parent]: parent_type === 'array' ? [{ [key]: schemas[schemaName] }] : { [key]: schemas[schemaName] }} : parent_type === 'array' ? [{ [key]: schemas[schemaName] }] : { [key]: schemas[schemaName] });
                        
                        let path = parent || key;
                        //let path = parent ? `${parent}.${key}` : `${key}`;
                        map[path] = {
                            path: parent ? `${parent}.${key}` : `${key}`,
                            type: parent_type || 'object',
                            links: models[schemaName],
                            $rel,
                            required: required.includes(parent || key)
                        }
    
                    } else if (type === 'array' && items) {
                        if(items.$ref) {
                            $rel = items.$rel || items.$ref;

                            let schemaName = items.$ref.replace('#/definitions/', '');
    
                            this._schema.define(parent ? { [parent]: { [key]: [schemas[schemaName]] }} : { [key]: [schemas[schemaName]] });
    
                            let path = parent || key;
                            //let path = parent ? `${parent}.${key}` : `${key}`;
                            map[path] = {
                                path: parent ? `${parent}.${key}` : `${key}`,
                                type: 'array',
                                links: models[schemaName],
                                $rel,
                                required: required.includes(parent || key)
                            }
                        }
                        else {
                            if(items.type === 'object' && items.properties) {
                                map = { ...map, ...define(items.properties, key, type) };
                            }
                        }
                    }
                }
                else map = { ...map, ...define(type === 'object' ? props[key].properties : props[key].items[0].properties, key, type) };
            });
    
            return map;
        };
    
        let map = type === 'array' ? define(items.properties): define(properties);
    
        return map;
    }

    get title() {
        return this.constructor.name;
    }

    async findOne(params, options) {
        options = { ...options, normalize: false };

        let { data } = await this.find(params, options);

        this.data = data[0];
        return { normalized: this.normalize(), data: this.data };
    }

    async find(params = {}, options = { /* skip: 0, limit: 10 */ }) {
        const helpers = require('decypher').helpers;
        const Query = require('decypher').Query;

        let queries = [];
        let with_statements = [];
        let lss = this.labels();

        params = Object.entries(params).reduce((memo, entry) => {
            let [key, value] = entry;

            let map = this.map[key];
            if(!map) {
                memo[key] = value
            }
            else {
                if(value) {
                    let { $props, $link } = value || {};

                    let cql = helpers.relationshipPattern({
                        direction: 'out',
                        type: map.$rel,
                        identifier: `${key}_rel`,
                        data: $props ? { ...$props } : void 0,
                        source: 'node',
                        target: {
                            identifier: key,
                            label: parseLabels((new map.links()).labels()),
                            data: $link ? { ...$link } : void 0
                        }
                    });

                    let { required, path, type } = map;

                    if(type === 'array') {
                        if(path.indexOf('$link') !== -1) {
                            let props = `\`$props\`: properties(${key}_rel)`;
                            let link = `\`$link\`: properties(${key})`;

                            required ? with_statements.push(`${key}: collect({ ${props}, ${link} })`) : with_statements.push(`${key}: CASE WHEN ${key} IS NULL THEN [] ELSE collect({ ${props}, ${link} }) END`);
                        }
                        else {
                            //with_statements.push(`${key}: collect(properties(${key}))`);
                            required ? with_statements.push(`${key}: collect({ ${props}, ${link} })`) : with_statements.push(`${key}: CASE WHEN ${key} IS NULL THEN [] ELSE collect({ ${props}, ${link} }) END`);
                        }

                    }
                    else {
                        if(path.indexOf('$link') !== -1) {
                            let props = `\`$props\`: properties(${key}_rel)`;
                            let link = `\`$link\`: properties(${key})`;

                            with_statements.push(`${key}: { ${props}, ${link} }`);
                        }
                        else {
                            with_statements.push(`${key}: properties(${key})`);
                        }
                    }

                    cql = required ? `MATCH ${cql}` : `OPTIONAL MATCH ${cql}`;

                    //with_statements.push(`${key}: ${ $props ? ``}`)

                    queries.push(cql);
                }
            }

            return memo;
        }, {});

        //console.log(this.map);

        let cql = helpers.nodePattern({
            identifier: 'node',
            labels: parseLabels(this.labels()),
            data: { ...params },
        });

        let with_statement = `WITH node {.*, ${with_statements.join(',')}} AS node`;

        queries.splice(0, 0, cql);
        cql = queries.join('\r\n');

        cql = new Query()
            .match(cql)
            //.where('n.title = {title}', {title: 'The best title'})
            .add(with_statement)
            .return('node');

        cql = cql.toString();

        let inject = stringify(params);

        this.data = await driver.query({ model: this, cql }, {}, options); 
        
        return (typeof(options.normalize) === 'undefined' || options.normalize)  ? { normalized: this.normalize(), data: this.data } : { data: this.data };
    }

    labels() {
        let root = super.labels ? super.labels() : '';//this.__proto__.__proto__ ? this.__proto__.__proto__.labels : '';

        return `${root}${this.schema.title === '' ? '' : `:${this.schema.title || this.title}`}`;
    }
}

let init = (m) => {
    models = m;

    Object.entries(models).forEach(entry => {
        let [ name, constructor ] = entry;

        schemas[name] = new Schema.Entity(name, {}, { idAttribute: '_id' });

        let obj = new constructor();
        ajv.addSchema(obj.schema, name);
    });

    Object.entries(models).forEach(entry => {
        let [ name, constructor ] = entry;

        let obj = new constructor();
        maps[name] = { ...maps[name], ...obj.parseRefs() };
    })
};

module.exports = { BaseModel, init };
