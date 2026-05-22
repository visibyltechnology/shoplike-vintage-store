import express, { type Express, type Request, type Response, type NextFunction } from "express";
  import cors from "cors";
  import pinoHttp from "pino-http";
  import router from "./routes";
  import { logger } from "./lib/logger";

  const app: Express = express();

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
        },
        res(res) {
          return { statusCode: res.statusCode };
        },
      },
    }),
  );
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", router);

  // Global error handler — always returns JSON, never HTML
  app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
    logger.error(err);
    const status: number =
      typeof err.status === "number" ? err.status :
      typeof err.statusCode === "number" ? err.statusCode : 500;
    res.status(status).json({ error: err.message ?? "Internal server error" });
  });

  export default app;
  