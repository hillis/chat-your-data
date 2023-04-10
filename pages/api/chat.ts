// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { HNSWLib, PineconeStore } from "langchain/vectorstores";
import { pinecone } from "@/utils/pinecone-client";
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from "@/config/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { makeChain } from "./util";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {question, history} = req.body;
  const dir = path.resolve(process.cwd(), "data");

  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll("\n", " ");

  const index = pinecone.Index(PINECONE_INDEX_NAME);

  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({}),
    {
      pineconeIndex: index,
      textKey: "text",
      namespace: PINECONE_NAME_SPACE,
    }
  );
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    // Important to set no-transform to avoid compression, which will delay
    // writing response chunks to the client.
    // See https://github.com/vercel/next.js/issues/9965
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const sendData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  sendData(JSON.stringify({ data: "" }));

  //Create Chain
  const chain = makeChain(vectorStore, (token: string) => {
    sendData(JSON.stringify({ data: token }));
  });

  try {
    //Ask Question
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });
    sendData(JSON.stringify({ sourceDocs: response.sourceDocuments }));
  } catch (error) {
    console.error("error", error);
    // Ignore error
  } finally {
    sendData("[DONE]");
    res.end();
  }
}
