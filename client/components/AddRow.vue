<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Paper } from '../../data/entities';
import EditableRow from './EditableRow.vue';
import contenteditable from 'vue-contenteditable';
import { lookupPaper } from '../code/dataUtilities';
defineEmits<{ (event: 'addRow', row: Paper): void }>();
const adding = ref(false);
const DOI = ref("");
const getBlankRow: () => Paper = () => ({
    authors: [],
    id: "new",
    link: "",
    notes: "",
    published: new Date(1990, 0, 1),
    read: false,
    summary: "",
    tags: [],
    title: "",
    doi: "",
    citationCount: 0,
    citationsUpdated: undefined
});
const rowInProgress = reactive<Paper>(getBlankRow());
const initRow = async () => {
    if (DOI.value.trim().length > 0) {
        try {
            const info = await lookupPaper(DOI.value);
            rowInProgress.doi = DOI.value;
            Object.assign(rowInProgress, info);
            rowInProgress.citationsUpdated = new Date();
            DOI.value = ""
            adding.value = true;
        } catch (e: any) {
            alert("This DOI didn't work: " + DOI.value + "\n" + e.toString())
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
        <tr style="background-color: #e6fae7">
            <td />
            <td>
                <contenteditable style="margin-top: 4px;" v-model="DOI" tag="span" data-ph="DOI (optional)       "
                    @keypress.enter="initRow" no-html no-nl />
                <button class="wide-button" style="float: right" @click="initRow">➕ Add Paper</button>
            </td>
            <td v-for="i in 5" />
        </tr>
    </template>
</template>

<style scoped>
@import "../styles/tables.scss";
</style>