import axios from 'axios';

const start = () => {
    if(process.browser) {
        window.$nuxt && window.$nuxt.$root.$loading.start();
    }
}

const stop = () => {
    if(process.browser) {
        window.$nuxt && window.$nuxt.$root.$loading.finish();
    }
}

export default (context, inject) => {
    
    const api = axios.create({
        baseURL: process.env.baseURL,
    });

    let onRequest = (config => {
        //debugger;
        start();
        
        //const token = context.app.$cookies.get('token');
        //token && (config.headers.Authorization = `Bearer ${token}`);
        
        return config;
    });

    let onResponse = (async response => {
        stop();

        //const token = response && response.headers && response.headers.token;
        return response;
    });

    let onError = (error => {

        //error.response && context.error({ statusCode: error.response.status, message: error.response.data });
        console.error(error);

        stop();
        
        throw error;
    });

    api.interceptors.request.use(onRequest, onError);
    api.interceptors.response.use(onResponse, onError);

    context.$axios = api;
    inject('axios', api);
}
