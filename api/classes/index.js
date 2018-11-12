const base = require('./base');
const auth = require('./auth');
const project = require('./project');

let classes = {
    ...base,
    ...auth,
    ...project
}

const types = Object.entries(classes).reduce((memo, item) => {
    memo[item[0].toLowerCase()] = item[1];
    
    return memo;
}, {});

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

const code = () => {
    let class_body = '';

    for(let class_instance in types) {
        const instance = types[class_instance];
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

    return code;
}

module.exports = {
    types,
    code: code()
}