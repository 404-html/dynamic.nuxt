import express from 'express'

//import jwt from 'express-jwt'
//import jsonwebtoken from 'jsonwebtoken'

//import axios from 'axios';

// Create express router
const router = express.Router();

// Transform req & res to have the same API as express
// So we can use res.status() & res.json()
const app = express();

router.use(express.json());

router.use((req, res, next) => {
    Object.setPrototypeOf(req, app.request);
    Object.setPrototypeOf(res, app.response);

    req.res = res;
    res.req = req;

    next();
});

///////////////////////////////////////////////////////////////////////////////////////

const Busboy = require('busboy');
const MemoryStream = require('memorystream');

let multipartDetector = function(req, res, next) {
    if(req.headers['content-type'] && req.headers['content-type'].indexOf('multipart/form-data') !== -1) {

        let busboy = new Busboy({ headers: req.headers });
    
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

            let memStream = new MemoryStream();

            file.on('data', function(data) {
                console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
            });

            file.on('end', function(...args) {
                console.log('File [' + fieldname + '] Finished', args);
                req.body['files'] = req.body['files'] || {};
                req.body.files[fieldname] = {
                    filename,
                    encoding, 
                    mimetype,
                    stream: memStream
                }
            });

            file.pipe(memStream);
        });

        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            console.log('Field [' + fieldname + ']: value: ' + val, fieldnameTruncated, valTruncated, encoding, mimetype);
            req.body[fieldname] = val;
        });
    
        busboy.on('finish', function() {
            console.log('Done parsing form!');

            next();
        });
    
        req.pipe(busboy);

    }
    else next();
};

///////////////////////////////////////////////////////////////////////////////////////

let raw_data = 
{
    _id: 0,
    posts: [
        {
            _id: 42,
            title: 'Lorem Ipsum',
            content: 'Lorem ipsum dolor sit amet.',
            author: {
                _id: 515,
                firstName: 'John',
                lastName: 'Doe',
                posts: [
                    {
                        _id: 42,
                        title: 'Lorem Ipsum',
                        content: 'Lorem ipsum dolor sit amet.',
                        author: {
                            _id: 515,
                            firstName: 'John',
                            lastName: 'Doe'
                        }
                    }
                ]
            },
            comments: [
                {
                    _id: 1,
                    content: 'This is really good',
                    author: {
                        _id: 313,
                        firstName: 'Jane',
                        lastName: 'Doe'
                    }
                },
                {
                    _id: 2,
                    content: 'So helpful, much wow',
                    author: {
                        _id: 211,
                        firstName: 'John',
                        lastName: 'Snow',
                        __relations__: {
                            parent: {
                                _id: 515,
                                firstName: 'John',
                                lastName: 'Doe'
                            }
                        },
                        best_friend: {
                            _id: -515,
                            since: 2000,
                            relation: {
                                _id: 313,
                                firstName: 'Jane',
                                lastName: 'Doe'
                            }
                        },
                        best_friend1: {
                            _id: 313,
                            firstName: 'Jane',
                            lastName: 'Doe',
                            $props: {
                                since: 2000,
                            }
                        }
                    }
                },
                {
                    _id: 3,
                    content: 'Thanks for the kind words',
                    author: {
                        _id: 515,
                        firstName: 'John',
                        lastName: 'Doe',
                        wife: {
                            $props: {
                                since: 2006,
                                till: 2015,
                                fix: true
                            },
                            $link: {
                                _id: 313,
                                firstName: 'Jane',
                                lastName: 'Doe'
                            }
                        },
                        wife1: {
                            fix: true,
                            _id: 313,
                            firstName: 'Jane',
                            lastName: 'Doe'
                        },
                        wives: [
                            {
                                _id: -211001,
                                $props: {
                                    since: 2006,
                                    till: 2015,
                                    fix: true
                                },
                                $link: {
                                    _id: 313,
                                    firstName: 'Jane',
                                    lastName: 'Doe'
                                }
                            },
                            {
                                _id: -211000,
                                $props: {
                                    since: 2001,
                                    till: 2005,
                                },
                                $link: {
                                    _id: 313,
                                    firstName: 'Jane',
                                    lastName: 'Doe'
                                }
                            },
                        ],
                        friends: [
                            {
                                _id: -211,
                                since: 2005,
                                relation: {
                                    _id: 211,
                                    firstName: 'John',
                                    lastName: 'Snow'
                                }
                            },
                            {
                                _id: -313,
                                since: 2006,
                                relation: {
                                    _id: 313,
                                    firstName: 'Jane',
                                    lastName: 'Doe'
                                }
                            }
                        ]
                    }
                }
            ],
            tags: [
                'lorem',
                'ipsum'
            ]
        }
    ]
}

