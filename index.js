import express from "express";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());


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
    const borrowsCollection = db.collection("borrows");


    app.get("/books", async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const books = await booksCollection.find().sort({ createdAt: -1 }).limit(limit).toArray();
      res.send(books);
    });

    app.get("/books/:id", verifyToken, async (req, res) => {
      const book = await booksCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(book);
    });

    app.post("/books", verifyToken, async (req, res) => {
      const newBook = { ...req.body, createdAt: new Date() };
      const result = await booksCollection.insertOne(newBook);
      res.send(result);
    });

    app.patch("/books/:id", verifyToken, async (req, res) => {
      const { _id, ...updatedData } = req.body;
      const result = await booksCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: updatedData });
      res.send(result);
    });

    app.delete("/books/:id", verifyToken, async (req, res) => {
      const result = await booksCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    app.post("/borrows", verifyToken, async (req, res) => {
      const { bookId, userEmail, bookTitle, bookImage, borrowDate, returnDate } = req.body;
      const existing = await borrowsCollection.findOne({ bookId, userEmail });
      if (existing) return res.status(400).send({ message: "Already borrowed." });

      const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
      if (!book || book.totalCopies <= 0) return res.status(400).send({ message: "Out of stock." });

      const result = await borrowsCollection.insertOne(req.body);
      await booksCollection.updateOne({ _id: new ObjectId(bookId) }, { $inc: { totalCopies: -1 } });
      res.send(result);
    });

    app.get("/borrows", verifyToken, async (req, res) => {
      if (req.user.email !== req.query.email) return res.status(403).send({ message: "Forbidden" });
      const borrows = await borrowsCollection.find({ userEmail: req.query.email }).toArray();
      res.send(borrows);
    });

    app.delete("/borrows/:id", verifyToken, async (req, res) => {
      const record = await borrowsCollection.findOne({ _id: new ObjectId(req.params.id) });
      if (!record) return res.status(404).send({ message: "Not found" });
      
      const result = await borrowsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      await booksCollection.updateOne({ _id: new ObjectId(record.bookId) }, { $inc: { totalCopies: 1 } });
      res.send(result);
    });
  } finally {}
}
run().catch(console.dir);

app.get('/', (req, res) => res.send('BookNook Server is running'));
app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));