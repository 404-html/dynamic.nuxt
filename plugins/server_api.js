import { Cache } from 'axios-extensions';

const axios_cache = new Cache();

let execute = async ({ context, cache = true, method = 'get', endpoint = '/', payload, headers, redirectOnError = true }) => {
    let { $axios, error } = context;

    cache = cache && process.browser; //USE CACHE IN BROWSER ONLY
    //let key = `${method}:${endpoint}`;
    let key = `${endpoint}`;
    let response = cache && axios_cache.get(key);

    if(!response) {
        headers = headers || {};

        let config = {
            url: endpoint,
            method,
            headers,
            cache
        };

        config.method === 'get' ? config.params = payload : config.data = payload;

        try {
            debugger
            response = await $axios(config);

            cache && axios_cache.set(key, response);

            let { data, data: { flags } } = response;
            //let { flags } = data;

            flags && flags.auto_merge && data[flags.auto_merge] && context.store.commit('SET_ENTITIES', { data: data[flags.auto_merge].entities });
        }
        catch (err) {
            if(redirectOnError) {
                error(err)
            }
            else throw err;
        }

    }

    return response;
} 

export default async (context, inject) => {
    let response = await context.$axios({ url: '/_server_' });
            
    const Server = (new Function(response.data))();
    
    const server = new Server({ execute, context });

    context.$server = server;
    inject('server', server);
}
