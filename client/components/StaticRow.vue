<script setup lang="ts">
import { ref } from 'vue';
import { AuthorName, Paper } from '../../data/entities';

const summaryDisplayed = ref(false);
defineProps<{ row: Paper, bg: string }>();
defineEmits(['edit']);
</script>

<template>
    <tr :style="{ backgroundColor: bg }">
        <td>{{
            row.published.toLocaleDateString("en-us", { month: "long" }) +
            " " + row.published.getFullYear()
        }}</td>
        <td><a :href="row.link" target="_blank">{{ row.title }}</a></td>
        <td>{{ row.authors.map((a: AuthorName) => a.lastName).join(", ") }}</td>
        <td><a @click="summaryDisplayed = !summaryDisplayed" href="#">{{ summaryDisplayed ? "Close" : "View" }}</a>
        </td>
        <td>{{ row.tags.join(", ") }}</td>
        <td class="button"><button title="edit row" @click="$emit('edit')">📝</button></td>
    </tr>
    <tr v-if="summaryDisplayed" :style="{ backgroundColor: bg }">
        <td colspan="7">
            <div class="summary-container">
                <div>{{ row.summary }}</div>
            </div>
        </td>
    </tr>
</template>

<style scoped lang="scss">
@import "../styles/tables.scss";
</style>
