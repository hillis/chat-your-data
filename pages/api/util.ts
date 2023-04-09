import { OpenAIChat, BaseLLM } from "langchain/llms";
import { Document } from "langchain/document";
import { LLMChain, VectorDBQAChain, StuffDocumentsChain, loadQAChain, ChatVectorDBQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores";
import { ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts";
import { LLMChainInput } from "langchain/dist/chains/llm_chain";
import { CallbackManager } from "langchain/callbacks";
import { ChainValues } from "langchain/schema";
import { ChatOpenAI } from "langchain/chat_models";
import { HumanChatMessage } from "langchain/schema";



//PromptTemplate is a template that can be used to generate a prompt

const QA_PROMPT = PromptTemplate.fromTemplate(`{question}`);

const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const CHAT_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
  `You are an AI assistant that knows about sports from Alabama High School Athletic Association and AHSAA.  AHSAA stands for Alabama High School Atheltic Association.  AHSAA covers 6th - 12th grade sports for Public and Private schools in Alabama. Anything you are not able to answer say I do not know.
You are given the following data from each School sport from the AHSAA.  The data has the Rules, Procedures and team Polices.  The context is between two '========='. Provide conversational answers in Markdown syntax with links formatted as hyperlinks.
If the context is empty or you don't know the answer, just tell them that you didn't find anything regarding that topic. Don't try to make up an answer.  
If the question is not about AHSAA sports, rules or team Polices, politely inform them that you are tuned to only answer questions about the AHSAA Sports content.   
=========
{context}
=========` ),
  HumanMessagePromptTemplate.fromTemplate("{question}"),
]);

/* 
const SYSTEM_MESSAGE = PromptTemplate.fromTemplate(
  `You are an AI assistant that knows about sports from Alabama High School Athletic Association and AHSAA.  AHSAA stands for Alabama High School Atheltic Association.  AHSAA covers 6th - 12th grade sports for Public and Private schools in Alabama. Anything you are not able to answer say I do not know.
You are given the following data from each School sport from the AHSAA.  The data has the Rules, Procedures and team Polices.  The context is between two '========='. Provide conversational answers in Markdown syntax with links formatted as hyperlinks.
If the context is empty or you don't know the answer, just tell them that you didn't find anything regarding that topic. Don't try to make up an answer.  
If the question is not about AHSAA sports, rules or team Polices, politely inform them that you are tuned to only answer questions about the AHSAA Sports content.   
=========
{context}
=========`
); */
  //
//  Saved Version for FHA Loan Data
//(
//  `You are an AI assistant for the FHA Home Loans. Anything you are not able to answer refer the user to Hometown Lenders, Inc.
//You are given the following data with state and county FHA Loan information.  The context is between two '========='. Provide conversational answers in Markdown syntax with links formatted as hyperlinks.
//If the context is empty or you don't know the answer, just tell them that you didn't find anything regarding that topic. Don't try to make up an answer.  
//If the question is not about the FHA Loans, Hometown Lenders, Matthew Hillis or has nothing to do with Mortgages, politely inform them that you are tuned to only answer questions about the FHA Loan Limits content.  888-606-8066 is not a valid phone number for Hometown Lenders.
//Hometown Lenders can not do business or loans in the following states: Georgia.  If the user asks about these states, inform them that Hometown Lenders does not do business in these states.
//Give the user the name Hometown Lenders, Inc. so they can get ask specific questions from a Licensed Loan Officer.  Hometown Lenders contact information website https://www.htlenders.com/ as a reference with phone number 256-828-8883 and email contact@htlenders.com.  
//=========
//{context}
//=========`
//);



// VectorDBQAChain is a chain that uses a vector store to find the most similar document to the question
// and then uses a documents chain to combine all the documents into a single string
// and then uses a LLMChain to generate the answer
// Before: Based on the chat history make singular question -> find related docs from the question -> combine docs and insert them as context -> generate answer
// After: Find related docs from the question -> combine docs and insert them into predefined system message -> pass in the chat history -> generate answer


/* //Exporting OpenAIChatLLMChain to be used in the custom qa chain
export class OpenAIChatLLMChain extends LLMChain implements LLMChainInput {
  async _call(values: ChainValues): Promise<ChainValues> {
    let stop;
    if ("stop" in values && Array.isArray(values.stop)) {
      stop = values.stop;
    }
    const { chat_history } = values;
    const prefixMessages = chat_history.map((message: string[]) => {
      return [
        {
          role: "user",
          content: message[0]
        },
        {
          role: "assistant",
          content: message[1]
        }
      ]
    }).flat();

    const formattedSystemMessage = await SYSTEM_MESSAGE.format({ context: values.context })
    // @ts-ignore
    this.llm.prefixMessages = [
      {
        role: "system",
        content: formattedSystemMessage
      },
      {
        role: "assistant",
        content: "Hi, I'm an AI assistant for Alabama High School Sports. How can I help you?"
      },
      ...prefixMessages];
    const formattedString = await this.prompt.format(values);
    const llmResult = await this.llm.call(formattedString, stop);
    const result = { [this.outputKey]: llmResult };
    return result;
  }
}


//Class to pass in the chat history to the LLMChain
class ChatStuffDocumentsChain extends StuffDocumentsChain {
  async _call(values: ChainValues): Promise<ChainValues> {
    if (!(this.inputKey in values)) {
      throw new Error(`Document key ${this.inputKey} not found.`);
    }
    const { [this.inputKey]: docs, ...rest } = values;
    const texts = (docs as Document[]).map(({ pageContent }) => pageContent);
    const text = texts.join("\n\n");
    const result = await this.llmChain.call({
      ...rest,
      [this.documentVariableName]: text,
    });
    return result;
  }
}

class OpenAIChatVectorDBQAChain extends VectorDBQAChain {
  async _call(values: ChainValues): Promise<ChainValues> {
    if (!(this.inputKey in values)) {
      throw new Error(`Question key ${this.inputKey} not found.`);
    }
    const question: string = values[this.inputKey];
    const docs = await this.vectorstore.similaritySearch(question, this.k);
    
    // all of this just to pass chat history to the LLMChain
    const inputs = { question, input_documents: docs, chat_history: values.chat_history };
    const result = await this.combineDocumentsChain.call(inputs);
    return result;
  }
}

interface qaParams {
  prompt?: PromptTemplate
}

// use this custom qa chain instead of the default one
const loadQAChain = (llm: BaseLLM, params: qaParams = {}) => {
  const { prompt = QA_PROMPT } = params;
  const llmChain = new OpenAIChatLLMChain({ prompt, llm });
  const chain = new ChatStuffDocumentsChain({ llmChain });
  return chain;
}
 */

export const makeChain = (
  vectorstore: HNSWLib,
  onTokenStream?: (token: string) => void
) => {

  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });
  
  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0,
      // maxTokens: 100,
      // modelName: 'gpt-4',  //Comment out ModelName to use the default model GPT-3.5-Turbo
      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
            async handleLLMNewToken(token) {
              onTokenStream(token);
              // console.log(token);
            },
          })
        : undefined,
    }),
    { prompt: CHAT_PROMPT }
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 1, // number of source documents to return
    
  });
}
