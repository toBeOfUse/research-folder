<script setup lang="ts">
import { remult } from "remult"
import { onMounted, reactive, ref, Ref, watch } from "vue";
import { Paper } from "../../data/entities";
import StaticRow from "./StaticRow.vue";
import EditableRow from "./EditableRow.vue";

const papersRepo = remult.repo(Paper);

// stores papers straight from the database; used to populate papersIndex and
// then revert changes if necessary
const papers: Ref<Paper[]> = ref([]);

// stores "working copy" of papers that is actually displayed and editable;
// needs to be indexable by row.id because sorting/filtering the table will
// change the order/indexes of displayed rows
const papersIndex: Record<string, Paper> = {};

watch(papers, (newValue) => {
  for (const value of newValue) {
    papersIndex[value.id] = reactive({...value});
  }
});

const wip = reactive(new Set<string>());
const edit = (row: Paper) => wip.add(row.id);
const editing = (row: Paper) => wip.has(row.id);
const cancel = (row: Paper) => {
  wip.delete(row.id);
  papersIndex[row.id] = papers.value.find(r=>r.id==row.id)!;
}
const save = (row: Paper) => {

}

onMounted(async function() {
  papers.value = await papersRepo.find();
});
</script>

<template>
  <VTable :data="papers">
    <template #head>
      <tr>
        <th>Published</th>
        <th>Title</th>
        <th>Authors</th>
        <th>Summary</th>
        <th>Tags</th>
        <th />
        <th />
      </tr>
    </template>
    <template #body="{rows}">
      <component
        :is="editing(row) ? EditableRow : StaticRow"
        v-for="row in rows" :key="row.id" :row="papersIndex[row.id]"
        @edit="edit(row)" @save="save(papersIndex[row.id])" @cancel="cancel(row)"
      />
    </template>
  </VTable>
</template>

<style lang="scss">
* {
  font-family: sans-serif;
}
a, a:visited {
  color: blue;
}

/* hack to get rid of faded-out sort direction indicators */
path[opacity="0.4"] {
  display: none;
}
</style>

<style scoped lang="scss">
@import "../styles/tables.scss";
</style>
