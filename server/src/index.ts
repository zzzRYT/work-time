import { initSentry } from "./sentry.js";
initSentry();

import http from "http";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { ApolloServer, HeaderMap } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { typeDefs } from "./schema/index.js";
import { resolvers } from "./resolvers/index.js";
import { createContext } from "./context.js";

const app = express();
const httpServer = http.createServer(app);
const port = Number(process.env.PORT) || 4000;

// CORS
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:8081",
];
app.use(cors({ origin: allowedOrigins }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 1000, // 요청 제한
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

// GraphQL endpoint
app.use("/graphql", express.json({ limit: "50mb" }), (req, res) => {
  const headers = new HeaderMap();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  server
    .executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: req.method!.toUpperCase(),
        headers,
        search: new URL(req.url, `http://localhost:${port}`).search ?? "",
        body: req.body,
      },
      context: async () => createContext(),
    })
    .then(async (httpGraphQLResponse) => {
      for (const [key, value] of httpGraphQLResponse.headers) {
        res.setHeader(key, value);
      }
      res.statusCode = httpGraphQLResponse.status || 200;
      if (httpGraphQLResponse.body.kind === "complete") {
        res.end(httpGraphQLResponse.body.string);
        return;
      }
      for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
        res.write(chunk);
      }
      res.end();
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});

httpServer.listen(port, () => {
  console.log(`Server ready at http://localhost:${port}/graphql`);
  console.log(`Health check at http://localhost:${port}/health`);
});
