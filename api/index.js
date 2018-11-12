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

function Model (schema) {
    schema = { ...schema, _id: {
        type: Integer
    }};
    
    return {
        find: () => {

        },

        findOne: async () => {

        },

        query: async () => {

        },

        save: async () => {

        },

        update: async () => {

        },

        delete: async () => {

        }
    }

}

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
