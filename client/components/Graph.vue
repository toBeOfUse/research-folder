<template>
    <div id="cy" ref="cy" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import cytoscape, { CoseLayoutOptions } from 'cytoscape';
import coseBilkent from "cytoscape-cose-bilkent";
import { papers, papersLoaded } from '../code/tableData';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{ src: string }>();

const route = useRoute();
const router = useRouter();

const cy = ref<HTMLElement | null>(null);

const style = computed(() => {
    const result: cytoscape.Stylesheet[] = [
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
        {
            selector: "edge",
            style: {
                'width': 3,
                'line-color': '#ccc',
                'curve-style': "straight",
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                "arrow-scale": 1.5
            }
        },
        {
            selector: 'node.highlight',
            style: {
                'border-color': '#FFF',
                'border-width': '2px'
            }
        },
        {
            selector: 'node.semitransp',
            style: { opacity: 0.5 }
        },
        {
            selector: 'edge.highlight',
            style: {
                'line-color': 'black',
                'target-arrow-color': 'black',
                'z-index': 1000
            }
        },
        {
            selector: 'edge.semitransp',
            style: { 'opacity': 0.8 }
        }
    ];
    if (route.params.id) {
        result.push({
            selector: 'node#' + route.params.id,
            style: {
                color: "#2954f0"
            }
        });
    }
    return result;
});

cytoscape.use(coseBilkent);

onMounted(async () => {
    console.log("fetching", props.src);
    const graph: Record<string, string[]> = await (await fetch(props.src)).json();
    await papersLoaded;
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
        layout: ({
            name: "cose-bilkent",
            idealEdgeLength: 300,
            nodeRepulsion: 8000,
        } as unknown) as CoseLayoutOptions,
        pixelRatio: Math.max(window.devicePixelRatio, 1.5),
        style: style.value
    });
    instance.on("click", "node", (event) => {
        router.push("/notes/" + event.target.id());
    });

    // highlight neighbors on hover
    // https://stackoverflow.com/a/38468892/3962267
    instance.on('mouseover', 'node', function (e) {
        const sel: cytoscape.NodeCollection = e.target;
        instance.elements().difference(sel.outgoers()).difference(sel.incomers()).not(sel).addClass('semitransp');
        sel.addClass('highlight').outgoers().union(sel.incomers()).addClass('highlight');
    });
    instance.on('mouseout', 'node', function (e) {
        instance.elements().removeClass('semitransp highlight');
    });

    watch(style, (current) => {
        instance.style(current);
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
