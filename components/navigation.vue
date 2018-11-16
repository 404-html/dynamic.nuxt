<template>
    <div>
        <v-navigation-drawer
      :mini-variant="miniVariant"
      :clipped="clipped"
      v-model="drawer"
      fixed
      app
    >
      <v-list>
        <v-list-tile
          v-for="(item, i) in items"
          :to="item.to"
          :key="i"
          router
          exact
        >
          <v-list-tile-action>
            <v-icon v-html="item.icon" />
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title v-text="item.title"/>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>

    <v-toolbar
      :clipped-left="clipped"
      flat
      app
      dense
    >
    

      <v-toolbar-side-icon @click="drawer = !drawer" />
      <v-btn
        icon
        @click.stop="miniVariant = !miniVariant"
      >
        <v-icon v-html="miniVariant ? 'chevron_right' : 'chevron_left'" />
      </v-btn>
      <v-btn
        icon
        @click.stop="clipped = !clipped"
      >
        <v-icon>web</v-icon>
      </v-btn>
      <v-btn
        icon
        @click.stop="fixed = !fixed"
      >
        <v-icon>remove</v-icon>
      </v-btn>
      
      <v-btn
        icon
        @click.stop="call"
      >
        <v-icon>add</v-icon>
      </v-btn>
      <v-btn
        icon
        @click.stop="call1"
      >
        <v-icon>add</v-icon>
      </v-btn>
      <v-btn
        icon
        @click.stop="call2"
      >
        <v-icon>add</v-icon>
      </v-btn>
      

      <v-toolbar-title v-text="title"/>
      <v-btn
        icon
        @click.stop="rightDrawer = !rightDrawer"
      >
        <v-icon>menu</v-icon>
      </v-btn>
    </v-toolbar>
    </div>
</template>

<script>
export default {
    data() {
        return {
            clipped: true,
            drawer: false,
            fixed: false,
            items: [
                { icon: 'apps', title: 'Welcome', to: '/' },
                { icon: 'bubble_chart', title: 'Inspire', to: '/inspire' },
                { icon: 'bubble_chart', title: 'Destiny', to: '/destiny' }
            ],
            miniVariant: true,
            right: true,
            rightDrawer: false,
            title: 'Vuetify.js'
        }
    },
    methods: {
        async call() {
        
            let { title } = await this.$server.member.echo({ title: 'hi, all' })
            let { normalized } = await this.$server.member.get({ referer: { $link: { _id: 1326 }}, referals: true });

            console.log('entities', this.$store.state.entities);

            this.title = title;
        },
        async call1() {
            try {
                let res = await this.$server.member.error({ title: 'hi, all' }, { redirectOnError: false });
                this.title = res;
            }
            catch(err) {
                debugger
                this.$nuxt.error(err);
            }
        },
        async call2() {
            await this.$server.member.age({ title: 'hi, all' }, { cache: false })
            
        }
    }
}
</script>