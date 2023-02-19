import { connectToDatabase } from "$lib/db";

export async function get(request) {
  try {
    const group = request.query.get("group");
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Categories");
    const categories = await collection
      .find({ group: group })
      .sort({ rank: 1 })
      .toArray();

    return {
      status: 200,
      body: {
        categories,
      },
    };
  } catch (err) {
    return {
      status: 500,
      body: {
        erreur: err.message,
      },
    };
  }
}
