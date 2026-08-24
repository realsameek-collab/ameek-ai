import { QdrantVectorStore } from "@langchain/qdrant";
import {embeddings} from "./embedding.js"
import dotenv from "dotenv"
dotenv.config()
export const vectorStore = async(docs,collectionName)=>{
       // fromDocuments creates and fills the collection. fromExistingCollection
       // takes (embeddings, args) and expects the collection to already exist,
       // so it can never index a freshly uploaded pdf.
       return await QdrantVectorStore.fromDocuments(docs,embeddings, {
         url: process.env.QDRANT_URL,
         apiKey: process.env.QDRANT_API_KEY,
         collectionName
});
}