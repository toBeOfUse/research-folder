import { AuthorName, Paper } from "../../data/entities";

export const searchPapers = async (keywords: string): Promise<string> => {
  const resp = await fetch(
    "https://api.semanticscholar.org/graph/v1/paper/search" +
      "?limit=1&query=" +
      // simple regex-based tokenization bc the search api doesn't respond well
      // to some characters, like "-"
      keywords.replace(/\W+/g, "+")
  );
  if (!resp.ok) {
    throw (
      "Request to Semantic Scholar Paper Search failed with status " +
      resp.status +
      " " +
      resp.statusText
    );
  }
  const info = await resp.json();
  if (!info?.data?.length) {
    throw (
      'Search term(s) "' + keywords + '" yielded no results on Semantic Scholar'
    );
  }
  return info.data[0].paperId;
};

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

export const getPublicationDate = (paper: Paper) => {
  // necessary if the paper has been loaded from JSON recently...
  const published = new Date(paper.published);
  return (
    published.toLocaleDateString("en-us", { month: "long" }) +
    " " +
    published.getFullYear()
  );
};
