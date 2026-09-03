import "dotenv/config";

import { connectDB } from "./config/db.js";
import { connectAuthDB } from "./config/auth-db.js";
import { env } from "./config/env.js";

const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        await connectAuthDB();

        const { default: app } = await import("./app.js");

        app.listen(env.port, () => {
            console.log(`Server running on port ${env.port}`);
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
