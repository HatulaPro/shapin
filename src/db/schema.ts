import { pgTable } from "drizzle-orm/pg-core";
import { date, text } from "drizzle-orm/pg-core/columns";

export const todays = pgTable("todays", {
  date: date("date", { mode: "date" }),
  url: text("url"),
});
