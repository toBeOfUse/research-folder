<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { AuthorName, Paper } from '../../data/entities';

import ContentEditable from "vue-contenteditable";
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import draggable from 'vuedraggable'

const CEOpts = { 'no-nl': true, 'no-html': true };

const props = defineProps<{ row: Paper, bg: string }>();

const rowsNeeded = computed(() => {
    // we need at least three for the button column on the right
    return Math.max(props.row.authors.length, props.row.tags.length, 3);
});

const getBlankAuthor = () => ({ prefix: "", lastName: "", suffix: "" });

const lastFirstName = ref<any>(null);

const addAuthor = () => {
    props.row.authors.push(getBlankAuthor());
    nextTick(() => {
        if (lastFirstName.value) {
            lastFirstName.value.$el.focus();
        }
    });
};

const removeAuthor = (index: number) => {
    props.row.authors.splice(index, 1);
}

const ensureAuthor = () => {
    if (props.row.authors.length == 0) {
        props.row.authors.push(getBlankAuthor());
    }
}

watch(props.row.authors, ensureAuthor);
onMounted(ensureAuthor);

const lastTag = ref<any>(null);

const addTag = () => {
    props.row.tags.push("");
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
    props.row.tags.splice(index, 1);
};

const ensureTag = () => {
    if (props.row.tags.length == 0) {
        props.row.tags.push("");
    }
}

watch(props.row.tags, ensureTag);
onMounted(ensureTag);

const addAuthorVisibility = (index: number) => {
    return index == props.row.authors.length - 1 ? 'visible' : 'hidden'
};

const addTagVisibility = (index: number) => {
    return index == props.row.tags.length - 1 ? 'visible' : 'hidden'
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
                        <DatePicker v-if="r == 1" v-model:value="row.published" type="month" format="MMMM YYYY"
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
                            <ContentEditable data-ph="title                    " v-model="row.title" tag="span"
                                v-bind="CEOpts" />
                        </td>
                    </tr>
                    <tr v-else-if="r == 2">
                        <td>
                            <input style="width:100%" v-model="row.link" type="text" placeholder="URL..." />
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
                <draggable tag="tbody" v-model="row.authors" group="authors" @start="drag = true" @end="drag = false"
                    handle=".handle" :item-key="(author: AuthorName) => row.authors.indexOf(author)">
                    <template #item="{ element, index }">
                        <tr>
                            <td>
                                <ContentEditable data-ph="first" tag="span" v-model="element.prefix" v-bind="CEOpts"
                                    @keypress.enter="addAuthor"
                                    :ref="el => index == row.authors.length - 1 && (lastFirstName = el)" />
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
                <tr v-for="i in rowsNeeded - row.authors.length">
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
                <draggable tag="tbody" v-model="row.tags" @start="drag = true" @end="drag = false" handle=".handle"
                    :item-key="(tag: string) => row.tags.indexOf(tag)">
                    <template #item="{ element, index }">
                        <tr>
                            <td>
                                <ContentEditable @keypress="handleTagPress"
                                    :ref="el => index == row.tags.length - 1 && (lastTag = el)" data-ph="new tag" tag="span"
                                    v-model="row.tags[index]" v-bind="CEOpts" />
                                <div style="display: inline; float: right;">
                                    <button :style="{ visibility: addTagVisibility(index) }" @click="addTag">➕</button>
                                    <button @click="removeTag(index)">❌</button>
                                    <button class="handle" style="cursor:grab">⇳</button>
                                </div>
                            </td>
                        </tr>
                    </template>
                </draggable>
                <tr v-for="i in rowsNeeded - row.tags.length">
                    <td :key="i"></td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <tr v-for="i in rowsNeeded">
                    <td class="button">
                        <button title="save changes" v-if="i == 1" @click="$emit('save')">💾</button>
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

td[contenteditable="true"] {
    border-bottom: 1px dashed black;
}

td:not(:empty, .parent) {
    background-color: v-bind("props.bg");
}

td:empty {
    background: transparent;
}

span[contenteditable="true"] {
    margin-right: 5px;
    min-width: 15px;
    display: inline-block;
    text-decoration: underline;
    text-decoration-style: dashed;
}

span[contenteditable="true"]:empty:before {
    /* fixes firefox span vpos bug: https://stackoverflow.com/a/48260743 */
    content: attr(data-ph);
    color: gray;
    white-space: pre;
    cursor: text;
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
