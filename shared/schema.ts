import { boolean, integer, jsonb, numeric, pgTable, primaryKey, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const catAppUsers = pgTable("cat_app_users", {
	userName: text("user_name").primaryKey(),
	preferences: jsonb("preferences").default({ sound_enabled: true, theme_preference: "dark", preferred_categories: [], rating_display_preference: "elo", tournament_size_preference: 8 }),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id"),
	userName: text("user_name"),
	role: text("role").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const catNameOptions = pgTable("cat_name_options", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	description: text("description").default(""),
	avgRating: numeric("avg_rating").default("1500"),
	isActive: boolean("is_active").default(true),
	isHidden: boolean("is_hidden").default(false).notNull(),
	categories: text("categories").array().default([]),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	lockedIn: boolean("locked_in").default(false),
});

export const catNameRatings = pgTable("cat_name_ratings", {
	userName: text("user_name").notNull(),
	nameId: uuid("name_id").notNull().references(() => catNameOptions.id, { onDelete: "cascade" }),
	rating: numeric("rating").default("1500"),
	wins: integer("wins").default(0),
	losses: integer("losses").default(0),
	isHidden: boolean("is_hidden").default(false),
	ratingHistory: jsonb("rating_history").default([]),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
	return {
		pk: primaryKey({ columns: [table.userName, table.nameId] }),
	};
});

export const catTournamentSelections = pgTable("tournament_selections", {
	id: serial("id").primaryKey(),
	userName: text("user_name").notNull(),
	nameId: uuid("name_id").notNull().references(() => catNameOptions.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	tournamentId: text("tournament_id").notNull(),
	selectionType: text("selection_type").default("tournament_setup"),
	selectedAt: timestamp("selected_at", { withTimezone: true }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
