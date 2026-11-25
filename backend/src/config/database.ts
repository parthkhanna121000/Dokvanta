import mongoose from "mongoose";
import { logger } from "../utils/logger";

export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  logger.info(
    { host: conn.connection.host, db: conn.connection.name },
    "MongoDB connected",
  );
  return conn;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
