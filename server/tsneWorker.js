const TSNE = require("tsne-js");

module.exports = function getEmbeddingProjections([embeddings, options = {
  dim: 2,
  perplexity: 75,
  earlyExaggeration: 4.0,
  learningRate: 50,
  nIter: 400,
  metric: "euclidean",
}]) {
  const model = new TSNE(options);
  model.init({ data: embeddings, type: "dense" });
  let minError = 10;
  let finalIter = -1;
  let output = null;
  for (let i = 0; i < 5; ++i) {
    const [error, iter] = model.run();
    if (error < minError) {
      minError = error;
      finalIter = iter;
      output = model.getOutputScaled();
    }
  }
  console.log("TSNE finished. error:", minError, "iter:", finalIter);
  return [output, minError, finalIter];
}
