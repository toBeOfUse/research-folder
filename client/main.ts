import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import SmartTable from "vuejs-smart-table";
import PapersTable from "./components/PapersTable.vue";
import NoteTaker from "./components/NoteTaker.vue";

const routes = [
  { path: "/", component: PapersTable },
  { path: "/notes/:id", component: NoteTaker },
];

createApp(App)
  .use(SmartTable)
  .use(createRouter({ history: createWebHistory(), routes }))
  .mount("#app");
