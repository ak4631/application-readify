const { Client } = require('pg');
require('dotenv').config();

const libraries = [
  {
    name: 'The Study Hub',
    slug: 'the-study-hub',
    description: 'A quiet, well-lit space for focused study sessions.',
    address_line_1: '12 Rajouri Garden Main Rd',
    locality: 'Rajouri Garden',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110027',
  },
  {
    name: 'Scholars Den',
    slug: 'scholars-den',
    description: 'Popular with exam aspirants for its 24/7 access.',
    address_line_1: '45 GT Karnal Road',
    locality: 'Model Town',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110009',
  },
  {
    name: 'The Intellectuals Hub',
    slug: 'the-intellectuals-hub',
    description: 'Premium reading spaces with dedicated quiet zones.',
    address_line_1: '8 Nehru Place',
    locality: 'Nehru Place',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110019',
  },
  {
    name: 'Arid Reading Library',
    slug: 'arid-reading-library',
    description: 'Community library with a large collection of reference books.',
    address_line_1: '21 Lajpat Nagar',
    locality: 'Lajpat Nagar',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110024',
  },
  {
    name: 'Knowledge Corner',
    slug: 'knowledge-corner',
    description: 'Affordable daily passes with AC and Wi-Fi.',
    address_line_1: '3 Mukherjee Nagar',
    locality: 'Mukherjee Nagar',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110009',
  },
  {
    name: 'Learn & Grow',
    slug: 'learn-and-grow',
    description: 'Group study rooms available for team projects.',
    address_line_1: '17 Dwarka Sector 12',
    locality: 'Dwarka',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110078',
  },
];

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  try {
    for (const lib of libraries) {
      await client.query(
        `INSERT INTO public.libraries
          (name, slug, description, address_line_1, locality, city, state, postal_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO NOTHING`,
        [
          lib.name,
          lib.slug,
          lib.description,
          lib.address_line_1,
          lib.locality,
          lib.city,
          lib.state,
          lib.postal_code,
        ],
      );
    }
    console.log(`Seeded ${libraries.length} libraries (skipping duplicates).`);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
