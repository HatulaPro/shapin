import { type InferModel, pgTable, index } from "drizzle-orm/pg-core";
import {
  timestamp,
  serial,
  text,
  integer,
  pgEnum,
  date,
} from "drizzle-orm/pg-core/columns";

export const images = pgTable("images", {
  date: date("date", { mode: "date" }).notNull().defaultNow().primaryKey(),
  url: text("url").notNull(),
});

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    created_at: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    user_id: text("user_id").notNull(),
    title: text("title").notNull(),
    attempting: date("date", { mode: "date" }).references(() => images.date),
  },
  (posts) => {
    return {
      datePostIndex: index("date_post_idx").on(posts.created_at),
      userPostIndex: index("user_post_idx").on(posts.user_id),
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
    id: serial("id").primaryKey().notNull(),
    post_id: serial("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),
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
      postShapeIndex: index("post_shape_idx").on(shapes.post_id, shapes.id),
    };
  }
);
export type Shape = InferModel<typeof shapes>;
export type ShapeWithoutPostId = Omit<Shape, "post_id">;

export type Post = InferModel<typeof posts>;
export type DailyImage = InferModel<typeof images>;
