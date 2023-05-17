import { AuthorName } from "../../data/entities";

export const cleanAuthors = (authors: AuthorName[]) => {
  for (let i = 0; i < authors.length; ++i) {
    if (!authors[i].lastName || authors[i].lastName.trim().length < 0) {
      authors.splice(i, 1);
      --i;
      continue;
    }
    authors[i].prefix = authors[i].prefix.trim();
    authors[i].lastName = authors[i].lastName.trim();
    authors[i].suffix = authors[i].suffix.trim();
  }
  return authors;
};

// move tag filtering/cleaning code here?
