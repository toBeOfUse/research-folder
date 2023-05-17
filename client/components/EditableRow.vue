<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { AuthorName, Paper } from '../../data/entities';

import ContentEditable from "vue-contenteditable";
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import draggable from 'vuedraggable'
import { cleanAuthors } from './dataUtilities';

const CEOpts = { 'no-nl': true, 'no-html': true };

const props = defineProps<{ row: Paper, bg: string }>();

function getWorkingCopy(paper: Paper) {
    // javascript deep copying 👍 needed to keep edits to working copy from
    // changing canonical data before save() is run
    return {
        ...paper,
        tags: [...paper.tags],
        authors: JSON.parse(JSON.stringify(cleanAuthors(paper.authors)))
    };
}

const workingCopy = ref(getWorkingCopy(props.row));

const rowsNeeded = computed(() => {
    // we need at least three for the button column on the right
    return Math.max(workingCopy.value.authors.length, workingCopy.value.tags.length, 3);
});

const getBlankAuthor = () => ({ prefix: "", lastName: "", suffix: "" });

const lastFirstName = ref<any>(null);

const addAuthor = () => {
    workingCopy.value.authors.push(getBlankAuthor());
    nextTick(() => {
        if (lastFirstName.value) {
            lastFirstName.value.$el.focus();
        }
    });
};

const removeAuthor = (index: number) => {
    workingCopy.value.authors.splice(index, 1);
}

const ensureAuthor = () => {
    if (workingCopy.value.authors.length == 0) {
        workingCopy.value.authors.push(getBlankAuthor());
    }
}

watch(workingCopy.value.authors, ensureAuthor);
onMounted(ensureAuthor);

const lastTag = ref<any>(null);

const addTag = () => {
    workingCopy.value.tags.push("");
    nextTick(() => {
        if (lastTag.value) {
            lastTag.value.$el.focus();
        }
    });
};

const handleTagPress = (e: KeyboardEvent) => {
    if (e.key == 'Enter' || e.key == ',') {
        e.preventDefault();
        addTag()
    }
}

const removeTag = (index: number) => {
    workingCopy.value.tags.splice(index, 1);
};

const ensureTag = () => {
    if (workingCopy.value.tags.length == 0) {
        workingCopy.value.tags.push("");
    }
}

watch(workingCopy.value.tags, ensureTag);
onMounted(ensureTag);

const addAuthorVisibility = (index: number) => {
    return index == workingCopy.value.authors.length - 1 ? 'visible' : 'hidden'
};

const addTagVisibility = (index: number) => {
    return index == workingCopy.value.tags.length - 1 ? 'visible' : 'hidden'
};

const drag = ref(false);

defineEmits(["save", "cancel", "edit", "delete"]);
</script>

<template>
    <tr class="row-container">
        <td class="parent">
            <table style="width: 165px">
                <tr v-for="r in rowsNeeded" :key="r">
                    <td style="padding: 0">
                        <DatePicker v-if="r == 1" v-model:value="workingCopy.published" type="month" format="MMMM YYYY"
                            :clearable="false" />
                    </td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <template v-for="r in rowsNeeded" :key="r">
                    <tr v-if="r == 1">
                        <td>
                            <!-- spaces are important -->
                            <ContentEditable data-ph="title                    " v-model="workingCopy.title" tag="span"
                                v-bind="CEOpts" />
                        </td>
                    </tr>
                    <tr v-else-if="r == 2">
                        <td>
                            <input style="width:100%" v-model="workingCopy.link" type="text" placeholder="Link to PDF..." />
                        </td>
                    </tr>
                    <tr v-else>
                        <td />
                    </tr>
                </template>
            </table>
        </td>
        <td class="parent">
            <table>
                <draggable tag="tbody" v-model="workingCopy.authors" group="authors" @start="drag = true"
                    @end="drag = false" handle=".handle"
                    :item-key="(author: AuthorName) => workingCopy.authors.indexOf(author)">
                    <template #item="{ element, index }">
                        <tr>
                            <td>
                                <ContentEditable data-ph="first" tag="span" v-model="element.prefix" v-bind="CEOpts"
                                    @keypress.enter="addAuthor"
                                    :ref="el => index == workingCopy.authors.length - 1 && (lastFirstName = el)" />
                                <ContentEditable data-ph="last" tag="span" v-model="element.lastName" v-bind="CEOpts"
                                    @keypress.enter="addAuthor" />
                                <ContentEditable data-ph="jr/sr" tag="span" v-model="element.suffix" v-bind="CEOpts"
                                    @keypress.enter="addAuthor" />
                                <div style="display: inline; float: right;">
                                    <button :style="{ visibility: addAuthorVisibility(index) }"
                                        @click="addAuthor">➕</button>
                                    <button @click="removeAuthor(index)">❌</button>
                                    <button class="handle" style="cursor:grab">⇳</button>
                                </div>
                            </td>
                        </tr>
                    </template>
                </draggable>
                <tr v-for="i in rowsNeeded - workingCopy.authors.length">
                    <td :key="i"></td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <tr v-for="r in rowsNeeded" :key="r">
                    <td>
                        <span v-if="r == 1">...</span>
                    </td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <draggable tag="tbody" v-model="workingCopy.tags" @start="drag = true" @end="drag = false" handle=".handle"
                    :item-key="(tag: string) => workingCopy.tags.indexOf(tag)">
                    <template #item="{ element, index }">
                        <tr>
                            <td>
                                <ContentEditable @keypress="handleTagPress"
                                    :ref="el => index == workingCopy.tags.length - 1 && (lastTag = el)" data-ph="new tag"
                                    tag="span" v-model="workingCopy.tags[index]" v-bind="CEOpts" />
                                <div style="display: inline; float: right;">
                                    <button :style="{ visibility: addTagVisibility(index) }" @click="addTag">➕</button>
                                    <button @click="removeTag(index)">❌</button>
                                    <button class="handle" style="cursor:grab">⇳</button>
                                </div>
                            </td>
                        </tr>
                    </template>
                </draggable>
                <tr v-for="i in rowsNeeded - workingCopy.tags.length">
                    <td :key="i"></td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <tr v-for="r in rowsNeeded" :key="r">
                    <td>
                        <input style="width: 55px" type="number" min="0" v-if="r == 1"
                            v-model="workingCopy.citationCount" />
                    </td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <tr v-for="i in rowsNeeded">
                    <td class="button">
                        <button title="save changes" v-if="i == 1" @click="$emit('save', workingCopy)">💾</button>
                        <button title="cancel changes" v-if="i == 2" @click="$emit('cancel')">↩</button>
                        <button title="delete row" v-if="i == 3" @click="$emit('delete')">❌</button>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</template>

<style scoped>
@import "../styles/tables.scss";

.row-container {
    border: 2px solid black;
    background-image: linear-gradient(to bottom right, white 0%, white 45%, lightgray 45%, lightgray 55%, white 55%, white 100%);
    background-size: 10px 10px;
}

td:not(:empty, .parent) {
    background-color: v-bind("props.bg");
}

td:empty {
    background: transparent;
}

/* Hide inrement/decrement arrows on citations field: */

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Firefox */
input[type=number] {
    -moz-appearance: textfield;
}
</style>

<style>
.mx-input {
    padding: none;
    font-size: initial;
    background-color: transparent;
    color: black;
    border: none;
    border-radius: 0;
    text-decoration: underline;
    text-decoration-style: dashed;
    text-align: right;
}

.mx-datepicker {
    width: 160px !important;
}
</style>
