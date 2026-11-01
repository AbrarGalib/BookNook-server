
import express from "express";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } finally {}
}
run().catch(console.dir);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('BookNook Server is running'));
app.listen(process.env.PORT || 5000, () => console.log("Server running"));