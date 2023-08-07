import express from "express";
import path from "path";
import Piscina from "piscina";
import { remultExpress } from "remult/remult-express";
import { Paper } from "../data/entities";
import { exit } from "process";
import { writeFileSync } from "fs";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";
import ChartTrendline from "chartjs-plugin-trendline";

const tsneWorker = new Piscina({
  filename: path.resolve(__dirname, "tsneWorker.js"),
});

const randRange = (min: number, max: number) =>
  min + Math.random() * (max - min);

const app = express();
app.use(
  remultExpress({
    entities: [Paper],
    async initApi(remult) {
      const papers = (await remult.repo(Paper).find()).filter(
        (p) => p.embedding?.length
      );
      const results: any[] = [];
      const promises: Promise<void>[] = [];
      let finished = 0;
      for (let i = 0; i < 1000; ++i) {
        const params = {
          dim: 2,
          perplexity: randRange(2, 100),
          earlyExaggeration: randRange(1, 20),
          learningRate: randRange(25, 1000),
          nIter: randRange(200, 2000),
          metric: "euclidean",
        };
        promises.push(
          tsneWorker
            .run([papers.map((p) => p.embedding), params])
            .then(([_, error, iter]) => {
              results.push({ error, iter, ...params });
              console.log(++finished, "tests finished");
            })
        );
      }
      await Promise.all(promises);

      results.sort((a, b) => a.error - b.error);

      writeFileSync("tsneResults.json", JSON.stringify(results, null, 4), {
        encoding: "utf-8",
      });

      const errors = results.map((r) => r.error);

      const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width: 1000,
        height: 500,
        backgroundColour: "white",
      });
      const variables = [
        "perplexity",
        "earlyExaggeration",
        "learningRate",
        "nIter",
      ];
      const data: ChartConfiguration[] = variables.map((param) => ({
        data: {
          datasets: [
            {
              data: errors.map((e, i) => ({ x: results[i][param], y: e })),
              pointBackgroundColor: "red",
              trendlineLinear: {
                style: "rgba(255,105,180, .8)",
                lineStyle: "solid",
                width: 2,
              },
            },
          ],
        },
        type: "scatter" as const,
        options: {
          plugins: {
            title: { text: param + " vs. error" },
            legend: { display: false },
          },
        },
        plugins: [ChartTrendline],
      }));
      data.push(
        ...variables.map((v) => ({
          type: "scatter" as const,
          options: {
            plugins: {
              title: { text: v + " vs. iterations" },
              legend: { display: false },
            },
          },
          plugins: [ChartTrendline],
          data: {
            datasets: [
              {
                data: errors.map((e, i) => ({
                  x: results[i][v],
                  y: results[i].iter,
                })),
                pointBackgroundColor: "blue",
                trendlineLinear: {
                  style: "rgba(180,105,255, .8)",
                  lineStyle: "solid" as const,
                  width: 2,
                },
              },
            ],
          },
        }))
      );
      for (const chart of data) {
        const image = await chartJSNodeCanvas.renderToBuffer(chart);
        writeFileSync(
          "./charts/" + chart.options!.plugins!.title!.text + ".png",
          image
        );
      }
      exit();
    },
  })
);
app.listen(3001);
