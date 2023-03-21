<script setup lang="ts">
import { AuthorName, Paper } from '../../data/entities';

defineProps<{ row: Paper }>();
defineEmits(['edit']);
</script>

<template>
    <tr>
        <td>{{
            row.published.toLocaleDateString("en-us", { month: "long" }) +
            " " + row.published.getFullYear()
        }}</td>
        <td><a :href="row.link" target="_blank">{{ row.title }}</a></td>
        <td>{{ row.authors.map((a: AuthorName) => a.lastName).join(", ") }}</td>
        <td>{{ row.summary }}</td>
        <td>{{ row.tags.join(", ") }}</td>
        <td class="button" @click="$emit('edit')">📝</td>
    </tr>
</template>

<style scoped>
@import "../styles/tables.scss";
</style>
