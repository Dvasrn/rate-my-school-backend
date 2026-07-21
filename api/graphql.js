import "dotenv/config";
import { yoga } from "../src/yoga.js";

// Vercel serverless function — graphql-yoga нь Node-ийн (req, res) handler-тэй нийцдэг.
// MONGODB_URI-г Vercel Project Settings > Environment Variables дээр тохируулна.
export default yoga;
