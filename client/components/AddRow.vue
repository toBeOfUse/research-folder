<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Paper } from '../../data/entities';
import EditableRow from './EditableRow.vue';
import contenteditable from 'vue-contenteditable';
import { lookupPaperID, searchPapers } from '../code/dataUtilities';
defineEmits<{ (event: 'addRow', row: Paper): void }>();
const adding = ref(false);
const DOI = ref("");
const search = ref("");
const getBlankRow: () => Paper = () => ({
    authors: [],
    id: "new",
    link: "",
    notes: "",
    published: new Date(1990, 0, 1),
    read: false,
    tags: [],
    title: "",
    citationCount: 0,
    citationsUpdated: undefined,
    semanticScholarID: ""
});
const rowInProgress = reactive<Paper>(getBlankRow());
const initRow = async () => {
    if (DOI.value.trim().length > 0 || search.value.trim().length > 0) {
        try {
            let idToUse: string;
            if (DOI.value.trim().length != 0) {
                idToUse = DOI.value.trim();
            } else {
                idToUse = await searchPapers(search.value.trim());
            }
            const info = await lookupPaperID(idToUse);
            rowInProgress.semanticScholarID = idToUse;
            Object.assign(rowInProgress, info);
            rowInProgress.citationsUpdated = new Date();
            DOI.value = "";
            search.value = "";
            adding.value = true;
        } catch (e: any) {
            alert("Paper retrieval failed:" + "\n" + e.toString())
        }
    } else {
        adding.value = true;
    }
};
const reset = () => {
    Object.assign(rowInProgress, getBlankRow());
    adding.value = false;
}
</script>

<template>
    <template v-if="adding">
        <EditableRow bg="#e6fae7" :row="rowInProgress" @cancel="reset" @delete="reset"
            @save="row => { $emit('addRow', row); reset() }" />
    </template>
    <template v-else>
        <tr>
            <td />
            <td>
                <contenteditable id="title-input" v-model="search" tag="span" data-ph="Add from title..."
                    @keypress.enter="initRow" no-html no-nl />
                <contenteditable style="margin-top: 4px;flex-shrink: 0;" v-model="DOI" tag="span" data-ph="Add from DOI..."
                    @keypress.enter="initRow" no-html no-nl />
                <button class="wide-button" style="margin-left:auto; min-width:125px" @click="initRow">➕ Add Paper</button>
            </td>
            <td v-for="i in 5" />
        </tr>
    </template>
</template>

<style scoped>
@import "../styles/tables.scss";

td {
    background-color: #e6fae7
}

#title-input {
    white-space: nowrap;
    overflow: hidden;
    margin-top: 4px;
    margin-right: 20px
}
</style>