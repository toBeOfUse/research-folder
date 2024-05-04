<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Paper } from '../../data/entities';
import EditableRow from './EditableRow.vue';
import contenteditable from 'vue-contenteditable';
import { searchPapers } from '../code/dataUtilities';
import { PhListPlus as AddIcon } from "@phosphor-icons/vue";

defineEmits<{ (event: 'addRow', row: Paper): void }>();
const editorOpen = ref(false);
const DOI = ref("");
const search = ref("");

const rowInProgress = reactive(new Paper());

const loadingPaper = ref(false);

const initRow = async () => {
    if (DOI.value.trim().length > 0 || search.value.trim().length > 0) {
        try {
            loadingPaper.value = true;
            let idToUse: string;
            if (DOI.value.trim().length != 0) {
                idToUse = DOI.value.trim();
            } else {
                idToUse = await searchPapers(search.value.trim());
            }
            const info = await Paper.lookupPaperID(idToUse);
            rowInProgress.semanticScholarID = idToUse;
            Object.assign(rowInProgress, info);
            rowInProgress.citationsUpdated = new Date();
            DOI.value = "";
            search.value = "";
            editorOpen.value = true;
            loadingPaper.value = false;
        } catch (e: any) {
            alert("Paper retrieval failed:" + "\n" + e.toString());
            loadingPaper.value = false;
        }
    } else {
        editorOpen.value = true;
    }
};

const reset = () => {
    Object.assign(rowInProgress, new Paper());
    editorOpen.value = false;
}
</script>

<template>
    <template v-if="editorOpen">
        <EditableRow bg="#f0f4fc" :row="rowInProgress" @cancel="reset" @delete="reset"
            @save="row => { $emit('addRow', row); reset() }" />
    </template>
    <template v-else>
        <tr>
            <td />
            <td>
                <contenteditable id="title-input" v-model="search" tag="span" data-ph="Add from title..."
                    @keypress.enter="initRow" no-html no-nl />
                <contenteditable style="margin-top: 4px;flex-shrink: 0;" v-model="DOI" tag="span"
                    data-ph="Add from DOI..." @keypress.enter="initRow" no-html no-nl />
                <button class="wide-button" style="margin-left: 20px" @click="initRow">
                    <span :class="{ spinning: loadingPaper }" style="display: flex;">
                        <AddIcon />
                    </span>
                    Add Paper
                </button>
            </td>
            <td v-for="i in 5" />
        </tr>
    </template>
</template>

<style scoped lang="scss">
@import "~/styles/tables.scss";

td {
    background-color: #f0f4fc
}

#title-input {
    white-space: nowrap;
    overflow: hidden;
    margin-top: 4px;
    margin-right: 20px
}

@keyframes spin {
    from {
        transform: rotateY(0deg);
    }

    to {
        transform: rotateY(180deg);
    }
}

.spinning {
    display: inline-block;
    animation-name: spin;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: cubic-bezier(0.425, 0.2, 0.495, 0.810);
}
</style>