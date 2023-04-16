<script setup lang="ts">
import { ref, computed } from 'vue';
import { AuthorName, Paper } from '../../data/entities';

const notesDisplayed = ref(false);
const fullName = (author: AuthorName) =>
    [author.prefix, author.lastName, author.suffix].filter(a => a).join(' ');
const authorsToShow = 3;
const props = defineProps<{ row: Paper, bg: string, sortedTags: string[] }>();
const etAl = computed(() => props.row.authors.slice(authorsToShow).map(fullName).join(", "));
const citationsUpdated = computed(() =>
    props.row.citationsUpdated ?
        ('Last modified: ' + props.row.citationsUpdated.toLocaleDateString()) :
        ''
);
const published = computed(() =>
    props.row.published.toLocaleDateString("en-us", { month: "long" }) +
    " " + props.row.published.getFullYear()
);
const notesSaved = ref(true);
// this component doesn't use all of these but for it to be interchangable with
// editablerow without warnings we have to pretend
defineEmits(['edit', 'save', 'cancel', 'delete']);
</script>

<template>
    <tr :style="{ backgroundColor: bg }">
        <td style="text-align: right; width: 125px">{{ published }}</td>
        <td><a :class="{ link: row.link }" :href="row.link || undefined" target="_blank">{{ row.title }}</a></td>
        <td>
            <span v-for="author, i in row.authors.slice(0, authorsToShow)" :key="i" :title="fullName(author)">
                {{ author.lastName + (i != row.authors.length - 1 ? ', ' : '') }}
            </span>
            <span v-if="row.authors.length > authorsToShow" :title="etAl"> et al.</span>
        </td>
        <td><button class="link" @click="notesDisplayed = !notesDisplayed">{{ notesDisplayed ? "Close" : "Edit" }}</button>
        </td>
        <td>{{ sortedTags.join(", ") }}</td>
        <td :title="citationsUpdated">{{ row.citationCount || "-" }}</td>
        <td class="button"><button title="edit row" @click="$emit('edit')">📝</button></td>
    </tr>
    <tr v-if="notesDisplayed" :style="{ backgroundColor: bg }">
        <td colspan="8">
            <div class="notes-container">
                <textarea style="resize:vertical;height:150px" v-model="row.notes" @input="notesSaved = false" />
                <div class="notes-edit-row">
                    <button @click="$emit('save', row); notesSaved = true" class="square-button">
                        Save{{ notesSaved ? 'd' : '' }}
                    </button>
                </div>
            </div>
        </td>
    </tr>
</template>

<style scoped lang="scss">
@import "../styles/tables.scss";
</style>
