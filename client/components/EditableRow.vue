<script setup lang="ts">
import { computed, ref } from 'vue';

import { AuthorName, Paper } from '../../data/entities';

import ContentEditable from "vue-contenteditable";
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import draggable from 'vuedraggable'

const CEOpts = { 'no-nl': true, 'no-html': true };

const props = defineProps<{ row: Paper }>();

const rowsNeeded = computed(() => {
    // we need at least two for the title & url in the same column
    return Math.max(props.row.authors.length, props.row.tags.length, 2);
});

const addAuthor = () => {
    props.row.authors.push({ prefix: "", lastName: "", suffix: "" });
};

const removeAuthor = (index: number) => {
    props.row.authors.splice(index, 1);
}

const addTag = () => {
    props.row.tags.push("");
};

const removeTag = (index: number) => {
    props.row.tags.splice(index, 1);
};

const showAuthorButton = computed(() => {
    return props.row.authors[props.row.authors.length - 1].lastName.trim().length > 0;
});

const showTagButton = computed(() => {
    return props.row.tags[props.row.tags.length - 1].trim().length > 0;
});

const drag = ref(false);

defineEmits(["save", "cancel", "edit"]);
</script>

<template>
    <tr>
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
                            <ContentEditable v-model="row.title" tag="span" v-bind="CEOpts" />
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
                <draggable v-model="row.authors" group="authors" @start="drag = true" @end="drag = false" handle=".handle"
                    :item-key="(author: AuthorName) => row.authors.indexOf(author)">
                    <template #item="{ element, index }">
                        <tr>
                            <td>
                                <ContentEditable tag="span" v-model="element.prefix" v-bind="CEOpts" />
                                <ContentEditable tag="span" v-model="element.lastName" v-bind="CEOpts" />
                                <ContentEditable tag="span" v-model="element.suffix" v-bind="CEOpts" />
                                <div style="display: inline; float: right;">
                                    <button v-if="showAuthorButton && index == row.authors.length - 1"
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
                        <ContentEditable v-if="r == 1" tag="span" v-model="row.summary" v-bind="CEOpts" />
                    </td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <draggable v-model="row.tags" @start="drag = true" @end="drag = false" handle=".handle"
                    :item-key="(tag: string) => tag">
                    <template #item="{ element, index }">
                        <tr>
                            <td>
                                <ContentEditable tag="span" v-model="row.tags[index]" v-bind="CEOpts" />
                                <div style="display: inline; float: right;">
                                    <button v-if="showTagButton && index == row.tags.length - 1" @click="addTag">➕</button>
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
                        <button v-if="i == 1" @click="$emit('save')">💾</button>
                    </td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <tr v-for="i in rowsNeeded">
                    <td class="button">
                        <button v-if="i == 1" @click="$emit('cancel')">❌</button>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</template>

<style scoped>
@import "../styles/tables.scss";

tr {
    background-color: #e4f6ff !important;
}

td[contenteditable="true"] {
    border-bottom: 1px dashed black;
}

td:empty {
    background-color: white;
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
    content: "     ";
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
}
</style>
