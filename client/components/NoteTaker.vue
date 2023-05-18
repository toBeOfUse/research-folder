<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { Paper } from '../../data/entities';
import { getPublicationDate } from '../code/dataUtilities';
import { remult } from 'remult';

const props = defineProps<{ paper: Paper }>();
defineEmits(["close"]);
const notes = ref(props.paper.notes);
if (!notes.value.trim().length) {
    notes.value += `<h1>${props.paper.title}</h1>`;
    notes.value += `<h2>By ${props.paper.authors.map(a => [a.prefix, a.lastName, a.suffix]
        .filter(a => a.trim().length).join(' ')).join(", ")}</h2>`;
    notes.value += `<h2>Published ${getPublicationDate(props.paper)}</h2>`
    notes.value += "<br><br>"
}
const proxyURL = computed(() => {
    return "/paper?url=" + encodeURIComponent(props.paper.link);
});
const saved = ref(true);
const repo = remult.repo(Paper);
const save = () => {
    repo.update(props.paper.id, { ...props.paper, notes: notes.value })
        .then(() => saved.value = true);
}
watch(notes, () => saved.value = false);
</script>

<template>
    <div id="modalContainer">
        <div id="readingModal">
            <embed id="paper" :src="proxyURL" type="application/pdf" />
            <div id="notes">
                <QuillEditor theme="snow" v-model:content="notes" content-type="html" />
            </div>
        </div>
        <div id="buttons">
            <button @click="$emit('close')">Close</button>
            <button @click="save" :disabled="saved">Save{{ saved ? "d" : "" }}</button>
        </div>
    </div>
</template>

<style lang="scss">
* {
    box-sizing: border-box;
}

$buttons-height: 40px;

#readingModal {
    display: flex;
    width: 100%;
    height: calc(100% - $buttons-height);
}

#paper {
    width: 60%;
    height: 100%;
}

#notes {
    width: 40%;
    height: 100%;
    background-color: white;
    display: flex;
    flex-direction: column;
}

#modalContainer {
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100%;
    width: 100%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-color: #fffa;
}

#buttons {
    width: 100%;
    height: $buttons-height;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 10px;

    button {
        margin: 5px;
    }
}
</style>

<style>
div.ql-container {
    /* hack to allow space for the quill toolbar */
    height: calc(100% - 42px);
}
</style>
