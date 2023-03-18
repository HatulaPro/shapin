import { createTRPCRouter } from "~/server/api/trpc";
import { drawingsRouter } from "~/server/api/routers/drawings";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  drawings: drawingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
