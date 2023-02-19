import { connectToDatabase } from "$lib/db";
import { Double, ObjectId } from "mongodb";

export async function get(request) {
  try {
    const start = request.query.get("start");
    const end = request.query.get("end");
    var filter = new Object();
    if (start != null) {
      filter = {
        $and: [{ date: { $gte: start } }, { date: { $lte: end } }],
      };
    } else {
      filter = {};
    }
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Openfield");
    const openfield = await collection.find(filter).sort({ date: 1 }).toArray();
    for (var i = 0; i < openfield.length; i++) {
      openfield[i].year = Number(openfield[i].date.substring(0, 4));
      openfield[i].month = Number(openfield[i].date.substring(4, 6));
    }

    return {
      status: 200,
      body: {
        openfield,
      },
    };
  } catch (err) {
    console.info("err", err.message);
    return {
      status: 500,
      body: {
        erreur: err.message,
      },
    };
  }
}

export async function post(request) {
  const expense = JSON.parse(request.body);

  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Openfield");

    let t = await collection.insertOne(expense);

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
  const expense = JSON.parse(request.body);

  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Openfield");

    let t = await collection.updateOne(
      { _id: ObjectId(expense._id) },
      {
        $set: {
          amount: expense.amount,
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
