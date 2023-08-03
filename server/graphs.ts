// these objects map outgoing references from papers to other papers. the keys
// are IDs of papers from the local database. the values are arrays of paper IDs
// from the local database.

import { remult } from "remult";
import { Paper } from "../data/entities";

export type RecordGraph = Record<string, string[]>;

export const mentionsGraph: RecordGraph = {};
export const referencesGraph: RecordGraph = {};
export const reducedReferencesGraph: RecordGraph = {};

function depthFirstSearch(
  nodeID: string,
  graph: RecordGraph,
  process: (nodeID: string) => void
) {
  process(nodeID);
  for (const child of graph[nodeID]) {
    depthFirstSearch(child, graph, process);
  }
}

export async function makeReferenceGraph() {
  const S2IDsToPaperIDs: Record<string, string> = {};
  const dates: Record<string, Date> = {};
  const indexLookup: Record<string, number> = {};
  const papers = await remult.repo(Paper).find();
  for (let i = 0; i < papers.length; ++i) {
    const paper = papers[i];
    referencesGraph[paper.id] = paper.references || [];
    dates[paper.id] = paper.published;
    if (paper.semanticScholarID) {
      S2IDsToPaperIDs[paper.semanticScholarID] = paper.id;
    }
    indexLookup[paper.id] = i;
  }
  for (const id in referencesGraph) {
    referencesGraph[id] = referencesGraph[id]
      .filter(
        (i) =>
          S2IDsToPaperIDs[i] &&
          dates[id].getTime() > dates[S2IDsToPaperIDs[i]].getTime()
      )
      .map((i) => S2IDsToPaperIDs[i]);
  }

  // compute the transitive reduction, where there is only one path between any
  // two connected nodes; i.e. there are the least number of edges possible
  // while preserving the reachability relation

  // step 1: find the matrix for the transitive closure, which has tc[i][j] ==
  // true if node j is reachable from node i
  const transitiveClosure: boolean[][] = [];
  for (let i = 0; i < papers.length; ++i) {
    transitiveClosure.push(Array(papers.length).fill(false));
  }
  for (let i = 0; i < papers.length; ++i) {
    depthFirstSearch(papers[i].id, referencesGraph, (nodeID) => {
      transitiveClosure[i][indexLookup[nodeID]] = i != indexLookup[nodeID];
    });
  }

  // step 2: remove links to obtain the transitive reduction.
  // this is algorithm A1 from https://dl.acm.org/doi/pdf/10.1145/321864.321866
  const transitiveReduction = transitiveClosure.map((bools) => [...bools]);
  for (let j = 0; j < papers.length; ++j) {
    for (let i = 0; i < papers.length; ++i) {
      if (transitiveReduction[i][j]) {
        for (let k = 0; k < papers.length; ++k) {
          if (transitiveReduction[j][k]) {
            transitiveReduction[i][k] = false;
          }
        }
      }
    }
  }

  // turn adjacency matrix back into object
  for (let i = 0; i < papers.length; ++i) {
    reducedReferencesGraph[papers[i].id] = [];
    for (let j = 0; j < papers.length; ++j) {
      if (transitiveReduction[i][j] && i != j) {
        console.log(papers[i].title, "links to", papers[j].title);
        reducedReferencesGraph[papers[i].id].push(papers[j].id);
      }
    }
  }
}
