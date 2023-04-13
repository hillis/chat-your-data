// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { makeChain } from "./util";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body = req.body;
  const dir = path.resolve(process.cwd(), "data");

  const vectorstore = await HNSWLib.load(dir, new OpenAIEmbeddings());
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const sendData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  sendData(JSON.stringify({ data: "" }));
  const chain = makeChain(vectorstore, (token: string) => {
    sendData(JSON.stringify({ data: token }));
  });

  try {
    await chain.call({
      question: body.question,
      chat_history: body.history,
    });
  } catch (err) {
    console.error(err);
    // Ignore error
  } finally {
    sendData("[DONE]");
    res.end();
  }
}
