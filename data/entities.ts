import { Entity, Fields, Validators } from "remult";
import { Op } from "quill-delta";
import { mentionsGraph } from "../server/graph";

export interface AuthorName {
  // first name and maybe middle name or initial; not always displayed
  prefix: string;
  // last name, displayed always
  lastName: string;
  // Jr., Sr., etc
  suffix: string;
}

@Entity<Paper>("papers", { allowApiCrud: true })
export class Paper {
  @Fields.uuid()
  id!: string;

  @Fields.string()
  title = "";

  @Fields.object()
  authors: AuthorName[] = [];

  @Fields.object()
  tags: string[] = [];

  @Fields.string()
  link = "";

  @Fields.dateOnly()
  published = new Date(1990, 0, 1);

  @Fields.string()
  semanticScholarID = "";

  @Fields.number()
  citationCount = 0;

  @Fields.date()
  citationsUpdated? = new Date();
}

@Entity<Notes>("notes", {
  allowApiCrud: true,
  id: (e) => e.paperID,
  saved(row) {
    // hack to only do the work of maintaining the mentions graph on the backend
    if (typeof window === "undefined") {
      mentionsGraph[row.paperID] = row.getMentions();
    }
  },
})
export class Notes {
  @Fields.string({ validate: Validators.uniqueOnBackend })
  paperID!: string;

  @Fields.string()
  notesHTML = "";

  @Fields.json()
  notesDeltaOps: Op[] = [];

  getMentions() {
    const mentions = [];
    for (const op of this.notesDeltaOps) {
      if ((op.insert as Record<string, unknown>)?.mentionLink) {
        mentions.push(
          (op.insert as Record<string, { id: string }>).mentionLink.id
        );
      }
    }
    return mentions;
  }
}

// should have one entity of each type for each instance
export enum TagOrderType {
  ordering = "ordering",
  precedence = "precedence",
}

@Entity<TagOrder>("tagOrder", {
  allowApiCrud: true,
  id: (t) => [t.instance, t.type],
})
export class TagOrder {
  @Fields.string()
  instance: string = "mitch";

  @Fields.string()
  type: TagOrderType = TagOrderType.ordering;

  @Fields.json()
  order: string[] = [];
}
