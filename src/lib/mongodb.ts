import { MongoClient } from "mongodb";

const options = {
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
    client = new MongoClient(uri, options as any);
  }

  return client;
};
