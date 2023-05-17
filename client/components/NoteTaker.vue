<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{ paperURL: string, existingNotes: string }>();
const notes = ref(props.existingNotes);
const proxyURL = computed(() => {
    return "/paper?url=" + encodeURIComponent(props.paperURL);
});
</script>

<template>
    <div id="readingModal">
        <embed id="paper" :src="proxyURL" type="application/pdf" />
        <textarea id="notes" v-model="notes"></textarea>
    </div>
</template>

<style lang="scss">
#readingModal {
    display: flex;
    position: fixed;
    height: 95%;
    width: 95%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-color: #fffa;
}

#paper {
    width: 60%;
    height: 100%;
}

#notes {
    width: 40%;
    height: 100%;
}
</style>
