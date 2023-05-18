import { cwd } from "process";

import { createServer } from "vite";
import fastifyCreate from "fastify";
import axios from "axios";

import { remultFastify } from "remult/remult-fastify";
import { Paper, TagOrder } from "../data/entities";

const db = remultFastify({
  entities: [Paper, TagOrder],
  async initApi(remult) {
    const papersRepo = remult.repo(Paper);
    if ((await papersRepo.find()).length == 0) {
      papersRepo.insert({
        title: "The Byzantine Generals Problem",
        authors: [
          { prefix: "Leslie", lastName: "Lamport", suffix: "" },
          { prefix: "Robert", lastName: "Shostak", suffix: "" },
          { prefix: "Marshall", lastName: "Pease", suffix: "" },
        ],
        tags: ["fundamentals", "BFT", "Algorithms"],
        notes: "",
        published: new Date(1982, 6, 1), // July 1982 (months are 0-indexed)
        summary: "Inconsistent senders make consensus very difficult.",
        link: "https://lamport.azurewebsites.net/pubs/byz.pdf",
        read: true,
        doi: "10.1145/357172.357176",
        citationCount: 3537,
        citationsUpdated: new Date(2023, 3, 15),
      });
    }
  },
});

// start vite
(async () => {
  const viteServer = await createServer({
    configFile: "./vite.config.js",
    root: cwd(),
    server: {
      port: 3000,
      proxy: {
        "/api": "http://localhost:3001",
        "/paper": "http://localhost:3001",
      },
    },
  });
  await viteServer.listen();
  viteServer.printUrls();
})();

// start fastify
const fastify = fastifyCreate({ logger: true });
(async () => {
  try {
    await fastify.register(db);
    fastify.get("/paper", async (req, res) => {
      // silly proxy to serve papers that can't be embedded in iframes while
      // ignoring cross-origin policies
      const url = (req.query as any).url;
      const paper = await axios.get(url, {
        responseType: "arraybuffer",
        headers: { Accept: "application/pdf" },
      });
      // only proxy if a normal iframe isn't allowed, so that cookies function
      // normally as often as possible
      if (!paper.headers["x-frame-options"]) {
        res.redirect(url);
      } else {
        console.log("proxying request for document " + url);
        res.header("content-type", paper.headers["content-type"]);
        res.send(paper.data);
      }
    });
    await fastify.listen({ port: 3001 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
