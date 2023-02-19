import { connectToDatabase } from "$lib/db";

export async function get(request) {
  try {
    const year = request.query.get("year");
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("CAObjectives");
    const ca = await collection.find({ year: Number(year) }).toArray();

    return {
      status: 200,
      body: {
        ca,
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
  // intégration d'une nouvelle category
  const caObjective = JSON.parse(request.body);
  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("CAObjectives");

    let t = await collection.insertOne(caObjective);

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
  const caObjective = JSON.parse(request.body);

  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("CAObjectives");

    let t = await collection.updateOne(
      { year: caObjective.year },
      {
        $set: {
          amount: caObjective.amount,
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
