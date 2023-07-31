<script setup lang="ts">
import "normalize.css";
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="PapersTable">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style>
#app {
  width: 100%;
}
</style>
