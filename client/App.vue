<script setup lang="ts">
import "normalize.css";
</script>

<template>
  <KeepAlive include="PapersTable">
    <RouterView />
  </KeepAlive>
</template>

<style>
#app {
  width: 100%;
}
</style>
