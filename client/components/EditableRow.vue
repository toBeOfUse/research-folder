<script setup lang="ts">
import { Paper } from '../../data/entities';
import ContentEditable from "vue-contenteditable";
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import { computed } from 'vue';

const CEOpts = { 'no-nl': true, 'no-html': true };

const props = defineProps<{ row: Paper }>();

const rowsNeeded = computed(() => {
    // we need at least two for the title & url in the same column
    return Math.max(props.row.authors.length, props.row.tags.length, 2);
});

const addAuthor = () => {
    props.row.authors.push({ prefix: "", lastName: "", suffix: "" });
};

const addTag = () => {
    props.row.tags.push("");
};

const showAuthorButton = computed(() => {
    return props.row.authors[props.row.authors.length - 1].lastName.trim().length > 0;
});

const showTagButton = computed(() => {
    return props.row.tags[props.row.tags.length - 1].trim().length > 0;
});

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
                <tr v-for="i in rowsNeeded">
                    <td>
                        <template v-if="i - 1 < row.authors.length">
                            <ContentEditable tag="span" v-model="row.authors[i - 1].prefix" v-bind="CEOpts" />
                            <ContentEditable tag="span" v-model="row.authors[i - 1].lastName" v-bind="CEOpts" />
                            <ContentEditable tag="span" v-model="row.authors[i - 1].suffix" v-bind="CEOpts" />
                            <button v-if="showAuthorButton && i == row.authors.length" @click="addAuthor">➕</button>
                        </template>
                    </td>
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
                <tr v-for="i in rowsNeeded">
                    <td>
                        <ContentEditable v-if="i - 1 < row.tags.length" v-model="row.tags[i - 1]" tag="span"
                            v-bind="CEOpts" />
                        <button v-if="showTagButton && i == row.tags.length" @click="addTag">➕</button>
                    </td>
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
