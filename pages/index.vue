<template>
    <v-layout column justify-center align-center>
        <v-flex xs12 sm8 md6>
            <div>HELLO</div>
            <no-ssr>

                    <!-- initial-image="https://zhanziyang.github.io/vue-croppa/static/500.jpeg" -->
                <croppa v-model="croppa"
                    :width="150"
                    :height="150"
                    
                    prevent-white-space
                    initial-image="/api/member._avatar"
                    
                    :canvas-color="'default'"
                    :placeholder="'Choose an image'"
                    :placeholder-font-size="14"
                    :placeholder-color="'default'"
                    :accept="'image/*'"
                    :file-size-limit="0"
                    :quality="2"
                    :zoom-speed="30"
                    :disabled="false"
                    :disable-drag-and-drop="false"
                    :disable-click-to-choose="false"
                    :disable-drag-to-move="false"
                    :disable-scroll-to-zoom="false"
                    :disable-rotation="false"

                    :reverse-scroll-to-zoom="false"
                    :show-remove-button="true"
                    :remove-button-color="'black'"
                    :remove-button-size="24"
                    @init="onInit"
                >
                    
                </croppa>
            </no-ssr>
            
            <v-btn icon @click="upload">
                <v-icon >fas fa-user</v-icon>
            </v-btn>

        </v-flex>
    </v-layout>
</template>

<script>

export default {
    async asyncData({ app }) {
        /* debugger    
        return {
            ava: await app.$server.member.avatar()
        } */
    },
    data() {
        return {
            croppa: {}
        }
    },
    created() {
        console.log('CREATED index')
    },
    methods: {
        async avatar() {
            return await this.$server.member.avatar();
        },
        onInit() {
            this.croppa.addClipPlugin(function (ctx, x, y, w, h) {
                ctx.beginPath()
                ctx.arc(x + w / 2, y + h / 2, w / 2, 0, 2 * Math.PI, true)
                ctx.closePath()
            });
        },
        async upload() {
            let blob = await this.croppa.promisedBlob();

            var data = new FormData();

            data.append('avatar', blob, 'ava.jpg')
            data.append('other', 'blahblahblah');
            data.append('name', 'me');
            data.append('blob', new Blob([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 'document.pdf');

            await this.$server.member.formData(data, { cache: false });

            this.croppa.refresh();
        }
    }
}
</script>

<style scoped>
.croppa-container {
    background-color: transparent;
}
</style>
