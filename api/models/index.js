/* 

*/
import Ajv from 'ajv';
import deepmerge from 'deepmerge';
import { schema as Schema, normalize } from 'normalizr';

import { driver } from './db';

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
                const { $ref, type, items } = props[key]
    
                let deep = ['array', 'object'].includes(type);
                deep && type === 'array' && !Array.isArray(props[key].items) && (deep = false);
    
                if(!deep) {
                    if ($ref) {
                        let schemaName = $ref.replace('#/definitions/', '');
                                            
                        this._schema.define(parent ? { [parent]: parent_type === 'array' ? [{ [key]: schemas[schemaName] }] : { [key]: schemas[schemaName] }} : parent_type === 'array' ? [{ [key]: schemas[schemaName] }] : { [key]: schemas[schemaName] });
                        
                        let path = parent ? `${parent}.${key}` : `${key}`;
                        map[path] = {
                            type: parent_type || 'object',
                            links: schemaName
                        }
    
                    } else if (type === 'array' && items) {
                        if(items.$ref) {
                            let schemaName = items.$ref.replace('#/definitions/', '');
    
                            this._schema.define(parent ? { [parent]: { [key]: [schemas[schemaName]] }} : { [key]: [schemas[schemaName]] });
    
                            let path = parent ? `${parent}.${key}` : `${key}`;
                            map[path] = {
                                type: 'array',
                                links: schemaName
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
            title: this.title,
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

    async find() {
        return await driver.query('MATCH (n :Участник) RETURN n LIMIT 10');
    }
}

class Database extends Model {
    constructor(data) {
        super(data);
    }

    get schema() {
        let schema = {
            title: this.title,
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
                    $ref: 'Person'
                },
                comments: {
                    type: 'array',
                    items: {
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

module.exports = { Database, Post, Comment, Person };

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