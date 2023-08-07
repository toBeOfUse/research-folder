<template>
    <div @click.stop id="graph">
        <div style="display: flex; align-items: center; gap: 10px; padding: 0 20px;">
            <h2 id="heading">
                Graph of <select v-model="whichGraph">
                    <option :value="GraphSource.mentions">Mentions in Notes</option>
                    <option :value="GraphSource.references">Citations</option>
                    <option :value="GraphSource.reducedReferences">Transitive Citations</option>
                </select>
                <label id="positions">
                    <input type="checkbox" :checked="useEmbeddingPos" />
                    Use Positions from Embeddings
                </label>
            </h2>
            <h2 @click="$emit('close')" style="cursor: pointer;margin-left: auto;">✖</h2>
        </div>
        <div id="cy" ref="cy" />
        <p style="text-align: center">
            Hover over a paper to highlight its links. If you click on a
            paper, it will open in the background.
        </p>
        <p style="text-align: center" v-if="whichGraph == GraphSource.reducedReferences">
            This is the transitive reduction of the citations graph; it
            removes paths that connect the same nodes more than once.
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import cytoscape, { CoseLayoutOptions } from 'cytoscape';
import coseBilkent from "cytoscape-cose-bilkent";
import { papers, papersLoaded } from '../code/tableData';
import { useRoute, useRouter } from 'vue-router';
import { saveAs } from 'file-saver';
import { GraphSource, Paper, RecordGraph } from '../../data/entities';

defineEmits<{ close: void }>();

const whichGraph = ref(GraphSource.references);
const graph = ref<RecordGraph>({});
watch(whichGraph, async () => {
    graph.value = await Paper.getGraph(whichGraph.value);
}, { immediate: true });

const route = useRoute();
const router = useRouter();

const useEmbeddingPos = ref(true);

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
                'border-width': '2px',
                'z-index': 1000
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

const layout = computed<cytoscape.LayoutOptions>(() => {
    if (useEmbeddingPos.value) {
        return { name: "preset", fit: true };
    } else {
        return {
            name: "cose-bilkent",
            idealEdgeLength: 100,
            nodeRepulsion: 10000,
            edgeElasticity: 0.01,
            gravity: 10,
            nodeDimensionsIncludeLabels: true,
            fit: true
        } as any;
    }
});

const elements = computed(() => [
    ...papers.value.map(k => ({
        data: { id: k.id, label: k.title },
        position: { x: k.projectedX * 1000, y: k.projectedY * 1000 }
    })),  // nodes
    ...Object.keys(graph.value).flatMap(  // edges
        k => graph.value[k].map(
            l => ({ data: { id: k + l, source: k, target: l } })
        )
    )
]);

cytoscape.use(coseBilkent);

const mounted = new Promise<void>(resolve => onMounted(resolve));

let instance: cytoscape.Core | undefined = undefined;

async function makeCytoscapeGraph() {
    await mounted;
    await papersLoaded;
    instance = cytoscape({
        container: cy.value,
        elements: elements.value,
        pixelRatio: Math.max(window.devicePixelRatio, 1.5),
        style: style.value,
    });
    instance.on("click", "node", (event) => {
        router.push("/notes/" + event.target.id());
    });

    // highlight neighbors on hover
    // https://stackoverflow.com/a/38468892/3962267
    instance.on('mouseover', 'node', function (e) {
        const sel: cytoscape.NodeCollection = e.target;
        instance?.elements().difference(sel.outgoers()).difference(sel.incomers()).not(sel).addClass('semitransp');
        sel.addClass('highlight').outgoers().union(sel.incomers()).addClass('highlight');
    });
    instance.on('mouseout', 'node', function (e) {
        instance?.elements().removeClass('semitransp highlight');
    });

    (window as any).saveGraphPNG = function () {
        instance?.png({ bg: "white", output: 'blob-promise', full: true, scale: 2 })
            .then(b => saveAs(b, "graph.png"));
    };
}

watch(style, (current) => {
    if (instance) {
        instance.style(current);
    }
});

watch(layout, (current) => {
    if (instance) {
        instance.layout(current).run();
    }
});

watch(elements, (current) => {
    if (instance) {
        instance.elements().remove();
        instance.add(current);
    }
});

makeCytoscapeGraph();

</script>

<style lang="scss" scoped>
#cy {
    width: 70vw;
    height: 75vh;
    display: block;
}

#heading {
    width: 100%;
    display: flex;
    gap: 20px;
    padding: 0 20px;
    justify-content: space-between;
    align-items: center;
}

#positions {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    margin-left: auto;
}
</style>
