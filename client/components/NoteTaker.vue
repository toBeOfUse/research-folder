<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Delta, QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import ImageUploader from "quill-image-uploader";
import 'quill-image-uploader/dist/quill.imageUploader.min.css';
import Mention from "quill-mention";
import "./paper-ref";
import equal from "deep-equal";
import LoadingSpinner from "./LoadingSpinner.vue";
import { Notes } from '../../data/entities';
import { getPublicationDate } from '../code/dataUtilities';
import { remult } from 'remult';
import { useRoute, useRouter } from "vue-router";
import { papers, papersLoaded, notesCache } from "../code/tableData";

const route = useRoute();
const router = useRouter();
const paperID = (route.params.id as string);
const paper = computed(() => papers.value.find(p => p.id == paperID)!);
const repo = remult.repo(Notes);
const notes = ref(new Delta());
const savedNotes = ref(new Delta());
const saved = computed(() => equal(notes.value, savedNotes.value));
const saving = ref(false);
let inDB = false;

onMounted(async () => {
    const fromDB = notesCache[paperID] || (await repo.findFirst({ paperID }))?.notesDeltaOps;
    inDB = !!fromDB;
    if (inDB) {
        notes.value = new Delta(fromDB);
        savedNotes.value = notes.value;
    }
    await papersLoaded;
    if (!notes.value?.ops.length ||
        (notes.value?.ops.length == 1 &&
            typeof notes.value.ops[0].insert == "string" &&
            !notes.value.ops[0].insert.trim())) {
        notes.value = new Delta([{
            attributes: {
                header: 1
            },
            insert: paper.value.title + "\n"
        },
        {
            attributes: {
                header: 3
            },
            insert: `Authors: ${paper.value.authors
                .map(a => [a.prefix, a.lastName, a.suffix]
                    .filter(a => a.trim().length).join(' ')).join(", ")}\n`
        },
        {
            attributes: {
                header: 3
            },
            insert: `Published: ${getPublicationDate(paper.value)}\n`
        },
        { insert: "\n\n" }
        ]);
    }
});

const proxyURL = computed(() => {
    return paper.value ? ("/pdfProxy?url=" + encodeURIComponent(paper.value.link)) : "";
});

const back = () => {
    if (!saved.value) {
        if (!confirm("Close without saving?")) {
            return;
        }
    }
    //use router.back() if there is history to go back to or go to "/"
    // otherwise
    if (router.options.history.state.back) {
        router.back();
    } else {
        router.push("/");
    }
};

const save = async () => {
    saving.value = true;
    if (!inDB) {
        await repo.insert({ paperID, notesDeltaOps: notes.value.ops });
    } else {
        await repo.update(paperID, { paperID, notesDeltaOps: notes.value.ops });
    }
    savedNotes.value = notes.value;
    inDB = true;
    saving.value = false;
    notesCache[paperID] = savedNotes.value.ops;
};

const keys = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        save();
    } else if (e.key == "Escape") {
        e.preventDefault();
        back();
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
                    reject("http request failure");
                });
        })
    }
};

const modules = [
    { name: 'imageUploader', module: ImageUploader, options: uploader },
    {
        name: "mention",
        module: Mention,
        options: {
            mentionDenotationChars: ["ref: "],
            allowedChars: /^[A-Za-z- ():<>\/']*$/,
            showDenotationChar: false,
            blotName: "mentionLink",
            source: function (
                searchTerm: string,
                renderList: (a: { id: string | number, value: string }[], b: string) => void,
                mentionChar: string
            ) {
                renderList(
                    papers.value
                        .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
                        .slice(0, 10)
                        .map(p => ({ id: p.id, value: p.title })),
                    searchTerm
                );
            }
        }
    }
];


function ready(quill: any) {
    // fixes html bugs like the redundant nested <span>s around mention text
    setTimeout(() => quill.setContents(quill.getContents()), 50);
    (window as any).__q = quill;
}

function handleMentionClick(event: any) {
    // TODO: replace `confirm()` with modal with built-in "save now" button
    if (saved.value || confirm("Leave notes without saving changes?")) {
        router.push("/notes/" + event.detail.id);
    }
}
onMounted(() => {
    window.addEventListener("mention-clicked", handleMentionClick, false);
});
onUnmounted(() => {
    window.removeEventListener("mention-clicked", handleMentionClick, false);
});

</script>

<template>
    <div id="noteTakerContainer">
        <div id="readingPane">
            <div id="paperContainer">
                <LoadingSpinner id="spinner" />
                <embed id="paper" :src="proxyURL" type="application/pdf" />
            </div>
            <div id="notes">
                <QuillEditor @ready="ready" theme="snow" v-model:content="notes" content-type="delta" :toolbar="toolbar"
                    :modules="modules" />
            </div>
        </div>
        <div id="buttons">
            <p style="margin-right: auto">Take notes. If you type "ref: " you will be able to reference other papers.</p>
            <button @click="back">Back</button>
            <button @click="save" :disabled="saved || saving">Save{{ saved ? "d" : "" }}</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
* {
    box-sizing: border-box;
}

$buttons-height: 40px;

#readingPane {
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

#noteTakerContainer {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
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

:deep(.ql-mention-list) {
    background-color: white;
    border-radius: 10px;
    border: 1px solid black;
    list-style: none;
    padding: 0;
    overflow: hidden;
}

:deep(.ql-mention-list-item:not(:last-of-type)) {
    border-bottom: 1px solid black;
}

:deep(.ql-mention-list-item) {
    padding: 5px;
}

:deep(.ql-mention-list-item.selected) {
    background-color: #ddd;
}

:deep(.mention) {
    background-color: #ddd;
    padding: 2px;
    border-radius: 5px;
    cursor: pointer;
    color: black;
}

:deep(.ql-container) {
    /* hack to allow space for the quill toolbar */
    height: calc(100% - 42px);
}

:deep(.ql-editor) {
    padding-bottom: 100px;
}
</style>
