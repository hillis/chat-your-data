import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader, DirectoryLoader, PDFLoader, GithubRepoLoader } from "langchain/document_loaders";

const FILENAME = "./data/limits2023.md";


export const run = async () => {
  const loader = new GithubRepoLoader(
  "https://github.com/hillis/gpt-4-chat-ui",
    { branch: "main", recursive: false, unknown: "warn" });
  
  const rawDocs = await loader.load();
  console.log("Loader created.");
  /* Split the text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await textSplitter.splitDocuments(rawDocs);
  console.log("Docs splitted.");

  console.log("Creating vector store...");
  /* Create the vectorstore */
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  await vectorStore.save("data");
};

(async () => {
  await run();
  console.log("done");
})();
