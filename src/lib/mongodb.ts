import { MongoClient, type MongoClientOptions } from "mongodb";

const options: MongoClientOptions = {
  appName: "imagion.vercel.integration",
  maxIdleTimeMS: 5000,
};

let client: MongoClient | null = null;

export const getMongoClient = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (!client) {
    client = new MongoClient(uri, options);
  }

  return client;
};
