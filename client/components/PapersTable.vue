<script setup lang="ts">
import { remult } from "remult"
import { computed, onMounted, reactive, ref, watch } from "vue";
import { AuthorName, Paper, TagOrder, TagOrderType } from "../../data/entities";
import StaticRow from "./StaticRow.vue";
import EditableRow from "./EditableRow.vue";
import AddRow from "./AddRow.vue";
import contenteditable from "vue-contenteditable";
import draggable from "vuedraggable";

const papersRepo = remult.repo(Paper);
const tagOrderRepo = remult.repo(TagOrder);

// for use in rows in the repos if we want to instance the tables later
const INSTANCE = "mitch";

// stores papers straight from the database; used to populate papersIndex and
// then revert to originals if necessary
let papers: Paper[] = [];

// stores "working copy" of papers that is actually displayed and editable;
// needs to be indexable by row.id because sorting/filtering the table will
// change the order/indexes of displayed rows
const papersIndex: Record<string, Paper> = reactive({});

const tagOrder = ref<string[]>([]);
const tagPrecedence = ref<string[]>([]);

// TODO: move to editable component
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
  const dbOrder = await tagOrderRepo.findFirst(
    { instance: INSTANCE, type: TagOrderType.ordering },
    { createIfNotFound: true }
  );
  const dbPrecedence = await tagOrderRepo.findFirst(
    { instance: INSTANCE, type: TagOrderType.precedence },
    { createIfNotFound: true }
  )
  tagOrder.value = dbOrder.order;
  tagPrecedence.value = dbPrecedence.order;
}
onMounted(loadAll);

const ensureLastStringEmpty = (v: string[]) => {
  if (!v.length || v[v.length - 1] != "") { v.push("") }
};

watch(tagOrder, ensureLastStringEmpty, { deep: true });
watch(tagPrecedence, ensureLastStringEmpty, { deep: true });

const saveTagOrder = async (type: TagOrderType) => {
  const toSave = tagOrder.value.filter(t => t.trim().length);
  await tagOrderRepo.save({ instance: INSTANCE, type, order: toSave });
}

const wip = reactive(new Set<string>());

const edit = (row: Paper) => wip.add(row.id);

const editing = (row: Paper) => wip.has(row.id);

const cancel = (row: Paper) => {
  wip.delete(row.id);
  papersIndex[row.id] = getWorkingCopy(papers.find(r => r.id == row.id)!);
}

const cleanAuthors = (authors: AuthorName[]) => {
  for (let i = 0; i < authors.length; ++i) {
    if (!authors[i].lastName || authors[i].lastName.trim().length < 0) {
      authors.splice(i, 1);
      --i;
      continue;
    }
    authors[i].prefix = authors[i].prefix.trim();
    authors[i].lastName = authors[i].lastName.trim();
    authors[i].suffix = authors[i].suffix.trim();
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

const getTagSortOrder = (tag: string) => {
  const tagIndex = tagOrder.value.indexOf(tag);
  if (tagIndex != -1) {
    return tagIndex;
  }
  const wildcardIndex = tagOrder.value.indexOf("*");
  if (wildcardIndex != -1) {
    return wildcardIndex;
  }
  return tagOrder.value.length + 1;
}

const tagSorter = (a: string, b: string) => {
  const aOrder = getTagSortOrder(a);
  const bOrder = getTagSortOrder(b);
  if (aOrder != bOrder) {
    return aOrder - bOrder;
  } else {
    return a.localeCompare(b);
  }
};

const tagBasedPaperSorter = (one: Paper, two: Paper, direction: number) => {
  const a = [...one.tags].sort(tagSorter);
  const b = [...two.tags].sort(tagSorter);
  for (let i = 0; i < Math.min(a.length, b.length); ++i) {
    const thisPair = tagSorter(a[i], b[i]);
    if (thisPair != 0) {
      return direction * thisPair;
    }
  }
  if (a.length != b.length) {
    return direction * (a.length - b.length);
  } else if (a.length == 0) {
    return 0;
  } else {
    return direction * (a[a.length - 1].localeCompare(b[b.length - 1]));
  }
}

</script>

<template>
  <div id="page-container">
    <h1 id="table-header">Mitch's Research Paper Index</h1>
    <VTable :data="Object.values(papersIndex)" sortHeaderClass="spaced-header"
      style="min-width: 950px; margin-bottom: 20px">
      <template #head>
        <VTh :sortKey="({ published }: Paper) => published.toISOString()">Published</VTh>
        <VTh sortKey="title">Title</VTh>
        <VTh :sortKey="({ authors }: Paper) => authorsToSortKey(authors)">Authors</VTh>
        <th>Notes</th>
        <VTh :customSort="tagBasedPaperSorter" defaultSort="asc">Tags</VTh>
        <VTh sortKey="citationCount">Crossrefs</VTh>
        <th />
      </template>
      <template #body="{ rows }">
        <component :is="editing(row) ? EditableRow : StaticRow" v-for="row, rowIndex in rows" :key="row.id" :row="row"
          @edit="edit(row)" @save="save(row)" @cancel="cancel(row)" @delete="del(row)"
          :sortedTags="[...row.tags].sort(tagSorter)" :bg="rowIndex % 2 == 1 ? 'white' : '#d7ebf5'" />
        <AddRow @add-row="row => save(row, true)" />
      </template>
    </VTable>
    <div class="tag-order-container">
      Tag order for sorting:
      <draggable class="tag-order-container" v-model="tagOrder" handle=".tactile"
        :item-key="(tag: string) => tagOrder.indexOf(tag)">
        <template #item="{ element, index }">
          <div class="movable-tag">
            <contenteditable tag="span" data-ph="add tag..." v-model="tagOrder[index]" />
            <button class="tactile">&nbsp;</button>
          </div>
        </template>
      </draggable>
      <button class="wide-button" @click="() => saveTagOrder(TagOrderType.ordering)">Save</button>
    </div>
  </div>
</template>

<style lang="scss">
* {
  font-family: sans-serif;
}

a.link,
a.link:visited,
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
  margin: 0 auto 200px;
  width: fit-content;
}

#table-header {
  margin: 80px 0 40px 10px;
}

.tag-order-container {
  display: flex;
  align-items: center;
}

.tag-order-container span {
  min-width: 40px;
}

.movable-tag {
  margin: 0 5px;
  padding: 3px 5px;
  background-color: white;
  border: 1px solid gray;
  border-radius: 3px;
  display: flex;
  align-items: center;
}

button.tactile {
  width: 10px;
  height: 10px;
  background-image: radial-gradient(gray 0%, gray 50%, transparent 50%, transparent 100%);
  background-size: 3px 3px;
  margin: 0 4px;
  cursor: grab;
}
</style>
