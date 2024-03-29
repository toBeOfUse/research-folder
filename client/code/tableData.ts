import { ref, Ref } from "vue";
import { Paper } from "../../data/entities";
import { remult } from "remult";
import { Op } from "quill-delta";

export const papers: Ref<Paper[]> = ref([]);

// would need to be created by a call from an onMounted somewhere in the case of
// SSR (or just to clean up side effects from imports...)
export const papersLoaded = remult
  .repo(Paper)
  .find()
  .then((p) => (papers.value = p));

export const notesCache: Record<string, Op[]> = {};
