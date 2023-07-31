import { ref, Ref } from "vue";
import { Paper } from "../../data/entities";
import { remult } from "remult";

export const papers: Ref<Paper[]> = ref([]);

const papersRepo = remult.repo(Paper);

// would need to be called from an onMounted somewhere in the case of SSR (or
// just to clean up side effects from imports)
papersRepo.find().then((p) => (papers.value = p));
