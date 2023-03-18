<script setup lang="ts">
import { remult } from "remult"
import { onMounted, ref, Ref } from "vue";
import { Paper, AuthorName } from "../../data/entities";

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
        <th>Summary</th>
        <th>Tags</th>
      </tr>
    </template>
    <template #body="{rows}">
      <tr v-for="row in rows" :key="row.id">
        <td><a :href="row.link" target="_blank">{{ row.title }}</a></td>
        <td>{{ row.authors.map((a: AuthorName)=>a.lastName).join(", ") }}</td>
        <td>{{ row.published.getFullYear() }}</td>
        <td>{{ row.summary }}</td>
        <td>{{ row.tags.join(", ") }}</td>
      </tr>
    </template>
  </VTable>
</template>

<style>
table {
  text-align: left;
}
tbody tr:nth-child(2n+1) {
  background-color: lightyellow;
}
tbody tr:nth-child(2n) {
  background-color: white;
}
td, th {
  border: 1px solid white;
}

/* hack to get rid of faded-out sort direction indicators */
path[opacity="0.4"] {
  display: none;
}
</style>
