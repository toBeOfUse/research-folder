import { cwd } from "process";

import { createServer } from "vite";
import fastifyCreate from "fastify";

import { remultFastify } from "remult/remult-fastify";
import { Paper } from "../data/entities";

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
    await fastify.register(
      remultFastify({
        entities: [Paper],
      })
    );
    await fastify.listen({ port: 3001 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
