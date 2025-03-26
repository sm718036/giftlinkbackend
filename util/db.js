// db.js
const MongoClient = require('mongodb').MongoClient;

let url = `${process.env.MONGO_URL}`;

const client = new MongoClient(url);
const dbInstance = null

async function connectToDatabase() {
   try {
    if (dbInstance) return dbInstance;
    await client.connect()
    console.log("MongoDB connected");
    return client.db('giftdb');
   } catch (error) {
    console.log("Error connecting to MongoDB", error);
   } 
}

module.exports = connectToDatabase;