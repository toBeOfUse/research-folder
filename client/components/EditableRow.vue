<script setup lang="ts">
import { AuthorName, Paper } from '../../data/entities';
import ContentEditable from "vue-contenteditable";
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import { computed, ref } from 'vue';

const CEOpts = { 'no-nl': true, 'no-html': true };

const props = defineProps<{ row: Paper }>();

const rowsNeeded = computed(() => {
    return Math.max(props.row.authors.length, props.row.tags.length);
});

const addAuthor = () => {
    props.row.authors.push({ prefix: "", lastName: "", suffix: "" });
};

const showAuthorButton = computed(() => {
    return props.row.authors[props.row.authors.length - 1].lastName.trim().length > 0;
});

defineEmits(["save", "cancel", "edit"]);
</script>

<template>
    <tr>
        <td class="parent">
            <table style="width: 165px">
                <tr v-for="r in rowsNeeded" :key="r">
                    <td>
                        <DatePicker v-if="r == 1" v-model:value="row.published" type="month" format="MMMM YYYY"
                            :clearable="false" />
                    </td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <tr v-for="r in rowsNeeded" :key="r">
                    <td>
                        <ContentEditable v-if="r == 1" v-model="row.title" tag="span" v-bind="CEOpts" />
                    </td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <tr v-for="author, i in row.authors.length">
                    <td>
                        <ContentEditable tag="span" v-model="row.authors[i].prefix" v-bind="CEOpts" />
                        <ContentEditable tag="span" v-model="row.authors[i].lastName" v-bind="CEOpts" />
                        <ContentEditable tag="span" v-model="row.authors[i].suffix" v-bind="CEOpts" />
                        <button v-if="showAuthorButton && i == row.authors.length - 1" @click="addAuthor">➕</button>
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
                    </td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <tr v-for="i in rowsNeeded">
                    <td>
                        <div v-if="i == 1" class="button" @click="$emit('save')">💾</div>
                    </td>
                </tr>
            </table>
        </td>
        <td class="parent">
            <table>
                <tr v-for="i in rowsNeeded">
                    <td>
                        <div v-if="i == 1" class="button" @click="$emit('cancel')">❌</div>
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
/* overriding 10px left, 15px right padding on normal cells */
.mx-datepicker {
    width: calc(100% + 25px);
    transform: translateX(-10px);
}

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
