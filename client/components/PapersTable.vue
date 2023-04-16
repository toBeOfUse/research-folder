<script setup lang="ts">
import { remult } from "remult"
import { onMounted, reactive } from "vue";
import { AuthorName, Paper } from "../../data/entities";
import StaticRow from "./StaticRow.vue";
import EditableRow from "./EditableRow.vue";
import AddRow from "./AddRow.vue";

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
    authors: JSON.parse(JSON.stringify(cleanAuthors(paper.authors)))
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
    if (authors[i].lastName.trim().length < 0) {
      authors.splice(i, 1);
      --i;
    }
  }
  return authors;
}
const save = async (row: Paper, insert: boolean = false) => {
  cleanAuthors(row.authors);
  // TODO: more validation? on tags?
  if (insert) {
    row.id = "";
    row.citationsUpdated = new Date();
    row = await papersRepo.insert(row);
    papers.push(row);
    papersIndex[row.id] = row;
  } else {
    for (let i = 0; i < papers.length; ++i) {
      if (papers[i].id == row.id) {
        if (papers[i].citationCount != row.citationCount) {
          row.citationsUpdated = new Date();
        }
        papers[i] = row;
        break;
      }
    }
    row = await papersRepo.save(row);
  }
  wip.delete(row.id);
}
const del = async (row: Paper) => {
  if (confirm(`Delete entry for ${row.title}?`)) {
    await papersRepo.delete(row);
    delete papersIndex[row.id];
    papers = papers.filter(p => p.id != row.id);
  }
}

const authorsToSortKey = (authors: AuthorName[]) => {
  return authors.map(a => a.lastName).join('');
}

</script>

<template>
  <div id="page-container">
    <h1 id="table-header">Research Papers</h1>
    <VTable :data="Object.values(papersIndex)" sortHeaderClass="spaced-header" style="min-width: 950px">
      <template #head>
        <VTh sortKey="published">Published</VTh>
        <VTh sortKey="title">Title</VTh>
        <VTh :sortKey="({ authors }: Paper) => authorsToSortKey(authors)">Authors</VTh>
        <th>Notes</th>
        <th>Tags</th>
        <VTh sortKey="citationCount">Refs</VTh>
        <th />
      </template>
      <template #body="{ rows }">
        <component :is="editing(row) ? EditableRow : StaticRow" v-for="row, rowIndex in rows" :key="row.id" :row="row"
          @edit="edit(row)" @save="save(row)" @cancel="cancel(row)" @delete="del(row)"
          :bg="rowIndex % 2 == 1 ? 'white' : '#d7ebf5'" />
        <AddRow @add-row="row => save(row, true)" />
      </template>
    </VTable>
  </div>
</template>

<style lang="scss">
* {
  font-family: sans-serif;
}

a,
a:visited,
button.link {
  color: blue;
  text-decoration: underline;
}

.spaced-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

<style scoped lang="scss">
@import "../styles/tables.scss";

#page-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  width: fit-content;
}

#table-header {
  margin: 80px 0 40px 10px;
}
</style>
