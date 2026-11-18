import mongoose, { type Mongoose } from "mongoose";

type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
  _mongooseListenersAttached?: boolean;
};

const cache: MongooseCache = (globalWithMongoose._mongooseCache ??= {
  conn: null,
  promise: null,
});

function resetCache(): void {
  cache.conn = null;
  cache.promise = null;
}

if (!globalWithMongoose._mongooseListenersAttached) {
  mongoose.connection.on("disconnected", resetCache);
  globalWithMongoose._mongooseListenersAttached = true;
}

export async function connectDB(): Promise<Mongoose> {
  const { readyState } = mongoose.connection;

  if (readyState === 1) {
    cache.conn = mongoose;
    return mongoose;
  }

  if (readyState === 2) {
    if (cache.promise) {
      cache.conn = await cache.promise;
    } else {
      await mongoose.connection.asPromise();
      cache.conn = mongoose;
    }

    return cache.conn;
  }

  resetCache();

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI no está definida");
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((error: unknown) => {
        resetCache();
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
