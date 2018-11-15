/* 

*/
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
    useDefaults: true,
    extendRefs: true,
    $data: true
}

const ajv = new Ajv(config);
require('ajv-keywords')(ajv);

const schemas = {};
const maps = {};

class Model {
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
                    let schema = deepmerge(target.__proto__.__proto__.schema, origin);
                    //console.log(schema);
                    return schema;
                }
                
                return origin;
            }
        };

        return new Proxy(this, handler);
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
        const { title, properties } = this.schema;
      
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
                            links: module.exports[schemaName],
                            $rel
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
                                links: module.exports[schemaName],
                                $rel
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
    
        let map = define(properties);
    
        return map;
    }

    get title() {
        return this.constructor.name;
    }

    get schema() {
        return {
            title: '',
            type: 'object',
            required: [
                '_id'
            ],
            properties: {
                _id: {
                    type: 'integer'
                }
            }
        }
    }

    async find(params = {}, options = { /* skip: 0, limit: 10 */ }) {
        const helpers = require('decypher').helpers;
        const Query = require('decypher').Query;

        let queries = [];
        let lss = this.labels;

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
                            label: parseLabels((new map.links()).labels),
                            data: $link ? { ...$link } : void 0
                        }
                    });

                    queries.push(cql);
                }
            }

            return memo;
        }, {});

        console.log(this.map);

        let cql = helpers.nodePattern({
            identifier: 'node',
            labels: parseLabels(this.labels),
            data: { ...params },
        });

        queries.splice(0, 0, cql);
        cql = queries.join('\r\n');

        cql = new Query()
            .match(cql)
            //.where('n.title = {title}', {title: 'The best title'})
            .return('node');

        cql = cql.toString();

        let inject = stringify(params);

        return await driver.query({ model: this, cql }, {}, options); 
        
    }

    get labels() {
        let root = this.__proto__.__proto__ ? this.__proto__.__proto__.labels : '';

        return `${root}${this.schema.title === '' ? '' : `:${this.schema.title || this.title}`}`;
        //return `${this.schema.title === '' ? '' : `${this.schema.title || this.title}`}`;
    }
}

class Database extends Model {
    constructor(data) {
        super(data);
    }

    get schema() {
        let schema = {
            title: 'database',
            required: [
                'posts',
            ],
            properties: {
                posts: {
                    type: 'array',
                    items: {
                        $ref: 'Post'
                    }
                },
                arts: {
                    type: 'array',
                    items: {
                        $ref: 'Post'
                    }
                } 
            }
        }

        return schema;
    }
}

class Member extends Model {
    constructor(data) {
        super(data);
    }

    get schema() {
        let schema = {
            title: 'Участник',
            type: 'object',
            required: [
                'name',
            ],
            properties: {
                name: {
                    type: 'string'
                },
                hash: {
                    type: 'string'
                },
                ref: {
                    type: 'string'
                },
                group: {
                    type: 'string'
                },
                picture: {
                    type: 'string'
                },
                compressed: {
                    type: 'string'
                },
                country: {
                    type: 'string'
                },
                phone: {
                    type: 'string'
                },
                city: {
                    type: 'string'
                },
                donate: {
                    type: 'string'
                },
                referer: {
                    /* $rel: 'реферер',
                    $ref: 'Member' */
                
                    type: 'object',
                    required: [
                        '$link'
                    ],
                    properties: { 
                        $props: {
                            type: 'object',
                            required: [
                                'invite'
                            ],
                            properties: {
                                invite: {
                                    type: 'integer'
                                }
                            }
                        },
                        $link: {
                            $rel: 'реферер',
                            $ref: 'Member'
                        }
                    }
                    
                },
                referals: {
                    /* type: 'array',
                    items: {
                        $rel: 'реферал',
                        $ref: 'Member'
                    } */
                    $rel: 'реферал',
                    $ref: 'Member'
                } 
            }
        }

        return schema;
    }
}

class Email extends Model {
    constructor(data) {
        super(data);
    }

    get schema() {
        let schema = {
            title: 'Список',
            required: [
                'members',
            ],
            properties: {
                address: {
                    type: 'string'
                },
                pin: {
                    type: 'string'
                },
                verified: {
                    type: 'boolean'
                },
                member: {
                    $rel: 'принадлежит',
                    $ref: 'Member'
                } 
            }
        }

        return schema;
    }
}

