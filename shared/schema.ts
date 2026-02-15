import {
  pgTable,
  text,
  uuid,
  boolean,
  numeric,
  integer,
  serial,
  jsonb,
  timestamp,
  primaryKey,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const appRoleEnum = pgEnum("app_role", ["user", "moderator", "admin"]);

export const catAppUsers = pgTable("cat_app_users", {
  userName: text("user_name").primaryKey(),
  preferences: jsonb("preferences").default(
    sql`'{"sound_enabled": true, "theme_preference": "dark", "preferred_categories": [], "rating_display_preference": "elo", "tournament_size_preference": 8}'::jsonb`
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id"),
  userName: text("user_name"),
  role: appRoleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const catNameOptions = pgTable("cat_name_options", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  avgRating: numeric("avg_rating").default("1500"),
  isActive: boolean("is_active").default(true),
  isHidden: boolean("is_hidden").default(false).notNull(),
  categories: text("categories").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lockedIn: boolean("locked_in").default(false).notNull(),
  status: text("status").default("candidate"),
  provenance: jsonb("provenance"),
});

export const catNameRatings = pgTable(
  "cat_name_ratings",
  {
    userName: text("user_name").notNull(),
    nameId: uuid("name_id")
      .notNull()
      .references(() => catNameOptions.id, { onDelete: "cascade" }),
    rating: numeric("rating").default("1500"),
    wins: integer("wins").default(0),
    losses: integer("losses").default(0),
    isHidden: boolean("is_hidden").default(false),
    ratingHistory: jsonb("rating_history").default(sql`'[]'::jsonb`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userName, table.nameId] })]
);

export const catTournamentSelections = pgTable("cat_tournament_selections", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  nameId: uuid("name_id")
    .notNull()
    .references(() => catNameOptions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tournamentId: text("tournament_id").notNull(),
  selectionType: text("selection_type").default("tournament_setup"),
  selectedAt: timestamp("selected_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tableName: text("table_name").notNull(),
  operation: text("operation").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  userName: text("user_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const catChosenName = pgTable("cat_chosen_name", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  middleNames: jsonb("middle_names"),
  greetingText: text("greeting_text"),
  showBanner: boolean("show_banner").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
