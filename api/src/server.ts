import app from "./app.js";
import dotenv from "dotenv"
dotenv.config();
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT
const startServer = async () => {
    try {
        await connectDB()

        app.listen(PORT, () => {
            console.log(`server running in ${PORT}`)
        })
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Server startup failed:", errorMessage);
        process.exit(1);
    }
}

startServer();