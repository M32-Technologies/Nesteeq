import { env } from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = env.port;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred";

    console.error("Server startup failed:", errorMessage);
    process.exit(1);
  }
};

startServer();
