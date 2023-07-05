import { cwd } from "process";

import { createServer } from "vite";
import express from "express";
import multer from "multer";
import got from "got";
import { CookieJar } from "tough-cookie";

import { remultExpress } from "remult/remult-express";
import { Paper, TagOrder } from "../data/entities";

const db = remultExpress({
  entities: [Paper, TagOrder],
});

// start vite
(async () => {
  const viteServer = await createServer({
    configFile: "./vite.config.js",
    root: cwd(),
    server: { middlewareMode: true },
  });
  const app = express();
  app.use(db);
  // proxying ACM PDFs requires us to support redirects that set cookies
  const cookieJar = new CookieJar();
  app.get("/paper", async (req, res) => {
    // silly proxy to serve papers that can't be embedded in iframes while
    // ignoring cross-origin policies
    const url = (req.query as any).url;
    const paper = await got(url, {
      responseType: "buffer",
      headers: {
        "User-Agent": req.header("user-agent")!,
        Accept: "application/pdf",
      },
      cookieJar,
    });
    // only proxy if a normal iframe isn't allowed, so that cookies function
    // normally as often as possible
    if (!paper.headers["x-frame-options"]) {
      res.redirect(url);
    } else {
      console.log("proxying request for document " + url);
      console.log("redirects", paper.redirectUrls);
      res.header("content-type", paper.headers["content-type"] || "");
      const data = paper.body;
      res.send(data);
    }
  });
  app.post(
    "/newimage",
    multer({ dest: "./public/uploads/" }).single("image"),
    (req, res) => {
      if (req.file) {
        res.contentType("text/plain");
        res.send("/uploads/" + req.file.filename);
      } else {
        res.sendStatus(500);
      }
    }
  );
  app.use(viteServer.middlewares);
  app.listen(3000, () => {
    console.log("listening at http://localhost:3000");
  });
})();
