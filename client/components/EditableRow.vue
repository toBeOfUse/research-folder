<script setup lang="ts">
import { AuthorName, Paper } from '../../data/entities';
import ContentEditable from "vue-contenteditable";
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';

defineProps<{row: Paper}>();
</script>

<template>
    <tr>
        <td><DatePicker v-model:value="row.published" type="month" format="MMMM YYYY" :clearable="false" /></td>
        <ContentEditable v-model="row.title" tag="td"></ContentEditable>
        <td>{{ row.authors.map((a: AuthorName)=>a.lastName).join(", ") }}</td>
        <ContentEditable tag="td" v-model="row.summary" :no-nl="true" :no-html="true" />
        <td>{{ row.tags.join(", ") }}</td>
        <td class="button" @click="$emit('save')">💾</td>
        <td class="button" @click="$emit('cancel')">❌</td>
      </tr>
</template>

<style scoped>
@import "../styles/tables.scss";
tr {
    background-color: #e4f6ff!important;
}
td[contenteditable="true"] {
    border-bottom: 1px dashed black;
}
</style>

<style>
/* overriding 10px left, 15px right padding on normal cells */
.mx-datepicker {
    width: calc(100% + 25px);
    transform: translateX(-10px);
}
</style>
