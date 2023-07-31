<script setup lang="ts">
import { remult } from "remult"
import { Ref, onMounted, reactive, ref } from "vue";
import { Filters } from "vuejs-smart-table";
import ContentEditable from "vue-contenteditable";
import { CEOpts } from "../code/settings";
import { AuthorName, Paper, TagOrderType } from "../../data/entities";
import StaticRow from "./StaticRow.vue";
import EditableRow from "./EditableRow.vue";
import AddRow from "./AddRow.vue";
import TagOrderer from "./TagOrderer.vue";
import LocalTagOrder from "../code/tagOrder";
import { cleanAuthors } from "../code/dataUtilities";
import NoteTaker from "./NoteTaker.vue";

const papersRepo = remult.repo(Paper);

// for use in rows in the repos if we want to instance the tables later
const INSTANCE = "mitch";

let papers: Ref<Paper[]> = ref([]);

const tagOrder = new LocalTagOrder(INSTANCE, TagOrderType.ordering);
const tagPrecedence = new LocalTagOrder(INSTANCE, TagOrderType.precedence);

// load papers and initialize two completely separate reactive copies:
async function loadAll() {
  const results = await papersRepo.find();
  papers.value = results;
}
onMounted(loadAll);

// why did i think it was a good idea to be able to edit more than one row at once?
const wip = reactive(new Set<string>());

const edit = (row: Paper) => wip.add(row.id);

const editing = (row: Paper) => wip.has(row.id);

const cancel = (row: Paper) => {
  wip.delete(row.id);
}

const lastSavedPaperID = ref("");
const save = async (row: Paper, insert: boolean = false) => {
  cleanAuthors(row.authors);
  // TODO: more validation? on tags?
  if (insert) {
    row.id = "";
    row.citationsUpdated = new Date();
    row = await papersRepo.insert(row);
    papers.value.push(row);
  } else {
    for (let i = 0; i < papers.value.length; ++i) {
      if (papers.value[i].id == row.id) {
        if (papers.value[i].citationCount != row.citationCount) {
          row.citationsUpdated = new Date();
        }
        papers.value[i] = row;
        break;
      }
    }
    row = await papersRepo.save(row);
  }
  wip.delete(row.id);
  lastSavedPaperID.value = row.id;
}

const del = async (row: Paper) => {
  if (confirm(`Delete entry for ${row.title}?`)) {
    await papersRepo.delete(row);
    papers.value = papers.value.filter(p => p.id != row.id);
  }
}

const authorsToSortKey = (authors: AuthorName[]) => {
  return authors.map(a => a.lastName).join('');
}

const tagSorter = (a: string, b: string) => {
  const aOrder = tagPrecedence.getTagPriority(a);
  const bOrder = tagPrecedence.getTagPriority(b);
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
    const thisPair = tagOrder.getTagPriority(a[i]) - tagOrder.getTagPriority(b[i]);
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

const takingNotesOn: Ref<string | undefined> = ref(undefined);

const filters: Filters = reactive({
  title: {
    value: "",
    keys: ["title"]
  },
  authors: {
    value: "",
    custom(value, row) {
      const v = (value as string).toLowerCase();
      return (row as Paper).authors
        .some(a => a.lastName.toLowerCase().includes(v) ||
          a.prefix.toLowerCase().includes(v) ||
          a.suffix.toLowerCase().includes(v))
    }
  },
  tags: {
    value: "",
    custom(value, row) {
      const words = (value as string).trim().toLowerCase().split(' ');
      return (row as Paper).tags.some(
        t => words.some(w => t.toLowerCase().includes(w))
      );
    }
  }
});

const closeNotes = (newNotes: string) => {
  const paper = papers.value.find(p => p.id == takingNotesOn.value);
  if (paper) {
    paper.notes = newNotes;
  }
  takingNotesOn.value = undefined;
}

</script>

<template>
  <div id="page-container">
    <NoteTaker v-if="takingNotesOn" :paper="papers.find(p => p.id == takingNotesOn)!" @close="closeNotes" />
    <h1 id="table-header">Mitch's Research Paper Index</h1>
    <VTable :filters="filters" :data="papers" sortHeaderClass="spaced-header" id="the-table"
      :style="takingNotesOn && { display: 'none' }">
      <template #head>
        <VTh :sortKey="({ published }: Paper) => published.toISOString()">Published</VTh>
        <VTh sortKey="title">
          <span>Title</span>
          <ContentEditable v-bind="CEOpts" data-ph="Search..." tag="span" v-model="filters.title.value"
            style="font-weight:normal" @click="(e: MouseEvent) => e.stopPropagation()" />
        </VTh>
        <VTh :sortKey="({ authors }: Paper) => authorsToSortKey(authors)">
          <span>Authors</span>
          <ContentEditable v-bind="CEOpts" data-ph="Search..." tag="span" v-model="filters.authors.value"
            style="font-weight:normal" @click="(e: MouseEvent) => e.stopPropagation()" />
        </VTh>
        <th>Notes</th>
        <VTh :customSort="tagBasedPaperSorter" defaultSort="asc">
          <span>Tags</span>
          <ContentEditable v-bind="CEOpts" data-ph="Search..." tag="span" v-model="filters.tags.value"
            style="font-weight:normal" @click="(e: MouseEvent) => e.stopPropagation()" />
        </VTh>
        <VTh sortKey="citationCount">Citations</VTh>
        <th />
      </template>
      <template #body="{ rows }">
        <AddRow @add-row="(row: Paper) => save(row, true)" />
        <component :is="editing(row) ? EditableRow : StaticRow" v-for="row, rowIndex in rows" :key="row.id" :row="row"
          @edit="edit(row)" @save="row => save(row)" @cancel="cancel(row)" @delete="del(row)"
          @notes="takingNotesOn = row.id" :sortedTags="[...row.tags].sort(tagSorter)"
          :bg="row.id == lastSavedPaperID ? '#e6fae7' : rowIndex % 2 == 1 ? 'white' : '#d7ebf5'"
          :highlighted="row.id == lastSavedPaperID" />
      </template>
    </VTable>
    <TagOrderer :type="TagOrderType.precedence" :local="tagPrecedence" />
    <TagOrderer :type="TagOrderType.ordering" :local="tagOrder" />
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

  &>span {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-right: 10px;
  }
}
</style>

<style scoped lang="scss">
@import "../styles/tables.scss";

#page-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto 200px;
  width: 95vw;
  min-width: 1250px;
}

#the-table {
  width: 100%;
  margin-bottom: 20px;
  // html table with column sizing determined by css grid properties, based on:
  // https://adamlynch.com/flexible-data-tables-with-css-grid/
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr) minmax(0, 0.6fr) 65px 0.5fr 80px 40px;
}

:deep(thead),
:deep(tbody),
tr {
  display: contents;
}

#table-header {
  margin: 80px 0 40px 10px;
}
</style>
