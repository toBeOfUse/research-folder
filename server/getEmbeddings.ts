import { remultExpress } from "remult/remult-express";
import { Paper, TagOrder } from "../data/entities";
import express from "express";
import { exit } from "process";

const app = express();

const sleep = (seconds: number) =>
  new Promise((res) => setTimeout(res, seconds * 1000));

app.use(
  remultExpress({
    entities: [Paper, TagOrder],
    async initApi(remult) {
      const failures: string[] = [];
      const papersRepo = remult.repo(Paper);
      for await (const paper of papersRepo.query()) {
        let done = false;
        while (!done && paper.semanticScholarID) {
          try {
            const info = await Paper.lookupPaperID(paper.semanticScholarID, true);
            if (
              !(
                info.embedding &&
                Array.isArray(info.embedding) &&
                info.embedding.length > 0
              )
            ) {
              throw (
                "got weird embedding data: " + JSON.stringify(info.embedding)
              );
            }
            await papersRepo.update(paper.id, {
              ...paper,
              embedding: info.embedding,
              embeddingModel: info.embeddingModel,
            });
            console.log(
              `got ${info.embedding.length}-element embedding for ${paper.title} (model: ${info.embeddingModel})`
            );
            done = true;
          } catch (e: any) {
            if (e instanceof Error && e.toString().includes("429")) {
              console.log(e);
              console.log("rate limited, waiting");
              await sleep(5); // rate limit guessing.
              // loop continues and retries because done is still false
            } else {
              console.log(
                "could not get embedding for paper",
                paper.title,
                paper.id
              );
              console.log(e);
              failures.push(paper.title);
              done = true;
            }
          }
        }
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
