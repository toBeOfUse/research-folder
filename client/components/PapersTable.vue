<script setup lang="ts">
import { remult } from "remult"
import { onMounted, reactive } from "vue";
import { AuthorName, Paper } from "../../data/entities";
import StaticRow from "./StaticRow.vue";
import EditableRow from "./EditableRow.vue";

const papersRepo = remult.repo(Paper);

// stores papers straight from the database; used to populate papersIndex and
// then revert to originals if necessary
let papers: Paper[] = [];

// stores "working copy" of papers that is actually displayed and editable;
// needs to be indexable by row.id because sorting/filtering the table will
// change the order/indexes of displayed rows
const papersIndex: Record<string, Paper> = reactive({});

function getWorkingCopy(paper: Paper) {
  // javascript deep copying 👍 needed to keep edits to working copy from
  // changing canonical data before save() is run
  return {
    ...paper,
    tags: [...paper.tags],
    authors: JSON.parse(JSON.stringify(paper.authors))
  };
}

// load papers and initialize two completely separate reactive copies:
async function loadAll() {
  const results = await papersRepo.find();
  papers = results;
  for (const value of results) {
    papersIndex[value.id] = getWorkingCopy(value);
  }
}
onMounted(loadAll);

const wip = reactive(new Set<string>());
const edit = (row: Paper) => wip.add(row.id);
const editing = (row: Paper) => wip.has(row.id);
const cancel = (row: Paper) => {
  wip.delete(row.id);
  papersIndex[row.id] = getWorkingCopy(papers.find(r => r.id == row.id)!);
}
const cleanAuthors = (authors: AuthorName[]) => {
  for (let i = 0; i < authors.length; ++i) {
    authors[i].prefix = authors[i].prefix.trim();
    authors[i].lastName = authors[i].lastName.trim();
    authors[i].suffix = authors[i].suffix.trim();
    if (authors[i].lastName.length < 0) {
      authors.splice(i, 1);
      --i;
    }
  }
}
const save = async (row: Paper) => {
  cleanAuthors(row.authors);
  if (row.authors.length == 0) {
    return;
  }
  await papersRepo.save(row);
  wip.delete(row.id);
  for (let i = 0; i < papers.length; ++i) {
    if (papers[i].id == row.id) {
      papers[i] = row;
      break;
    }
  }
}
</script>

<template>
  <VTable :data="Object.values(papersIndex)">
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
    <template #body="{ rows }">
      <component :is="editing(row) ? EditableRow : StaticRow" v-for="row in rows" :key="row.id" :row="row"
        @edit="edit(row)" @save="save(row)" @cancel="cancel(row)" />
    </template>
  </VTable>
</template>

<style lang="scss">
* {
  font-family: sans-serif;
}

a,
a:visited {
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
