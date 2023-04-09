import { cwd } from "process";

import { createServer } from "vite";
import fastifyCreate from "fastify";

import { remultFastify } from "remult/remult-fastify";
import { Paper } from "../data/entities";

const db = remultFastify({
  entities: [Paper],
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
        published: new Date(1972, 6, 1), // July 1972 (months are 0-indexed)
        summary: "Inconsistent senders make consensus very difficult.",
        link: "https://lamport.azurewebsites.net/pubs/byz.pdf",
        read: true,
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
      proxy: { "/api": "http://localhost:3001" },
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
    await fastify.listen({ port: 3001 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
