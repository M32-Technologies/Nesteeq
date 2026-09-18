import { connectAuthDB, getAuthDB, getAuthMongoClient } from "../config/auth-db.js"

async function cleanBase64Avatars() {
  try {
    await connectAuthDB()
    const db = getAuthDB()
    const userCollection = db.collection("user")

    const users = await userCollection.find({}).toArray()
    let cleanedCount = 0

    for (const user of users) {
      if (typeof user.image === "string" && user.image.startsWith("data:")) {
        console.log(`Found base64 avatar on user: ${user.email || user._id}, length: ${user.image.length} chars. Cleaning...`)
        await userCollection.updateOne(
          { _id: user._id },
          { $set: { image: null } }
        )
        cleanedCount++
      }
    }

    console.log(`Cleaned ${cleanedCount} user(s) with base64 avatars.`)
  } catch (err) {
    console.error("Failed to clean base64 avatars:", err)
  } finally {
    const client = getAuthMongoClient()
    await client.close()
    process.exit(0)
  }
}

cleanBase64Avatars()
