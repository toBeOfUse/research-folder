# Research

This is a web app built with Vue, Vite, Typescript, Express, and Remult. Using it, you can can fetch research papers using the Semantic Scholar API and display them in a table. You can also manually create and edit table entries. It can display the research papers as embedded PDFs, and provides a note-taking interface that allows you to "mention" other research papers, linking to them. You can also view the research papers as a graph, with the edges provided by your "mentions" in your notes or the citations between papers. You can also position the papers within the graph according to their textual embeddings, using the SPECTER2 embeddings provided by Semantic Scholar. The embeddings are reduced to two dimensions using TSNE for display.

`yarn install` and `yarn dev` are enough to get this project running, once you have Node.js and yarn.
