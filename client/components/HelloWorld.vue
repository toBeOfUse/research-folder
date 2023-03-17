<script setup lang="ts">
import { remult } from "remult"
import { onMounted, ref, Ref } from "vue";
import { Paper } from "../../data/entities";

const papersRepo = remult.repo(Paper);

const papers: Ref<Partial<Paper>[]> = ref([]);
onMounted(async function() {
  papers.value = await papersRepo.find();
});
</script>

<template>
  <VTable :data="papers">
    <template #head>
      <tr>
        <th>Title</th>
        <th>Authors</th>
        <th>Year</th>
        <th>Importance</th>
        <th>Tags</th>
      </tr>
    </template>
    <template #body="{rows}">
      <tr v-for="row in rows" :key="row.id">
        <td>{{ row.title }}</td>
        <td>{{ row.authors.join(", ") }}</td>
        <td>{{ row.published.getFullYear() }}</td>
        <td>{{ row.importance }}</td>
        <td>{{ row.tags.join(", ") }}</td>
      </tr>
    </template>
  </VTable>
</template>

<style>
table {
  text-align: left;
}
td:nth-child(2n) {
  background-color: lightyellow;
}
td:nth-child(2n+1) {
  background-color: white;
}
td, th {
  border: 1px solid white;
}
</style>
