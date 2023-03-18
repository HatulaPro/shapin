import { type InferModel, pgTable, uniqueIndex } from "drizzle-orm/pg-core";
import {
  date,
  serial,
  text,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core/columns";

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    created_at: date("created_at", { mode: "date" }),
    user_id: text("user_id"),
  },
  (posts) => {
    return {
      dateIndex: uniqueIndex("date_idx").on(posts.created_at),
      userIndex: uniqueIndex("user_idx").on(posts.user_id),
    };
  }
);

export const shape_typeEnum = pgEnum("shape_type", [
  "SQUARE",
  "TRIANGLE",
  "CIRCLE",
]);
export const colorEnum = pgEnum("color", [
  "#000000",
  "#235789",
  "#c1292e",
  "#f1d302",
  "#56e39f",
  "#e574bc",
  "#ffffff",
]);
export const shapes = pgTable(
  "shapes",
  {
    id: serial("id").primaryKey(),
    post_id: serial("post_id").references(() => posts.id),
    shape_type: shape_typeEnum("shape_type").notNull(),
    left: integer("left").notNull(),
    top: integer("top").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    zIndex: integer("zIndex").notNull(),
    color: colorEnum("color").notNull(),
  },
  (shapes) => {
    return {
      postIndex: uniqueIndex("post_idx").on(shapes.post_id),
    };
  }
);
export type Shape = InferModel<typeof shapes>;
export type ShapeWithoutPostId = Omit<Shape, "post_id">;
