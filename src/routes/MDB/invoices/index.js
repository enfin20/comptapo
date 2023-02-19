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
    const collection = db.collection("Invoices");
    const invoices = await collection.find(filter).sort({ date: 1 }).toArray();
    for (var i = 0; i < invoices.length; i++) {
      invoices[i].year = Number(invoices[i].date.substring(0, 4));
      invoices[i].month = Number(invoices[i].date.substring(4, 6));
      invoices[i].paymentYear = Number(invoices[i].paymentDate.substring(0, 4));
      invoices[i].paymentMonth = Number(
        invoices[i].paymentDate.substring(4, 6)
      );
    }

    return {
      status: 200,
      body: {
        invoices,
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
  const invoice = JSON.parse(request.body);

  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Invoices");

    let t = await collection.insertOne(invoice);

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
  const invoice = JSON.parse(request.body);

  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("Invoices");

    let t = await collection.updateOne(
      { _id: ObjectId(invoice._id) },
      {
        $set: {
          days: Number(invoice.days),
          dailyRate: Number(invoice.dailyRate),
          paymentDate: invoice.paymentDate,
          paid: Boolean(invoice.paid),
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
    console.info("err", err.message);
    return {
      status: 500,
      body: {
        erreur: err.message,
      },
    };
  }
}
