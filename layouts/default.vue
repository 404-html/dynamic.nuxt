<template>
  <v-app>
    <navigation/>

    <!-- <nuxt /> -->
    <v-content>
      <v-container >
        <nuxt v-if="!$nuxt.nuxt.err" :key="$store.state.reload_key" keep-alive/>
        <nuxt v-if="$nuxt.nuxt.err" key="9999"/>
        
      </v-container>
    </v-content>
    <!-- <v-navigation-drawer
      :right="right"
      v-model="rightDrawer"
      temporary
      fixed
    >
      <v-list>
        <v-list-tile @click.native="right = !right">
          <v-list-tile-action>
            <v-icon light>compare_arrows</v-icon>
          </v-list-tile-action>
          <v-list-tile-title>Switch drawer (click me)</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer> -->
    <!-- <v-footer
      :fixed="fixed"
      app
    >
      <span>&copy; 2017</span>
    </v-footer> -->
  </v-app>
</template>

<script>
export default {
    components: {
        navigation: () => import('@/components/navigation.vue')
    }
}
</script>
