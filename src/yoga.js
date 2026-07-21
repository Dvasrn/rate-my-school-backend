import { createSchema, createYoga } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvers } from "./resolvers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(join(__dirname, "..", "schema.graphql"), "utf8");

export const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/graphql",
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
  },
});
