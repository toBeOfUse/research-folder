<template>
    <div id="home-tag">
        <RouterLink to="/">🏠</RouterLink>
        <a @click="showGraph = true">🌎</a>
    </div>
    <div v-if="showGraph" @click="showGraph = false" id="backdrop">
        <div @click.stop id="graph">
            <div style="display: flex; padding: 0 20px;">
                <h2>Graph of <select v-model="whichGraph">
                        <option value="/mentionsgraph">Mentions in Notes</option>
                        <option value="/referencesgraph">Citations</option>
                    </select></h2>
                <h2 @click="showGraph = false" style="cursor: pointer;margin-left: auto;">✖</h2>
            </div>
            <graph :src="whichGraph" :key="whichGraph" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';
const Graph = defineAsyncComponent(() => import('./Graph.vue'));
const showGraph = ref(false);
const whichGraph = ref("/mentionsgraph");
</script>

<style lang="scss" scoped>
#home-tag {
    position: fixed;
    left: -38px;
    bottom: 30px;
    transition: left 0.1s linear;
    display: flex;
    flex-direction: column;
    gap: 5px;

    background-color: white;
    border: 1px solid black;
    padding: 3px;

    a {
        padding: 3px 10px;
        text-decoration: none;
        cursor: pointer;
    }

    &:hover {
        left: -5px;
    }
}

#backdrop {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: #0002;
}

#graph {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    border: 1px solid black;
    box-shadow: 2px 2px 2px black;
}
</style>