class Post extends Model {
    constructor(data) {
        super(data);
    }

    get schema() {
        let schema = {
            title: this.title,
            required: [
                'title',
                'content'
                //'author'
            ],
            properties: {
                title: {
                    type: 'string'
                },
                content: {
                    type: 'string'
                },
                author: {
                    $rel: 'написал',
                    $ref: 'Person'
                },
                comments: {
                    type: 'array',
                    items: {
                        $rel: 'получил',
                        $ref: 'Comment'
                    }
                } 
            }
        }

        return schema;
    }
}

class Comment extends Model {
    constructor(data) {
        super(data);
    }

    get schema() {
        let schema = {
            title: 'Comment',
            type: 'object',
            required: [
                //'author',
                'content'
            ],
            properties: {
                _id: {
                    type: 'integer'
                },
                content: {
                    type: 'string'
                },
                author: {
                    $ref: 'Person'
                }
            }
        }

        return schema;
    }
}

class Person extends Model {
    constructor(data) {
        super(data);
    }

    get schema() {
        let schema = {
            title: 'Person',
            type: 'object',
            description: 'A comment containing content & author',
            required: [
                'firstName',
                'lastName'
            ],
            properties: {
                firstName: {
                    type: 'string'
                },
                lastName: {
                    type: 'string'
                },
                posts: {
                    type: 'array',
                    items: {
                        $ref: 'Post'
                    }
                },
                __relations__: {
                    type: 'object',
                    properties: { 
                        parent: {
                            $ref: 'Person'
                        }
                    }
                },
                /* best_friend: {
                    $ref: '#/definitions/Friend'
                }, */
                best_friend1: {
                    $ref: 'Person',
                    $props: {
                        type: 'object',
                        properties: {
                            since: 'integer'
                        }
                    }
                },
                /* friends: {
                    type: 'array',
                    items: {
                        $ref: '#/definitions/Friend'
                    }
                },  */
                best_friend1: {
                    $ref: 'Person',
                    $props: {
                        type: 'object',
                        properties: {
                            since: 'integer'
                        }
                    }
                },
                
                /* wife: {
                    type: 'object',
                    required: [
                        'since', 'till', '$link'
                    ],
                    properties: { 
                        since: {
                            type: 'integer'
                        },
                        till: {
                            type: 'integer'
                        },
                        $link: {
                            $ref: '#/definitions/Person'
                        }
                    }
                } */
                /* wives: { 
                    type: 'array',
                    items: {
                        $ref: '#/definitions/wife'
                    }
                }, */
                wife: {
                    type: 'object',
                    required: [
                        '$link'
                    ],
                    properties: { 
                        $props: {
                            type: 'object',
                            required: [
                                'since', 'till'
                            ],
                            properties: {
                                since: {
                                    type: 'integer'
                                },
                                till: {
                                    type: 'integer'
                                },
                            }
                        },
                        $link: {
                            $ref: 'Person'
                        }
                    }
                },
                wife1: {
                    $ref: 'Person'    
                },
                
                wives: { //WORKING VARIANT
                    type: 'array',
                    items: {
                        type: 'object',
                        required: [
                            '$link'
                        ],
                        properties: { 
                            $props: {
                                type: 'object',
                                required: [
                                    'since', 'till'
                                ],
                                properties: {
                                    since: {
                                        type: 'integer'
                                    },
                                    till: {
                                        type: 'integer'
                                    },
                                }
                            },
                            $link: {
                                $ref: 'Person'
                            }
                        }
                    }
                }
            }
        }

        return schema;
    }
}

module.exports = { Database, Post, Comment, Person, Member, Email };

Object.entries(module.exports).forEach(entry => {
    let [ name, constructor ] = entry;

    schemas[name] = new Schema.Entity(name, {}, { idAttribute: '_id' });

    let obj = new constructor();
    ajv.addSchema(obj.schema, name);
});

Object.entries(module.exports).forEach(entry => {
    let [ name, constructor ] = entry;

    let obj = new constructor();
    maps[name] = { ...maps[name], ...obj.parseRefs() };
});