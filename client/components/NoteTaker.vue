<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import ImageUploader from "quill-image-uploader";
import 'quill-image-uploader/dist/quill.imageUploader.min.css';
import LoadingSpinner from "./LoadingSpinner.vue";
import { Paper } from '../../data/entities';
import { getPublicationDate } from '../code/dataUtilities';
import { remult } from 'remult';

const props = defineProps<{ paper: Paper }>();
const emit = defineEmits(["close"]);
const notes = ref(props.paper.notes);
// savedNotes only updates when a database save succeeds; when the user closes
// the editor, it lets the parent component know what the local paper object
// should store (ignoring the unsaved changes that may be present in `notes.value`)
const savedNotes = ref(props.paper.notes);
if (!notes.value.trim().length) {
    notes.value += `<h1>${props.paper.title}</h1>`;
    notes.value += `<h3>Authors: ${props.paper.authors.map(a => [a.prefix, a.lastName, a.suffix]
        .filter(a => a.trim().length).join(' ')).join(", ")}</h3>`;
    notes.value += `<h3>Published: ${getPublicationDate(props.paper)}</h3>`
    notes.value += "<br><br>"
}
const proxyURL = computed(() => {
    return "/paper?url=" + encodeURIComponent(props.paper.link);
});
const saved = ref(true);
const repo = remult.repo(Paper);
const close = () => {
    if (!saved.value) {
        if (!confirm("Close without saving?")) {
            return;
        }
    }
    emit("close", savedNotes.value);
}
const save = () => {
    repo.update(props.paper.id, { ...props.paper, notes: notes.value })
        .then(() => { saved.value = true; savedNotes.value = notes.value });
}
watch(notes, () => saved.value = false);
const keys = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        save();
    } else if (e.key == "Escape") {
        e.preventDefault();
        close();
    }
};
onMounted(() => document.addEventListener("keydown", keys));
onUnmounted(() => document.removeEventListener("keydown", keys));

const toolbar = [
    [{ header: [false, 1, 2, 3] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ["link"],
    // ['formula'],  TODO: something something KaTex
    ['clean'],
    ["image"]
];

const uploader = {
    upload(file: File) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("image", file);
            fetch("/newimage", { method: "post", body: formData })
                .then(res => res.text().then(t => resolve(t)))
                .catch(err => {
                    console.error(err);
                    reject("http request failure")
                });
        })
    }
}
</script>

<template>
    <div id="modalContainer">
        <div id="readingModal">
            <div id="paperContainer">
                <LoadingSpinner id="spinner" />
                <embed id="paper" :src="proxyURL" type="application/pdf" />
            </div>
            <div id="notes">
                <QuillEditor theme="snow" v-model:content="notes" content-type="html" :toolbar="toolbar"
                    :modules="{ name: 'imageUploader', module: ImageUploader, options: uploader }" />
            </div>
        </div>
        <div id="buttons">
            <button @click="close">Close</button>
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

#paperContainer {
    width: 60%;
    height: 100%;
    position: relative;
}

#spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: -1;
}

#paper {
    width: 100%;
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
    background-color: #fff;
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

div.ql-editor {
    padding-bottom: 100px;
}
</style>
