<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { AuthorName, Paper } from '../../data/entities';
import { getPublicationDate } from '../code/dataUtilities';
import { PhPenNib as EditIcon } from "@phosphor-icons/vue";

const fullName = (author: AuthorName) =>
    [author.prefix, author.lastName, author.suffix].filter(a => a).join(' ');
const authorsToShow = 3;
const props = defineProps<{ row: Paper, bg: string, sortedTags: string[], highlighted: boolean }>();
const etAl = computed(() => props.row.authors.slice(authorsToShow).map(fullName).join(", "));
const citationsUpdated = computed(() =>
    props.row.citationsUpdated ?
        ('Last updated: ' + props.row.citationsUpdated.toLocaleDateString()) :
        ''
);
const published = computed(() => getPublicationDate(props.row));
const el = ref<HTMLElement | null>(null);
onMounted(() => {
    if (props.highlighted) {
        nextTick(() => el.value?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
});
// this component doesn't use all of these but for it to be interchangable with
// editablerow without warnings we have to pretend
defineEmits(['edit', 'save', 'cancel', 'delete']);
</script>

<template>
    <tr>
        <td ref="el" style="justify-content: flex-end">{{ published }}</td>
        <td><a :class="{ link: row.link }" :href="row.link || undefined" target="_blank">{{ row.title }}</a></td>
        <td>
            <div class="authors-container">
                <span v-for="author, i in row.authors.slice(0, authorsToShow)" :key="i" :title="fullName(author)">
                    {{ author.lastName + (i != row.authors.length - 1 ? ', ' : '') }}
                </span>
                <span v-if="row.authors.length > authorsToShow" :title="etAl">et al.</span>
            </div>
        </td>
        <td>
            <router-link class="link" :to="'/notes/' + row.id">View</router-link>
        </td>
        <td>{{ sortedTags.join(", ") }}</td>
        <td :title="citationsUpdated">{{ row.citationCount || "-" }}</td>
        <td class="button">
            <button title="edit row" @click="$emit('edit')">
                <EditIcon weight="duotone" color="#6146BD" />
            </button>
        </td>
    </tr>
</template>

<style scoped lang="scss">
@import "~/styles/tables.scss";

td {
    background-color: v-bind("props.bg");
}
</style>
