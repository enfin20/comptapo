import { connectToDatabase } from "$lib/db";
import { Double, ObjectId } from "mongodb";

export async function get(request) {
  try {
    const year = request.query.get("year");
    var filter = new Object();
    if (year != null) {
      filter = { year: Number(year) };
    } else {
      filter = {};
    }
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("AnnualExpenses");
    const expenses = await collection.find(filter).sort({ year: 1 }).toArray();
    return {
      status: 200,
      body: {
        expenses,
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
    const collection = db.collection("AnnualExpenses");

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
    const collection = db.collection("AnnualExpenses");

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
