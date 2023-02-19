import { connectToDatabase } from "$lib/db";

export async function get(request) {
  try {
    const year = request.query.get("year");
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("IRObjectives");
    const ir = await collection.find({ year: Number(year) }).toArray();

    return {
      status: 200,
      body: {
        ir,
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
  const irObjective = JSON.parse(request.body);
  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("IRObjectives");

    let t = await collection.insertOne(irObjective);

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
  const irObjective = JSON.parse(request.body);

  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("IRObjectives");

    let t = await collection.updateOne(
      { year: irObjective.year },
      {
        $set: {
          amount: irObjective.amount,
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
