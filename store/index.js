import Vue from 'vue';

import deepmerge from 'deepmerge';

export const getters = {

};

export const mutations = {
    INCREMENT_RELOAD_KEY(state) {
        state.reload_key++;
        /* state.reload_key = !state.reload_key;
        this.$nextTick();
        state.reload_key = !state.reload_key; */
    },
    
    SET_ENTITIES(state, { data, query }) {
        //debugger
        let entities = data;

        if(entities) {
            /* Object.keys(entities).forEach(entity => {
                entity !== 'database' && (state.entities[entity] = {});
            }); */
            //debugger;
            if(query.replace) {
                Object.keys(entities).forEach(entity => {
                    entity !== 'database' && (state.entities[entity] = {});
                });
            }

            let merge = {};
            if(Object.keys(entities).length) {
                merge = deepmerge(state.entities, entities || {}, {
                    arrayMerge: function (destination, source, options) {
                        //return destination.length ? destination : source;
                        //debugger;
                        //ALL ARRAYS MUST BE SIMPLE IDs HOLDER AFTER NORMALIZE
                        if(query.method.toUpperCase() === 'DELETE') {
                            if(destination.length) {
                                return destination.filter(id => source.indexOf(id) === -1);
                            }
                            else {
                                return source;
                            }
                        }
    
                        let a = new Set(destination);
                        let b = new Set(source);
                        let union = Array.from(new Set([...a, ...b]));
    
                        return union;
                    }
                });
            }

            Object.keys(merge).length && Vue.set(state, 'entities',  merge);

            //Vue.set(state, 'entities',  entities);
        }
    }
};

export const actions = {
    async nuxtServerInit (context, { req }) {
        /* this._actions.api = this._actions.api || [async (params) => {
            
            let response = await this.$axios({ url: '/_server_' });
            
            const Server = (new Function(response.data))();
            let server = new Server('heloo');
            server.log();

            console.log(response.data, params);

        }]; */
        
        //context.dispatch('api', {id: 0});
        try {
            let name = await this.$server.member.echo({ name: 'hello', add: { my: 'friend' }}, { cache: false });
            console.log(name)
        }
        catch(err) {
            console.error(err);
        }

        //console.log(name)
    },

    
    
};

export const state = () => ({
    reload_key: 1,
    entities: {
        
    }
});
