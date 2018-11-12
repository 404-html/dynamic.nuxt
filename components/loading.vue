<template lang="html">
    <div class="loader-overlay" v-if="loading" @click.prevent.stop>
        <div style="" class="spinner spinner--circle-4"/>
    </div>
</template>

<script>
export default {
    data: () => ({
        loading: false
    }),
    methods: {
        start () {
            this.loading = true
        },
        finish () {
            this.loading = false
        }
    }
}
</script>

<style scoped>
    .loader-overlay::before {
        background-color: #212121;
    }

    .loader-overlay {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        z-index: 999;
    }

    .spinner {
        position: fixed;
        z-index: 999;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto;
        width: 60px;
        height: 60px;
        box-sizing: border-box;
        /*position: relative;*/
        border: 3px solid transparent;
        border-top-color: #2196F3;
        border-radius: 50%;
        animation: circle-4-spin 2s linear infinite;
    }
    .spinner:before, .spinner:after {
        content: '';
        box-sizing: border-box;
        position: absolute;
        border: 3px solid transparent;
        border-radius: 50%;
    }

    .spinner:before {
        border-top-color: #607D8B;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        animation: circle-4-spin 3s linear infinite;
    }

    .spinner:after {
        border-top-color: #4CAF50;
        top: 6px;
        left: 6px;
        right: 6px;
        bottom: 6px;
        animation: spin 4s linear infinite;
    }

    @keyframes circle-4-spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
