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
    const collection = db.collection("Salaries");
    const salaries = await collection.find(filter).sort({ date: 1 }).toArray();
    for (var i = 0; i < salaries.length; i++) {
      salaries[i].year = Number(salaries[i].date.substring(0, 4));
      salaries[i].month = Number(salaries[i].date.substring(4, 6));
    }
    return {
      status: 200,
      body: {
        salaries,
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
  const salary = JSON.parse(request.body);

  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Salaries");

    let t = await collection.insertOne(salary);

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
  const salary = JSON.parse(request.body);

  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Salaries");

    let t = await collection.updateOne(
      { _id: ObjectId(salary._id) },
      {
        $set: {
          amount: salary.amount,
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
