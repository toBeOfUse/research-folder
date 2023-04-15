<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Paper } from '../../data/entities';
import EditableRow from './EditableRow.vue';
defineEmits<{ (event: 'addRow', row: Paper): void }>();
const adding = ref(false);
const getBlankRow = () => ({
    authors: [],
    id: "new",
    link: "",
    notes: "",
    published: new Date(1990, 1, 1),
    read: false,
    summary: "",
    tags: [],
    title: ""
});
const rowInProgress = reactive<Paper>(getBlankRow());
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
            <td v-for="i in 5" />
            <td class="button"><button title="new row" @click="adding = true">➕</button></td>
        </tr>
    </template>
</template>

<style scoped>
@import "../styles/tables.scss";
</style>