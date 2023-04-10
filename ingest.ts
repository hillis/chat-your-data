import { PineconeStore } from "langchain/vectorstores";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from "@/config/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader, DirectoryLoader } from "langchain/document_loaders";
import { CustomPDFLoader } from "scripts/customPDFLoader";

const FILENAME = "./data/limits2023.md";
const filePath = 'docs';



export const run = async () => {
  try {
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      ".pdf": (path) => new CustomPDFLoader(path),
      ".md": (path) => new TextLoader(path),
    });

    // const loader = new PDFLoader(filePath);
    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    async function initPinecone() {
      try {
        const pinecone = new PineconeClient();

        await pinecone.init({
          environment: process.env.PINECONE_ENVIRONMENT ?? "", //this is in the dashboard
          apiKey: process.env.PINECONE_API_KEY ?? "",
        });

        return pinecone;
      } catch (error) {
        console.log("error", error);
        throw new Error("Failed to initialize Pinecone Client");
      }
    }
    const pinecone = await initPinecone();

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

    //embed the PDF documents
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();
