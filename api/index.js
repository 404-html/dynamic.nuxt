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

/* const multer  = require('multer');

const storage = multer.memoryStorage();
const blobUpload = multer({ 
    storage,
    limits: {
        fileSize: 1024 * 6024
    }
}); */

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
            //res.writeHead(303, { Connection: 'close', Location: '/' });
            //res.end();
            next();
        });
    
        req.pipe(busboy);
        /* let none = blobUpload.any();
        none(req, res, (err) => {
            req.blob = {
                err,
                files: req.files
            }

            next();
        }); */
    }
    else next();
};

///////////////////////////////////////////////////////////////////////////////////////
const api = require('./classes');

function hasMethod(obj, name) {
    const desc = Object.getOwnPropertyDescriptor(obj, name);
 
    return !!desc && typeof desc.value === 'function';
}

function getClassMethodNames(Class, stop = Object.prototype) {
    let array = [];
    let proto = Class.prototype;

    while (proto && proto !== stop) {
        Object.getOwnPropertyNames (proto).forEach (name => {
            if (name !== 'constructor' && name.slice(0, 1) !== '_') {
                if (hasMethod(proto, name)) {
                    array.push (name);
                }
            }
        });

        proto = Object.getPrototypeOf(proto);
    }

    return array;
}

router.all('/_server_', (req, res) => {
    console.log('request');
    
    let class_body = '';

    for(let class_instance in api) {
        const instance = api[class_instance];
        const name = instance.name.toLowerCase();

        let methods = '';

        for(let key of getClassMethodNames(instance)) {
            
            methods = methods + `${key}: async (params = {}, options = {}) => {
                
                //debugger
                let config = {
                    context: this.context,
                    endpoint: '/${name}.${key}',
                    method: 'post',
                    payload: params
                };

                config = { ...config, ...options };

                let response = await this.execute(config);

                return response && response.data; 
            },
            `        
        
        }

        class_body = class_body + `get ${name}() {
            return {
                ${methods}
            }
        }
        `
    }

    const code = `
        class Server {
            constructor(args) {
                this.execute = args.execute;
                this.context = args.context;
            }

            ${class_body}
        }
        
        return Server;`

    res.end(code);
})

let patterns = ['/:type\::id\.:action', '/:type\.:action', '/:type\::id', '/:type'];

router.all(patterns, multipartDetector, (req, res) => {
    console.log('request');
    
    let { type, id, action } = req.params;

    let object = new api[type]('token');

    let result = object[action](req.body, { req, res });

    res.locals.sendAsFile ? res.sendFile(result) : res.json(result);
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
