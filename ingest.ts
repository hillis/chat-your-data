import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader, DirectoryLoader, PDFLoader } from "langchain/document_loaders";

const FILENAME = "./data/limits2023.md";
const filePath = 'docs';

export const run = async () => {
  try {
    const loader = new DirectoryLoader(filePath, {
      ".md": (path) => new TextLoader(path),
      ".pdf": (path) => new PDFLoader(path),
    });
    
  
    const rawDocs = await loader.load();
    console.log("Loader created.");
    

    /* Split the text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    
    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log("Docs split.");

    console.log("Creating vector store...");
    /* Create the vectorstore */
    const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
    await vectorStore.save("data");
  }
  catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest documents');
  }
};

(async () => {
  await run();
  console.log("done");
})();
