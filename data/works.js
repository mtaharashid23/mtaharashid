// Work data for the case overlay and the archive slot. The list markup in
// index.html is static (SEO, no-JS); this is the richer layer on top.
export const WORKS = [
  {
    slug: 'female-imperative', title: 'The Female Imperative', client: 'Shane Stewart & TL Dayen', type: 'Author website', year: '2026',
    url: 'https://the-female-imperative.netlify.app/', role: 'Design and development', pages: 6,
    stack: ['HTML', 'CSS', 'JavaScript', 'Three.js', 'GSAP', 'Lenis'],
    blurb: 'A manifesto site built around a real-time Three.js sculpture: copper, glass transmission and a drift of particles that answers the cursor. Serif-led typography on a wine-dark ground, with the book, the authors and a blog behind it.',
  },
  {
    slug: 'eclipse-neilson', title: 'Eclipse Neilson', client: 'Eclipse Neilson, screenwriter', type: 'Author website', year: '2026',
    url: 'https://eclipseneilson.com/', role: 'Redesign, bug fixes, development', pages: 7,
    stack: ['HTML', 'CSS', 'JavaScript', 'GSAP', 'Lenis', 'Swiper'],
    blurb: 'An eclipse that rises as the page loads, a screenplay library with its own cinematic card system, and a redesign that repaired the responsive layout and the sliders of the original build.',
  },
  {
    slug: 'andrew-minuto', title: 'Andrew J. Minuto', client: 'Andrew James Minuto, memoirist', type: 'Author website and journal', year: '2026',
    url: 'https://andrewjminuto.com/', role: 'Design, development, static build system', pages: 14,
    stack: ['HTML', 'CSS', 'JavaScript', 'Three.js', 'GSAP', 'Lenis', 'Python'],
    blurb: 'Fourteen pages generated from one Python build: condensed display type in black and red, a journal, speaking and media sections, and a share-your-story page for a memoir about what comes after survival.',
  },
  {
    slug: 'shirley-grispi', title: 'A Few Regrets', client: 'Shirley Mae Grispi, memoirist', type: 'Memoir microsite', year: '2026',
    url: '', role: 'Design and development', pages: 4,
    stack: ['HTML', 'CSS', 'JavaScript', 'GSAP', 'Lenis', 'Three.js'],
    blurb: 'Bone paper, a two-tone serif at poster scale, and a scroll that reads like turning the first pages of the book. Built from the publisher questionnaire and the manuscript itself.',
  },
  {
    slug: 'principal-playbook', title: 'Principal Playbook', client: 'Dr. Michael Bishop', type: 'Program site, LMS and CMS prototype', year: '2026',
    url: 'https://theprincipalplaybook.com/', role: 'Product design, frontend, clickable prototypes', pages: 15,
    stack: ['HTML', 'CSS', 'JavaScript', 'GSAP', 'Lenis', 'Three.js'],
    blurb: 'A year-long leadership program for new principals: the marketing site, a clickable learning platform (lessons, library, certificates, coaching) and a content admin, delivered as one coherent prototype.',
  },
  {
    slug: 'rehome-with-heart', title: 'Rehome With Heart', client: 'Cindy Fuerst', type: 'Author site and print-on-demand store', year: '2026',
    url: 'https://rehomewithheart.com/', role: 'Design, frontend, PHP API, checkout', pages: 11,
    stack: ['HTML', 'CSS', 'JavaScript', 'GSAP', 'Lenis', 'Three.js', 'PHP', 'Lulu Print API'],
    blurb: 'Front to back: the story of rehoming a pug, a practical guide to open adoption, and a working checkout that sends print orders to Lulu through a PHP API with a catalog, order capture, health checks and cron.',
  },
  {
    slug: 'kassandra', title: 'Kassandra Clymens-Russo', client: 'Kassandra Clymens-Russo, cozy fantasy author', type: 'Author website', year: '2026',
    url: 'https://kassandra-clymens-russo.netlify.app/', role: 'Revamp, design and development', pages: 11,
    stack: ['HTML', 'CSS', 'JavaScript', 'GSAP', 'Lenis', 'Swiper'],
    blurb: 'Parchment, lanterns and an arch-framed portrait for twenty-one books of tiny heroes: characters, store, events, press and FAQ, revamped in the spirit of a cozy picture-book studio.',
  },
  {
    slug: 'stevemc', title: 'Steve McAlphabet', client: 'Steve McAllister, author and performer', type: 'Artist website', year: '2026',
    url: 'https://stevemc.xyz/', role: 'Redesign and development', pages: 9,
    stack: ['HTML', 'CSS', 'JavaScript', 'GSAP', 'Lenis', 'Three.js'],
    blurb: 'Motorcycling music across America: books, music, poetry, voice and performances for a man who does a lot of stuff, set in Bricolage Grotesque at road-sign scale.',
  },
  // archive
  { slug: 'william-sargent', title: 'William Sargent', client: 'William Sargent, Vermont forester', type: 'Author website', year: '2026', url: 'https://www.williamsargentvt.com/', role: 'Design and development', pages: 8, stack: ['HTML', 'CSS', 'GSAP', 'Lenis', 'Three.js'], blurb: 'Fifty years in the Vermont woods: a photographic site for a forester and memoirist, with books, gallery, reviews and a blog.', archive: true },
  { slug: 'gold-coin', title: 'The Gold Coin', client: 'Robert Brensike', type: 'Children\'s book site', year: '2026', url: '', role: 'Design and development', pages: 6, stack: ['HTML', 'CSS', 'GSAP', 'Lenis', 'Swiper'], blurb: 'A fairy tale about a boy, a forest and a fortune worth more than gold, with a coin that catches the light as you scroll.', archive: true },
  { slug: 'gale-reardon', title: 'Gale Reardon, RN', client: 'Gale Reardon, RN, CCM', type: 'Author and speaker site', year: '2026', url: 'https://www.galereardon.com/', role: 'Design, development, static build', pages: 14, stack: ['HTML', 'CSS', 'GSAP', 'Lenis', 'Python'], blurb: 'A nurse, advocate and author: the children\'s book, a journal, speaking and reviews, generated from a Python build.', archive: true },
  { slug: 'sam-webster', title: 'Sam Webster', client: 'Sam Webster, Concrescent Press', type: 'Author and press catalogue', year: '2026', url: 'https://sam-webster.netlify.app/', role: 'Design and development', pages: 74, stack: ['HTML', 'CSS', 'GSAP', 'Lenis', 'Three.js'], blurb: 'Seventy-four pages for a mage, priest and publisher: authors, books and the foundation, with sacred geometry drawn in WebGL.', archive: true },
  { slug: 'ritchie-kemp', title: 'Ritchie Kemp', client: 'Ritchie Kemp, novelist', type: 'Novelist website', year: '2026', url: '', role: 'Design and development', pages: 6, stack: ['HTML', 'CSS', 'GSAP', 'Lenis', 'Swiper', 'Three.js'], blurb: 'Stories that keep their secrets: four novels fanned like a hand of cards, a newsletter and a store.', archive: true },
  { slug: 'stephanie-hill', title: 'Healing Tears', client: 'Stephanie Hill', type: 'Author website', year: '2026', url: 'https://stephaniehill.netlify.app/', role: 'Animation and interaction', pages: 9, stack: ['HTML', 'CSS', 'GSAP', 'Lenis'], blurb: 'Motion work on an existing memoir site: a starfield hero, book reveal and section choreography.', archive: true },
];

export const bySlug = (slug) => WORKS.find((w) => w.slug === slug);
export const FEATURED = WORKS.filter((w) => !w.archive);
