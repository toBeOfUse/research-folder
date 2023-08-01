import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import SmartTable from "vuejs-smart-table";
import PapersTable from "./components/PapersTable.vue";

const routes = [
  { path: "/", component: PapersTable },
  { path: "/notes/:id", component: () => import("./components/NoteTaker.vue") },
];

createApp(App)
  .use(SmartTable)
  .use(createRouter({ history: createWebHistory(), routes }))
  .mount("#app");
