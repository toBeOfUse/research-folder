const TSNE = require("tsne-js");

module.exports = function getEmbeddingProjections(embeddings) {
  let model = new TSNE({
    dim: 2,
    perplexity: 30.0,
    earlyExaggeration: 4.0,
    learningRate: 100.0,
    nIter: 1000,
    metric: "euclidean",
  });
  model.init({ data: embeddings, type: "dense" });
  const [error, iter] = model.run();
  console.log("TSNE finished. error:", error, "iter:", iter);
  return model.getOutputScaled();
}
