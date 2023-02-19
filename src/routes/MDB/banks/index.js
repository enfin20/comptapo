import { connectToDatabase } from "$lib/db";
import { Double, ObjectId } from "mongodb";

export async function get(request) {
  try {
    const group = request.query.get("group");
    var filter = new Object();
    if (group === "all") {
      filter = { group: { $in: ["Openfield", "Perso"] } };
    } else {
      filter = { group: group };
    }
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Banks");
    const banks = await collection.find(filter).toArray();

    return {
      status: 200,
      body: {
        banks,
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

export async function post(request) {
  const bank = JSON.parse(request.body);
  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Banks");

    let t = await collection.insertOne(bank);

    return {
      status: 200,
      body: {
        insertedId: t.insertedId.toString(),
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

export async function put(request) {
  const bank = JSON.parse(request.body);
  console.info("bank", bank);

  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Banks");

    let t = await collection.updateOne(
      { _id: ObjectId(bank._id) },
      {
        $set: {
          amount: Number(bank.amount),
        },
      }
    );
    return {
      status: 200,
      body: {
        message: "Success",
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
