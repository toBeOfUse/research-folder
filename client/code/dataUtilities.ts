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

export const lookupPaperID = async (
  identifier: string
): Promise<Partial<Paper>> => {
  const resp = await fetch(
    "https://api.semanticscholar.org/graph/v1/paper/" +
      identifier +
      "?fields=title,citationCount,authors,openAccessPdf,publicationDate,references.paperId"
  );
  if (!resp.ok) {
    throw (
      "Request to Semantic Scholar API failed with status " +
      resp.status +
      " " +
      resp.statusText
    );
  }
  const info = await resp.json();
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
  };
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
  return (
    paper.published.toLocaleDateString("en-us", { month: "long" }) +
    " " +
    paper.published.getFullYear()
  );
};
