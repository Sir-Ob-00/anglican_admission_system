import mongoose from "mongoose";

export default async function connectDB(mongoUri) {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    // eslint-disable-next-line no-console
    console.log("[db] connected");
  });
  mongoose.connection.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[db] error", err);
  });

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
}
