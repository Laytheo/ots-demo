# OTS Demo

A working demonstration of the Ontological Type System (OTS), a personal knowledge method built on six closed root types.

The methodology itself lives at [Laytheo/laytheo-instruments](https://github.com/Laytheo/laytheo-instruments/tree/main/methods/ontological-type-system). The philosophical case for the system is the essay at [laytheo.com/instruments/ontological-type-system](https://laytheo.com/instruments/ontological-type-system). This repo is the specimen: a small static site seeded with a corpus on the arguments for and against the existence of God, a domain dense enough to exercise every root type.

The slogan is "show, don't tell." Every page is a real OTS note with real frontmatter and real wikilinks. The schema is the layout, made visible.

## The corpus

Around thirty notes spanning the six root types: Person (theologians and philosophers), Place (institutions and locations), Work (treatises and dialogues), Event (publications and movements), Idea (arguments and concepts), Journal (a fictional graduate student's reflections across one academic year).

The journal entries are the heart of the demo. Margaret Halloran is a second-year PhD student in philosophy of religion. Her arc traces evidentialist confidence, into reformed epistemology, hiddenness, the evidential problem of evil, and finally a quieter uncertainty. The persona is fictional and disclosed as such on the About page.

## Stack

- Astro 6 with content collections and MDX
- Tailwind CSS 4
- React islands for the two graph visualizations
- react-force-graph-2d for the force-directed graphs
- Pure static build, deployed to Vercel

## Local development

Requires Node 22.12 or newer.

```sh
npm install
npm run dev      # localhost:4321
npm run build    # production build to ./dist/
npm run preview  # preview the production build
```
