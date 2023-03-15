import { migrate } from "drizzle-orm/postgres-js/migrator";
import { config } from "dotenv";

// eslint-disable-next-line
config();

const main = async () => {
  await import("./db")
    .then(async ({ db }) => {
      console.log("Migrating...");
      await migrate(db, { migrationsFolder: ".drizzle" });
      console.log("Done!");
      process.exit(0);
    })
    .catch((e) => {
      console.log("Can not migrate: ", e);
    });
};
void main();
