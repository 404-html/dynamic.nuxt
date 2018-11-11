require('dotenv').config({
    path: '.env.local'
});

const pkg = require('./package')

module.exports = {
    mode: 'universal',

    server: {
        port: process.env.NUXT_HOST,
        host: process.env.NUXT_PORT
    },

    env: {
        baseURL: `${process.env.API_PROTOCOL || 'http'}://${process.env.API_HOST || 'localhost'}${process.env.API_PORT ? ':' + process.env.API_PORT : ''}${process.env.API_SUFFIX}`
    },

    /*
    ** Headers of the page
    */
    head: {
        title: pkg.name,
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { hid: 'description', name: 'description', content: pkg.description }
        ],
        link: [
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
            { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Roboto+Condensed:300,400,500,700|Material+Icons' },
            { rel: 'stylesheet', href: "https://use.fontawesome.com/releases/v5.3.1/css/all.css", integrity: "sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU", crossorigin: "anonymous" },
        ]
    },

    /*
    ** Customize the progress-bar color
    */
    loading: '~/components/loading.vue',

    /*
    ** Global CSS
    */
    css: [
        '~assets/custom.css'
    ],

    /*
    ** Plugins to load before mounting the App
    */
    plugins: [
        '@/plugins/axios',
        '@/plugins/server_api',
        '@/plugins/vuetify',
        '@/plugins/croppa',
    ],

    /*
    ** Nuxt.js modules
    */
    modules: [
    ],

    /*
    ** Build configuration
    */
    build: {
        /*
        ** You can extend webpack config here
        */
        vendor: ['axios', 'vuetify'],

        extend (config, { isDev, isClient }) {
            isDev && isClient && (config.devtool = 'eval-source-map');
        }
    },

    serverMiddleware: [
        '~/api'
    ],
}
