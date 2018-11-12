<template>
<v-dialog
      v-model="dialog"
      width="500"
    >
    <v-card>
        <v-card-title class="headline">Something went wrong...</v-card-title>

        <v-card-text>
            
            <h1 v-if="err.status === 404">Page not found</h1>
            <div v-else>
                <h1>An error occurred</h1>
                <h4 v-html="err"></h4>
            </div>

        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn flat tag="a" @click.native="close">Home page</v-btn>
            <!-- <v-btn flat @click="close">Close</v-btn> -->
        </v-card-actions>
      </v-card>

    <!-- <div class="__nuxt-error-page1">
        <v-flex xs12 sm8 md6>
            <h1 v-if="error.statusCode === 404">Page not found</h1>
            
            <div v-else>
                <h1>An error occurred</h1>
                <h4 v-html="err"></h4>
            </div>

            <v-btn flat tag="a" @click.native="reload">Home page</v-btn>
            <v-btn flat @click="dialog = false">Close</v-btn>
            
        </v-flex>
    </div> -->
</v-dialog>
    <!-- <v-content>
      <v-container>
        <div class="container">
            <h1 v-if="error.statusCode === 404">Page not found</h1>
            
            <div v-else>
                <h1>An error occurred</h1>
                <h4 v-html="error"></h4>
            </div>

            <nuxt-link to="/" @click="$router.go('/')">Home page</nuxt-link>
        </div>
      </v-container>
    </v-content> -->
</template>

<script>
export default {
    //layout: 'dark',
    loading: false,
    props: {
        error: {
            default: null
        }
    },
    data: () => ({
        dialog: false
    }),
    watch: {
        dialog(val) {
            !val && this.close();
            //!val && this.$destroy();
            //!val && setTimeout(() => {
            //    this.$store.commit('INCREMENT_RELOAD_KEY');
            //}, 1000)
        }
    },
    created() {
        console.log('CREATED error');
        this.dialog = true;
    },
    computed: {
        err() {
            if(this.error.response) {
                let { data, status, statusText } = this.error.response;

                return { data, status, statusText };
            }

            return this.error;
        }
    },
    methods: {
        close() {
            this.dialog = false;
            this.$nuxt.nuxt.err = void 0;
            this.$router.push('/');
        },
        reload() {
            this.$route.path === '/' ? this.$router.go('/') : this.$router.push('/');
        }
    }
}
</script>

<style scoped>
.__nuxt-error-page {
    padding: 1rem;
    /* background: #F7F8FB; */
    color: #47494E;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-family: sans-serif;
    font-weight: 100 !important;
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

</style>
