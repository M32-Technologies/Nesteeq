import cookieParser from "cookie-parser"
import express from "express"
const app = express()


app.use(cookieParser());
app.use(express.json())

export default app