const person2person_schema = {
    title: 'Friend',
    type: 'object',
    description: '',
    required: [
    ],
    properties: {
        _id: {
            type: 'integer',
            default: -1
        },
        since: {
            type: 'integer'
        },
        relation: {
            $ref: '#/definitions/Person'
        }
    }
}

const wife_link_schema = {
    title: 'wife',
    type: 'object',
    description: '',
    required: [
        '_id', '$link'
    ],
    additionalProperties: false,
    properties: {
        _id: {
            type: 'integer',
        },
        $props: {
            type: 'object',
            required: [
                'since', 'till'
            ],
            additionalProperties: false,
            properties: {
                since: {
                    type: 'integer'
                },
                till: {
                    type: 'integer'
                }
            }
        },
        $link: {
            $ref: '#/definitions/Person'
        }
    }
}


    let res = (async () => {
        try {
            const { Database, Member } = require('./models');
            let database = new Database({ data: raw_data });
            let normalized_data = database.normalize();

            console.log(JSON.stringify(normalized_data, void 0, 2));

            let member = new Member();
            let data = await member.find({ _id: 2580, referer: { $link: { _id: 2222 }}, referals: true });
            return data;
        }
        catch(err) {
            console.err(err);
        }

        return await database.find({ _id: 0 });
    })();

///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////

class JWT {
    constructor({ public_key, private_key }) {
        this.jwt = require('jsonwebtoken');
    }

    sign(payload, private_key, options = {algorithm: 'RS256', expiresIn: process.env.TOKEN_EXPIRATION_TIME || '3600s'}) {
        delete payload.iat;
        delete payload.exp;

        return this.jwt.sign(payload, private_key, options);
    }

    verify(token, public_key) {
        let payload = jwt.decode(token);

        try {
            jwt.verify(token, public_key);
        }
        catch(err) {
            err.name === 'TokenExpiredError' && (payload.expired = true);
        };

        return payload;
    }

    refresh(payload, private_key) {
        return this.sign(payload, private_key);
    }

    revoke() {
        //NOT IMPLEMETED YET
    }
}

///////////////////////////////////////////////////////////////////////////////////////
const { types, code } = require('./classes');

router.all('/_server_', (req, res) => {
    console.log('request');

    res.end(code);
})

let patterns = ['/:type\::id\.:action', '/:type\.:action', '/:type\::id', '/:type'];

router.all(patterns, multipartDetector, async (req, res, next) => {

    let { type, id, action } = req.params;

    let object = new types[type]('token');

    try {
        let result = await object[action](req.body, { req, res });

        res.locals.sendAsFile ? res.sendFile(result) : res.json(result);
    }
    catch(err) {
        next(err);
    }
})

router.use((err, req, res, next) => {
        if (err.name === 'UnauthorizedError') {
            res.status(401).send('invalid token...');
        }
        else {            
            res.status(err.httpStatusCode || err.code || 400).end(err.toString());
        }
    }
);

process.on('unhandledRejection', err => {
    console.log('unhandledRejection => ', err);
});

// Export the server middleware
export default {
    path: '/api',
    handler: router
}
