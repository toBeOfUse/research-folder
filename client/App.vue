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

<style>
#app {
  width: 100%;
}
</style>
