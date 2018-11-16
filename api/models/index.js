/* 

*/
import { schema as Schema } from 'normalizr';

const { BaseModel, init } = require('./base_model');

class Model extends BaseModel {
    constructor(data) {
        super(data)
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
}

class Database extends Model {
    constructor(data) {
        super(data);
    }

    get schema() {
        let schema = {
            title: 'database',
            required: [
                //'posts',
            ],
            properties: {
                posts: {
                    type: 'array',
                    items: {
                        $ref: 'Post'
                    }
                },
                members: {
                    type: 'array',
                    items: {
                        $ref: 'Member'
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
            type: 'array',
            items: {

            type: 'object',
            required: [
                'name', 'referer'
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
                    default: {},

                    type: 'object',
                    properties: { 
                        $props: {
                            type: 'object',
                            required: [
                                //'invite'
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
                                    //'invite'
                                ],
                                properties: {
                                    номер: {
                                        type: 'integer'
                                    }
                                }
                            },
                            $link: {
                                $rel: 'реферал',
                                $ref: 'Member'
                            }
                        }
                    }
                } 
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

init(module.exports);

/* Object.entries(module.exports).forEach(entry => {
    let [ name, constructor ] = entry;

    schemas[name] = new Schema.Entity(name, {}, { idAttribute: '_id' });

    let obj = new constructor();
    ajv.addSchema(obj.schema, name);
});

Object.entries(module.exports).forEach(entry => {
    let [ name, constructor ] = entry;

    let obj = new constructor();
    maps[name] = { ...maps[name], ...obj.parseRefs() };
}); */