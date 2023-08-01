<template>
    <div id="cy" ref="cy" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import cytoscape from 'cytoscape';
import { papers, papersLoaded } from '../code/tableData';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const cy = ref<HTMLElement | null>(null);

onMounted(async () => {
    const graph: Record<string, string[]> = await (await fetch("/mentionsgraph")).json();
    await papersLoaded;
    const style: cytoscape.Stylesheet[] = [
        {
            selector: 'node[label]',
            style: {
                'label': 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                "text-wrap": "wrap",
                "text-max-width": "100px"
            },
        },
        {
            selector: 'node',
            style: {
                width: "label",
                height: "label",
                backgroundColor: "white"
            }
        },
    ];
    if (route.params.id) {
        style.push({
            selector: 'node#' + route.params.id,
            style: {
                color: "#2954f0"
            }
        });
    }
    const instance = cytoscape({
        container: cy.value,
        elements: [
            ...papers.value.map(k => ({ data: { id: k.id, label: k.title } })),  // nodes
            ...Object.keys(graph).flatMap(  // edges
                k => graph[k].map(
                    l => ({ data: { id: k + l, source: k, target: l } })
                )
            )
        ],
        layout: {
            name: "cose",
            componentSpacing: 80,
            animate: false
        },
        style,
        pixelRatio: Math.max(window.devicePixelRatio, 1.5)
    });
    instance.on("click", "node", (event) => {
        router.push("/notes/" + event.target.id());
    });
    router.afterEach((to) => {
        if (to.params.id) {
            style[style.length - 1].selector = "node#" + to.params.id;
            instance.style(style);
        }
    });
});
</script>

<style lang="scss" scoped>
#cy {
    width: 70vw;
    height: 80vh;
    display: block;
}
</style>
