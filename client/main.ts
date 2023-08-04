import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import SmartTable from "vuejs-smart-table";
import PapersTable from "./components/PapersTable.vue";
import { papers, papersLoaded } from "./code/tableData";

const routes = [
  { path: "/", component: PapersTable },
  { path: "/notes/:id", component: () => import("./components/NoteTaker.vue") },
  { path: "/graph", component: () => import("./components/Graph.vue") },
];

const router = createRouter({ history: createWebHistory(), routes });

router.afterEach((to) => {
  if (to.path.startsWith("/notes/") && to.params.id && papers.value?.length) {
    papersLoaded.then(() => {
      document.title = papers.value.find(p=>p.id==to.params.id)?.title +  " - Notes";
    })
  } else {
    document.title = "Research Folder"
  }
});

createApp(App)
  .use(SmartTable)
  .use(router)
  .mount("#app");
