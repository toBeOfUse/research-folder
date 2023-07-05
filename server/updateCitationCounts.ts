import { remultExpress } from "remult/remult-express";
import { Paper, TagOrder } from "../data/entities";
import { lookupPaperID, searchPapers } from "../client/code/dataUtilities";
import express from "express";
import { exit } from "process";

const app = express();

const sleep = (seconds: number) =>
  new Promise((res) => setTimeout(res, seconds * 1000));

app.use(
  remultExpress({
    entities: [Paper, TagOrder],
    async initApi(remult) {
      const approx: [string, string][] = [];
      const failures: string[] = [];
      const papersRepo = remult.repo(Paper);
      for (const paper of await papersRepo.find()) {
        let done = false;
        while (!done) {
          try {
            let id = paper.semanticScholarID;
            if (!paper.semanticScholarID) {
              id = await searchPapers(paper.title);
            }
            const data = await lookupPaperID(id);
            if (data.citationCount !== undefined) {
              if (paper.title.toLowerCase() != data.title?.toLowerCase()) {
                approx.push([paper.title, data.title || ""]);
              }
              console.log(
                "found",
                data.citationCount,
                "citations for",
                data.title
              );
              await papersRepo.update(paper.id, {
                ...paper,
                citationCount: data.citationCount,
                citationsUpdated: new Date(),
                semanticScholarID: id,
              });
              done = true;
            }
          } catch (e: any) {
            if (e.toString().includes("429")) {
              console.log("rate limited, waiting");
              await sleep(5); // rate limit guessing.
              // loop continues and retries because done is still false
            } else {
              console.log("could not get paper for title", paper.title);
              console.log(e);
              failures.push(paper.title);
              done = true;
            }
          }
        }
      }
      console.log("approx matches (check these):");
      for (const [paper, data] of approx) {
        console.log(paper + "\n" + data + "\n");
      }
      console.log("could not get data for:");
      for (const paper of failures) {
        console.log(paper + "\n");
      }
      console.log("done");
      exit();
    },
  })
);

app.listen(3001);
