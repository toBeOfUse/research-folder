<script setup lang="ts">
import "normalize.css";
import HomeTag from "./components/HomeTag.vue";
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="PapersTable">
      <component :is="Component" :key="$route.fullPath" />
    </keep-alive>
  </router-view>
  <home-tag />
</template>

<style lang="scss">
@import "~/styles/fonts.scss";

#app {
  width: 100%;
}

* {
  font-family: "Almarai", sans-serif;
}
</style>
