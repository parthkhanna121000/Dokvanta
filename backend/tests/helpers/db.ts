import { MongoMemoryServer } from "mongodb-memory-server";
// All database access goes through src/, so tests use the same mongoose instance as the app and its models.
// (This repo also has a second install under src/node_modules. Importing "mongoose" directly in a test can
// resolve to a different copy, whose connection the models never use, so every query would hang.)
import { connectDatabase, disconnectDatabase } from "../../src/config/database";

let server: MongoMemoryServer | undefined;
let db: Awaited<ReturnType<typeof connectDatabase>> | undefined;

/**
 * Optional: run the DB tests against a real local MongoDB instead of mongodb-memory-server.
 * The tests delete every document in the database, so only a database whose name
 * ends in "_test" is accepted.
 */
function externalTestUri(): string | undefined {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri) return undefined;
  const dbName = new URL(uri).pathname.replace(/^\//, "");
  if (!/_test$/.test(dbName)) {
    throw new Error("TEST_MONGODB_URI must name a database ending in _test (tests delete all data in it)");
  }
  return uri;
}

/** Starts an in-memory MongoDB. Tests never connect to a real database. */
export async function startTestDb(): Promise<void> {
  const externalUri = externalTestUri();
  // launchTimeout is generous: the first start on Windows can be slow (antivirus scan, firewall prompt).
  server = externalUri
    ? undefined
    : await MongoMemoryServer.create({ instance: { launchTimeout: 120000 } });
  const uri = externalUri ?? server?.getUri("dokvanta_v2_test");
  if (!uri) throw new Error("No test database URI available");

  const connected = await connectDatabase(uri);
  db = connected;
  const names = connected.modelNames();
  if (names.length === 0) {
    throw new Error("No models are registered on the app's mongoose instance. Import the models before startTestDb().");
  }
  // Make sure unique indexes exist before any test relies on them.
  await Promise.all(names.map((name) => connected.model(name).init()));
}

export async function clearTestDb(): Promise<void> {
  if (!db) throw new Error("startTestDb() has not run");
  for (const collection of Object.values(db.connection.collections)) {
    await collection.deleteMany({});
  }
}

export async function stopTestDb(): Promise<void> {
  await disconnectDatabase();
  await server?.stop();
}