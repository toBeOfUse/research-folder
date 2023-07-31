<script setup lang="ts">
import contenteditable from "vue-contenteditable";
import draggable from "vuedraggable";
import { ref, watch } from 'vue';
import LocalTagOrder from "../code/tagOrder";
import { TagOrderType } from "../../data/entities";

const props = defineProps<{ type: string, local: LocalTagOrder }>();
const saved = ref(true);
watch(props.local.tags, () => {
    saved.value = false;
});
const save = () => {
    props.local.save().then(() => saved.value = true);
}
</script>

<template>
    <div class="tag-order-container">
        <span style="display: inline-block; width: 125px">
            Tag {{ type == TagOrderType.ordering ? "order" : "precedence" }}:
        </span>
        <draggable class="tag-order-container" v-model="local.tags.value" handle=".tactile"
            :item-key="(tag: string) => local.tags.value.indexOf(tag)">
            <template #item="{ element, index }">
                <div class="movable-tag">
                    <contenteditable tag="span" data-ph="add tag..." v-model="local.tags.value[index]" />
                    <button @click="local.tags.value.splice(index, 1); saved = false">✖</button>
                    <button class="tactile">&nbsp;</button>
                </div>
            </template>
        </draggable>
        <button :disabled="saved" style="margin-left: 20px" class="wide-button" @click="save">
            Save{{ saved ? "d" : "" }}
        </button>
    </div>
</template>

<style scoped lang="scss">
@import "../styles/tables.scss";

.tag-order-container {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin: 5px 0;
}

.tag-order-container span {
    min-width: 40px;
}

.movable-tag {
    margin: 0 5px;
    padding: 3px 5px;
    background-color: white;
    border: 1px solid gray;
    border-radius: 3px;
    display: flex;
    align-items: center;
}

button.tactile {
    width: 10px;
    height: 10px;
    background-image: radial-gradient(gray 0%, gray 50%, transparent 50%, transparent 100%);
    background-size: 3px 3px;
    margin: 0 4px;
    cursor: grab;
}
</style>
