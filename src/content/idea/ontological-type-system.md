---
type: "[[Idea]]"
subtype: "[[Instrument]]"
title: "Ontological Type System"
definition: "A personal knowledge method built around six closed root types and a small number of templated subtypes, in which every note is one of those types and nothing is untyped."
aliases: ["OTS", "the system"]
state: Stable
created: 2026-05-08
associations: ["[[knowledge-management]]", "[[obsidian]]"]
---

The Ontological Type System is the personal knowledge method this site is a demonstration of. Six closed root types (*Person*, *Place*, *Work*, *Event*, *Idea*, *Journal*) and a small number of templated subtypes that have their own schemas (Lexeme under Idea, Sermon under Event, Dream under Journal). All other subtypes inherit their parent's schema and exist as a label on the card-catalog block, not as a separate template.

Closure is the point. Every note in the vault is one of the six. There is no general "page" or "miscellaneous" bucket. When something does not seem to fit one of the types, the answer is to look harder at what it actually is, not to add a new top-level category. The discipline of the closure is what produces the structure.

I treat OTS as an *instrument* rather than a *theory*. It is something I use to do work in the world, the way one uses a notebook or a kitchen knife. It does not claim to capture all possible structures of all possible knowledge. It claims to be a usable tool for one kind of person organizing one kind of vault. The subtype on this note is [[Instrument]] for that reason.

What the demonstration is showing you, across the rest of the site, is what a domain looks like when it has been worked through OTS. The corpus here is philosophy of religion, chosen because it exercises every type without strain. The demonstration is not encyclopedic. It is a thinker, not a Wikipedia.

## Six roots, three templated subtypes

The six root types are *Person*, *Place*, *Work*, *Event*, *Idea*, and *Journal*. Three subtypes have their own schemas: *Lexeme* under Idea, *Sermon* under Event, *Dream* under Journal. They are not used in this corpus. Every other subtype here (Theologian, Argument, Treatise, Publication, Reflection, Instrument, and so on) inherits its parent's schema; the subtype is a label, nothing more.

Every note carries the same baseline fields: `type`, an optional `subtype`, a `state` (Seed, Developing, or Stable), a `created` date, and an array of `associations` (wikilinked domain tags). Per-root fields add what the type actually needs.

## The schema

What follows is the exact field set for each root type. The card-catalog block on every note is a literal rendering of these fields.

**Person:** title, alternate_names, birth_date, death_date, nationality, roles, spouses, children, parents.

**Place:** title, aliases, region, country, coordinates.

**Work:** title, parent_work, creator, publication_year.

**Event:** title, date_start, date_end, era, place, participants.

**Idea:** title, definition (one sentence), aliases, key_people.

**Journal:** title, date, author (optional).

## Why this corpus

Philosophy of religion exercises every root type without strain. There are people (theologians, philosophers, atheists, mystics, working academics today). There are places (universities, abbeys, the cities where books were written and burned). There are works (treatises, dialogues, papers). There are events (publication, condemnation, the slow movements of an intellectual culture). There are ideas (arguments and counterarguments, all the way down). And the domain rewards a journal, a personal voice tracking where the arguments land in someone who is taking them seriously.

I picked it because it is a domain I care about and because the arguments interact: the [[Cosmological Argument]] links to [[Thomas Aquinas]] links to the [[Summa Theologiae]] links to [[The Analytic Revival of Philosophy of Religion]] links to [[Alvin Plantinga]] links back through [[Reformed Epistemology]] to [[J. L. Mackie]]. A small graph of well-formed types makes a domain like this navigable in a way a flat list of pages never could.

## A note on the journal entries

The journal entries on this site are written in an unsigned, generic first person and are not tied to a named persona. They are a sample week from one user's vault: seven days in which philosophy of religion turns up the way it actually turns up in a thoughtful layperson's life, at the farmers' market, on a hike, in a phone call with a parent, in a margin scribble at lunch, at book club. The voice is studious without being academic. Belief is held lightly enough that a reader of any persuasion should be able to project into it.

The argument the *Journal* type is making, in OTS, is that the high concepts in a corpus and the texture of an ordinary week share one vault. The schema does not separate them. The narrator does not have epiphanies. They accumulate uncertainty with care.

## Take what works

The schema, the templates, the conventions: take any of it. The whole method is six roots, three templated subtypes, Markdown with wikilinks, and a card-catalog block at the top of each note. Source for this site is on GitHub. The vault method itself is documented in the same repository.
