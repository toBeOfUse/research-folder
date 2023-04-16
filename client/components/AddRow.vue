<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Paper } from '../../data/entities';
import EditableRow from './EditableRow.vue';
import contenteditable from 'vue-contenteditable';
defineEmits<{ (event: 'addRow', row: Paper): void }>();
const adding = ref(false);
const DOI = ref("");
const getBlankRow: () => Paper = () => ({
    authors: [],
    id: "new",
    link: "",
    notes: "",
    published: new Date(1990, 1, 1),
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
            const crossrefResp = await fetch("https://api.crossref.org/works/" + DOI.value.trim());
            if (!crossrefResp.ok) {
                throw "Request to crossref API failed with status " +
                crossrefResp.status + " " + crossrefResp.statusText;
            }
            const crossref = (await crossrefResp.json()).message;
            rowInProgress.doi = DOI.value;
            rowInProgress.title = crossref.title.join(" ");
            const issued = crossref.issued["date-parts"][0];
            rowInProgress.published = new Date(issued[0], issued.length > 1 ? issued[1] - 1 : 0, 1);
            rowInProgress.citationCount = crossref["is-referenced-by-count"];
            rowInProgress.citationsUpdated = new Date();
            rowInProgress.authors = crossref.author.map((a: any) => ({ prefix: a.given, lastName: a.family, suffix: "" }));
            if (crossref.abstract) {
                rowInProgress.notes = `Abstract:\n${crossref.abstract}`
            }
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
            @save="$emit('addRow', { ...rowInProgress }); reset()" />
    </template>
    <template v-else>
        <tr style="background-color: #e6fae7">
            <td />
            <td>
                <contenteditable style="margin-top: 4px;" v-model="DOI" tag="span" data-ph="DOI (optional)       "
                    @keypress.enter="initRow" no-html no-nl />
                <button class="wide-button square-button" style="float: right" @click="initRow">➕ Add</button>
            </td>
            <td v-for="i in 5" />
        </tr>
    </template>
</template>

<style scoped>
@import "../styles/tables.scss";
</style>