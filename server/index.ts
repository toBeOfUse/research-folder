import { createServer } from "vite";
import fastifyCreate from "fastify";
import vue from "@vitejs/plugin-vue";
import { cwd } from "process";

// start vite
(async () => {
  const viteServer = await createServer({
    configFile: "./vite.config.js",
    root: cwd(),
    server: {
      port: 3000,
    },
  });
  await viteServer.listen();
  viteServer.printUrls();
})();

// Require the framework and instantiate it
const fastify = fastifyCreate({ logger: true });

// Declare a route
fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3001 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
