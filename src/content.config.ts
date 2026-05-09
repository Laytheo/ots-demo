import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const wikilink = z.string();
const wikilinks = z.array(wikilink);

const baseFields = {
  type: wikilink,
  subtype: wikilink.optional(),
  state: z.enum(["Seed", "Developing", "Stable"]),
  created: z.coerce.date(),
  associations: wikilinks.default([]),
};

const person = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/person" }),
  schema: z.object({
    ...baseFields,
    title: z.string(),
    alternate_names: z.array(z.string()).optional(),
    birth_date: z.string().optional(),
    death_date: z.string().optional(),
    nationality: z.string().optional(),
    roles: z.array(z.string()).optional(),
    spouses: wikilinks.optional(),
    children: wikilinks.optional(),
    parents: wikilinks.optional(),
  }),
});

const place = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/place" }),
  schema: z.object({
    ...baseFields,
    title: z.string(),
    aliases: z.array(z.string()).optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.string().optional(),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/work" }),
  schema: z.object({
    ...baseFields,
    title: z.string(),
    parent_work: wikilink.optional(),
    creator: wikilinks.optional(),
    publication_year: z.union([z.number(), z.string()]).optional(),
  }),
});

const event = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/event" }),
  schema: z.object({
    ...baseFields,
    title: z.string(),
    date_start: z.string().optional(),
    date_end: z.string().optional(),
    era: z.string().optional(),
    place: wikilink.optional(),
    participants: wikilinks.optional(),
  }),
});

const idea = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/idea" }),
  schema: z.object({
    ...baseFields,
    title: z.string(),
    definition: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    key_people: wikilinks.optional(),
  }),
});

const journal = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/journal" }),
  schema: z.object({
    ...baseFields,
    title: z.string(),
    date: z.string().optional(),
    author: z.string().optional(),
  }),
});

export const collections = { person, place, work, event, idea, journal };
