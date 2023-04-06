# **Chat your Data**

Chat your Data is an application built using Next.js, React, and OpenAI. This project allows users to communicate with an AI-based chatbot that provides relevant answers to users' queries. The application uses natural language processing (NLP) technology to understand users' queries and provide accurate responses.

## **Installation**

Before installing Chat your Data, ensure that Node.js is installed on your system. After installing Node.js, follow the steps below to install the application:

1. Clone the project repository from GitHub.
2. Navigate to the project directory using a terminal or command prompt.
3. Run **`yarn install`** to install the project dependencies.
4. Create a **`.env`** file in the project root directory and configure the environment variables as required.


First, create a new `.env` file from `.env.example` and add your OpenAI API key found [here](https://platform.openai.com/account/api-keys).

```bash
cp .env.example .env
```

## **Known Issues**

Need to keep LangChain version 0.0.22.  Anything higher has refactored code and breaks.  Working on Refactoring for ChatModel

### **Data Ingestion**

Data ingestion happens in two steps.

First, you should download the book / source and format it into something readable and converted it into `md` format.  Add that source to the project folder and update `FILENAME` in `ingest.ts` to match the filename.

Next, install dependencies and run the ingestion script:

```bash
yarn && yarn ingest
```

This will parse the data, split text, create embeddings, store them in a vectorstore, and
then save it to the `data/` directory.

We save it to a directory because we only want to run the (expensive) data ingestion process once.

The Next.js server relies on the presence of the `data/` directory. Please
make sure to run this before moving on to the next step.

## **Usage**

To start the Chat your Data application, run the following command in the terminal:

```

yarn dev

```

Once the application is started, you can access it by navigating to **`http://localhost:3000`** in your web browser.

## **Scripts**

The following scripts are available in the project:

- **`dev`**: Start the development server.
- **`build`**: Build the production-ready application.
- **`start`**: Start the production-ready application.
- **`lint`**: Lint the project files using ESLint.
- **`download`**: Download data required for the chatbot to function.
- **`ingest`**: Ingest the downloaded data into the chatbot.

## **Dependencies**

The following dependencies are required to run the Hometown Chatbot application:

- **`@emotion/react`**
- **`@emotion/styled`**
- **`@microsoft/fetch-event-source`**
- **`@mui/material`**
- **`dotenv`**
- **`hnswlib-node`**
- **`langchain`**
- **`next`**
- **`openai`**
- **`react`**
- **`react-dom`**
- **`react-markdown`**
- **`remark-gfm`**
- **`sharp`**
- **`ws`**

The following devDependencies are required for development purposes:

- **`@types/adm-zip`**
- **`@types/node`**
- **`@types/react`**
- **`@types/react-dom`**
- **`@types/ws`**
- **`cohere-ai`**
- **`ts-node`**
- **`tsx`**
- **`typescript`**

## **Contributing**

Contributions to Chat your Data are welcome. If you find any bugs or issues, please raise them on the project's GitHub repository. You can also contribute to the project by submitting pull requests.

## **License**

Hometown Chatbot is open-source software licensed under the **[MIT license](https://opensource.org/licenses/MIT)**.

## **Deploying the server**

Depolyed to Vercel

## **Inspirations**

This repo borrows heavily from

- [ChatLangChain](https://github.com/hwchase17/chat-langchain) - for the backend and data ingestion logic
- [LangChain Chat NextJS](https://github.com/zahidkhawaja/langchain-chat-nextjs) - for the frontend.
- [Chat Langchainjs](https://github.com/sullivan-sean/chat-langchainjs) - Backend and Data ingestion

## **How To Run on Your Example**

If you'd like to chat your own data, you need to:

1. Set up your own ingestion pipeline, and create a similar `data/` directory with a vectorstore in it.
2. Change the prompt used in `pages/api/util.ts` - right now this tells the chatbot to only respond to questions about LangChain, so in order to get it to work on your data you'll need to update it accordingly.

The server should work just the same 😄
