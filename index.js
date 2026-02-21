require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");

const typeDefs = require("./schemas");     
const resolvers = require("./resolvers");  

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(" MongoDB connected");

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

        let user = null;
        if (token) {
          try {
            user = jwt.verify(token, process.env.JWT_SECRET);
          } catch {
            user = null;
          }
        }
        return { user };
      }
    })
  );

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(` http://localhost:${PORT}/graphql`));
}

start().catch((err) => {
  console.error("Server failed:", err);
});