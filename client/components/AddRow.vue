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
    citationsRetrieved: undefined
});
const rowInProgress = reactive<Paper>(getBlankRow());
const initRow = async () => {
    try {
        const crossref = (await (
            await fetch("https://api.crossref.org/works/" + DOI.value)
        ).json()).message;
        rowInProgress.doi = DOI.value;
        rowInProgress.title = crossref.title.join(" ");
        const publication = crossref.issued["date-parts"][0];
        rowInProgress.published = new Date(publication[0], publication.length > 1 ? publication[1] - 1 : 0, 1);
        rowInProgress.citationCount = crossref["is-referenced-by-count"];
        rowInProgress.citationsRetrieved = new Date();
        rowInProgress.authors = crossref.author.map((a: any) => ({ prefix: a.given, lastName: a.family, suffix: "" }))
    } catch {
        console.log("DOI didn't work:", DOI.value);
    }
    adding.value = true;
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
            <td v-for="i in 4" />
            <td><span>Use DOI: </span>
                <contenteditable v-model="DOI" tag="span" data-ph="10.1145/359545.359563" @keypress.enter="initRow" no-html
                    no-nl />
            </td>
            <td class="button"><button title="new row" @click="initRow">➕</button></td>
        </tr>
    </template>
</template>

<style scoped>
@import "../styles/tables.scss";
</style>