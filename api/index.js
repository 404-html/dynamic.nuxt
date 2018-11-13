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
    "id": 1,
    "posts": [
        {
            "id": 42,
            "title": "Lorem Ipsum",
            "content": "Lorem ipsum dolor sit amet.",
            "author": {
                "id": 515,
                "firstName": "John",
                "lastName": "Doe",
                "posts": [
                    {
                        "id": 42
                    }
                ]
            },
            "comments": [
                {
                    "id": 1,
                    "content": "This is really good",
                    "author": {
                        "id": 313,
                        "firstName": "Jane",
                        "lastName": "Doe"
                    }
                },
                {
                    "id": 2,
                    "content": "So helpful, much wow",
                    "author": {
                        "id": 211,
                        "firstName": "John",
                        "lastName": "Snow"
                    }
                },
                {
                    "id": 3,
                    "content": "Thanks for the kind words",
                    "author": {
                        "id": 515,
                        "firstName": "John",
                        "lastName": "Doe"
                    }
                }
            ],
            "tags": [
                "lorem",
                "ipsum"
            ]
        }
    ]
}

const database_schema = {
    "title": "Database",
    "type": "object",
    "description": "An entire database",
    "required": [
        /* "id",
        "title",
        "author" */
    ],
    "additionalProperties": false,
    "properties": {
        "id": {
            "type": "integer"
        },
        /* "title": {
            "type": "string"
        },
        "content": {
            "type": "string"
        },
        "author": {
            "$ref": "#/definitions/Person"
        }, */
        "posts": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/Post"
            }
        }
    }
}
const post_schema = {
    "title": "Post",
    "type": "object",
    "description": "A blog post containing title, content, author & comments",
    "required": [
        "id",
        "title",
        "author"
    ],
    "additionalProperties": false,
    "properties": {
        "id": {
            "type": "integer"
        },
        "title": {
            "type": "string"
        },
        "content": {
            "type": "string"
        },
        "author": {
            "$ref": "#/definitions/Person"
        },
        "comments": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/Comment"
            }
        }
    }
}

const comment_schema = {
    "title": "Comment",
    "type": "object",
    "description": "A comment containing content & author",
    "required": [
        "id",
        "author",
        "content"
    ],
    "properties": {
        "id": {
            "type": "integer"
        },
        "content": {
            "type": "string"
        },
        "author": {
            "$ref": "#/definitions/Person"
        }
    }
}

const person_schema = {
    "title": "Person",
    "type": "object",
    "description": "A comment containing content & author",
    "required": [
        "id",
        "firstName",
        "lastName"
    ],
    "properties": {
        "id": {
            "type": "integer"
        },
        "firstName": {
            "type": "string"
        },
        "lastName": {
            "type": "string"
        },
        "posts": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/Post"
            }
        }
    }
}

//const { loadSchemas, normalize } = require('json-schema-normalizer');
const { loadSchemas, normalize } = require('./jsonnormalizer');

// Pass an array of schemas to define them
loadSchemas([person_schema, post_schema, comment_schema, database_schema]);

// Then call normalize with schema name & your denormalized data
const normalized_data = normalize('Database', raw_data);

console.log(normalized_data);
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
