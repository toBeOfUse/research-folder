import { TagOrder, TagOrderType } from "../../data/entities";
import { Ref, ref, watch } from "vue";
import { Repository, remult } from "remult";

export default class LocalTagOrder {
  instance: string;
  type: TagOrderType;
  tags: Ref<string[]> = ref([]);
  repo: Repository<TagOrder> = remult.repo(TagOrder);

  constructor(instance: string, type: TagOrderType) {
    this.instance = instance;
    this.type = type;
    // ensure there is always an empty string at the end for a new tag to be
    // entered
    watch(
      this.tags,
      (v: string[]) => {
        if (!v.length || v[v.length - 1] != "") {
          v.push("");
        }
      },
      { deep: true }
    );
    this.load();
  }
  async load() {
    const order = await this.repo.findFirst(
      { instance: this.instance, type: this.type },
      { createIfNotFound: true }
    );
    this.tags.value = order.order;
  }
  async save() {
    const toSave = this.tags.value.filter((t) => t.trim().length);
    // can't update entities with compound primary keys properly :(
    const existing = await this.repo.find({
      where: { instance: this.instance, type: this.type },
    });
    // should only be one, but just in case
    for (const exists of existing) {
      this.repo.delete(exists);
    }
    await this.repo.save({
      instance: this.instance,
      type: this.type,
      order: toSave,
    });
  }
  getTagPriority(tag: string) {
    const tagIndex = this.tags.value.indexOf(tag);
    if (tagIndex != -1) {
      return tagIndex;
    }
    const wildcardIndex = this.tags.value.indexOf("*");
    if (wildcardIndex != -1) {
      return wildcardIndex;
    }
    return this.tags.value.length + 1;
  }
}
