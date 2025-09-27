import Client from "pocketbase";

const POCKETBASE_URL = Bun.env.POCKETBASE_URL || "http://localhost:8090";

export async function createInstance() {
  const pb = new Client(POCKETBASE_URL);

  await pb.collection("_superusers").authWithPassword(
    Bun.env.POCKETBASE_EMAIL || "admin@gmail.com",
    Bun.env.POCKETBASE_PASSWORD || "admin12345"
  );

  return pb
}