import {
  BackendMethod,
  Entity,
  Fields,
  Validators,
  getEntityRef,
  isBackend,
} from "remult";
import { Op } from "quill-delta";

export type RecordGraph = Record<string, string[]>;

// these objects map outgoing references from papers to other papers. the keys
// are IDs of papers from the local database. the values are arrays of paper IDs
// from the local database. to avoid the need to recreate them on the frontend
// every time the site loads, they are updated and stored semi-persistently in
// memory on the backend and need to be retrieved by the frontend through
// @BackendMethods.
export const mentionsGraph: RecordGraph = {};
export const referencesGraph: RecordGraph = {};
// this is the transitive reduction of the references graph, in which there is
// at most one path between any two nodes.
export const reducedReferencesGraph: RecordGraph = {};

export enum GraphSource {
  references,
  reducedReferences,
  mentions,
}

// these functions don't need definitions on the frontend. they are given
// definitions by graphFunctions.ts, which is only imported on the backend
export const graphFunctions = {
  makeMentionsGraph: async () => {},
  makeReferenceGraph: async () => {},
  updateEmbeddingCoords: async () => {},
};

export interface AuthorName {
  // first name and maybe middle name or initial; not always displayed
  prefix: string;
  // last name, displayed always
  lastName: string;
  // Jr., Sr., etc
  suffix: string;
}

@Entity<Paper>("papers", {
  allowApiCrud: true,
  saving(row) {
    if (
      isBackend() &&
      row.embedding.length == 0 &&
      row.semanticScholarID &&
      Paper.embeddingCache[row.semanticScholarID]
    ) {
      row.embedding = Paper.embeddingCache[row.semanticScholarID];
      if (getEntityRef(row).isNew()) {
        Paper.embeddingCache = {};
      }
    }
  },
  saved(row) {
    if (isBackend() && getEntityRef(row).isNew()) {
      graphFunctions.makeReferenceGraph();
      graphFunctions.updateEmbeddingCoords();
    }
  },
})
export class Paper {
  /**
   * When a new paper is loaded from the Semantic Scholar API, its embedding is
   * saved here and the rest of it is sent to the frontend to be edited by the
   * user. Then, when a new row is actually saved, the cached embedding is
   * either used or discarded. This avoids sending the large embedding vector
   * between the backend and the frontend.
   */
  static embeddingCache: Record<string, number[]> = {};

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

  @Fields.json({
    saving(entity, fieldRef) {
      fieldRef.value = fieldRef.value.filter((r: string | null) => r);
    },
  })
  references: string[] = [];

  @Fields.string()
  embeddingModel = "";

  @Fields.json({ includeInApi: false })
  embedding: number[] = [];

  /** Based on embedding data */
  @Fields.number()
  projectedX = 0;

  /** Based on embedding data */
  @Fields.number()
  projectedY = 0;

  @BackendMethod({ allowed: true })
  static async lookupPaperID(identifier: string, includeEmbedding: boolean = false): Promise<Partial<Paper>> {
    const got = (await import("got")).default;
    const resp = await got<any>(
      "https://api.semanticscholar.org/graph/v1/paper/" +
        identifier +
        "?fields=title,citationCount,authors,openAccessPdf,publicationDate,references.paperId,embedding",
        {responseType: "json"}
    );
    if (resp.errored) {
      throw (
        "Request to Semantic Scholar API failed with status " +
        resp.statusCode +
        " " +
        resp.statusMessage
      );
    }
    const info = resp.body;
    const date = info.publicationDate;
    const dateParts = date ? (date as string).split("-").map(Number) : null;
    const sliceName = (name: string) => {
      if (name.includes(" ")) {
        return {
          prefix: name.slice(0, name.lastIndexOf(" ")),
          lastName: name.slice(name.lastIndexOf(" ") + 1),
          suffix: "",
        };
      } else {
        return {
          prefix: "",
          lastName: name,
          suffix: "",
        };
      }
    };

    // saving the embedding here, to be inserted into the database in the
    // entity's saving() callback if the identifier is re-used, instead of
    // sending it to the frontend
    Paper.embeddingCache[identifier] = info.embedding?.vector || [];

    return {
      title: info.title || "",
      citationCount: info.citationCount || 0,
      published: date
        ? new Date(dateParts![0], dateParts![1] - 1)
        : new Date(1990, 0, 1),
      link: info.openAccessPdf?.url || "",
      authors: info.authors
        ? info.authors.map((a: { name: string }) => sliceName(a.name))
        : [],
      semanticScholarID: identifier,
      references: info.references.map((r: any) => r.paperId),
      embeddingModel: info.embedding?.model || "",
      embedding: includeEmbedding ? info.embedding?.vector : undefined
    };
  }

  @BackendMethod({ allowed: true })
  static async getGraph(type: GraphSource) {
    switch (type) {
      case GraphSource.references:
        return referencesGraph;
      case GraphSource.reducedReferences:
        return reducedReferencesGraph;
      case GraphSource.mentions:
        return mentionsGraph;
    }
  }
}

@Entity<Notes>("notes", {
  allowApiCrud: true,
  id: (e) => e.paperID,
  saved(row) {
    if (isBackend()) {
      mentionsGraph[row.paperID] = row.getMentions();
    }
  },
  deleted(row) {
    if (isBackend()) {
      delete mentionsGraph[row.paperID];
    }
  },
})
export class Notes {
  @Fields.string({ validate: Validators.uniqueOnBackend })
  paperID!: string;

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
