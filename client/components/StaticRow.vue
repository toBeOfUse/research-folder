<script setup lang="ts">
import { ref, computed } from 'vue';
import { AuthorName, Paper } from '../../data/entities';

const notesDisplayed = ref(false);
const fullName = (author: AuthorName) =>
    [author.prefix, author.lastName, author.suffix].filter(a => a).join(' ');
const authorsToShow = 3;
const props = defineProps<{ row: Paper, bg: string }>();
const etAl = computed(() => props.row.authors.slice(authorsToShow).map(fullName).join(", "));
defineEmits(['edit']);
</script>

<template>
    <tr :style="{ backgroundColor: bg }">
        <td style="text-align:right">{{
            row.published.toLocaleDateString("en-us", { month: "long" }) +
            " " + row.published.getFullYear()
        }}</td>
        <td><a class="link" :href="row.link" target="_blank">{{ row.title }}</a></td>
        <td>
            <span v-for="author, i in row.authors.slice(0, authorsToShow)" :key="i" :title="fullName(author)">
                {{ author.lastName + (i != row.authors.length - 1 ? ', ' : '') }}
            </span>
            <span v-if="row.authors.length > authorsToShow" :title="etAl"> et al.</span>
        </td>
        <td><button class="link" @click="notesDisplayed = !notesDisplayed">{{ notesDisplayed ? "Close" : "Edit" }}</button>
        </td>
        <td>{{ row.tags.join(", ") }}</td>
        <td class="button"><button title="edit row" @click="$emit('edit')">📝</button></td>
    </tr>
    <tr v-if="notesDisplayed" :style="{ backgroundColor: bg }">
        <td colspan="7">
            <div class="notes-container">
                <textarea style="resize:vertical" v-model="row.notes" />
                <div class="notes-edit-row">
                    <label><input type="checkbox" v-model="row.read" /> Mitch has read this</label>
                    <button @click="$emit('save', row)" class="save-notes">Save</button>
                </div>
            </div>
        </td>
    </tr>
</template>

<style scoped lang="scss">
@import "../styles/tables.scss";
</style>
