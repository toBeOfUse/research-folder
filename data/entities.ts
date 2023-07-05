import { Entity, Fields } from "remult";

export interface AuthorName {
  // first name and maybe middle name or initial; not always displayed
  prefix: string;
  // last name, displayed always
  lastName: string;
  // Jr., Sr., etc
  suffix: string;
}

@Entity("papers", { allowApiCrud: true })
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

  @Fields.string()
  notes = "";

  @Fields.dateOnly()
  published = new Date(1990, 0, 1);

  @Fields.string()
  semanticScholarID = "";

  @Fields.number()
  citationCount = 0;

  @Fields.date()
  citationsUpdated? = new Date();
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
