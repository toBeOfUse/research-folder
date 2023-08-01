<template>
    <div id="cy" ref="cy" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import cytoscape from 'cytoscape';
import { papers, papersLoaded } from '../code/tableData';

const cy = ref<HTMLElement | null>(null);

onMounted(async () => {
    const graph: Record<string, string[]> = await (await fetch("/mentionsgraph")).json();
    await papersLoaded;
    const instance = cytoscape({
        container: cy.value,
        elements: [
            ...Object.keys(graph).map(k => ({ data: { id: k, label: papers.value.find(p => p.id == k)!.title.slice(0, 15) } })),  // nodes
            ...Object.keys(graph).flatMap(  // edges
                k => graph[k].map(
                    l => ({ data: { id: k + l, source: k, target: l } })
                )
            )
        ],
        layout: {
            name: "cose",
            componentSpacing: 80,
        },

        style: [
            {
                selector: 'node[label]',
                style: {
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center'
                }
            }
        ]
    });
});
</script>

<style lang="scss" scoped>
#cy {
    width: 800px;
    height: 600px;
    display: block;
}
</style>
