<script setup lang="ts">
import { remult } from "remult"
import { onMounted, ref, Ref } from "vue";
import { Paper } from "../../data/entities";

const papersRepo = remult.repo(Paper);

const papers: Ref<Partial<Paper>[]> = ref([]);
onMounted(async function(){
  papers.value = await papersRepo.find();
});

const paper = ref("");
async function addPaper() {
  const newPaper = {title: paper.value};
  paper.value = "";
  papers.value.push(newPaper);
  await papersRepo.insert(newPaper);
}
</script>

<template>
  <h1>Hello</h1>
  <p v-for="p in papers">{{ p.title }}</p>
  <input type="text" v-model="paper">
  <button @click="addPaper">add</button>
</template>
