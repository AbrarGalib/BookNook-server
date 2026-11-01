
import express from "express";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send({ message: "Unauthorized access" });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send({ message: "Forbidden access" });
    req.user = decoded;
    next();
  });
};

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db("bookNookDB");
    const booksCollection = db.collection("books");

    app.get("/books", async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const books = await booksCollection.find().sort({ createdAt: -1 }).limit(limit).toArray();
      res.send(books);
    });

    app.get("/books/:id", verifyToken, async (req, res) => {
      const book = await booksCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(book);
    });
  } finally {}
}
run().catch(console.dir);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('BookNook Server is running'));
app.listen(process.env.PORT || 5000, () => console.log("Server running"));