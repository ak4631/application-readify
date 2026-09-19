const { Client } = require('pg');
require('dotenv').config();

const entries = [
  {
    name: 'Quiet Corner Reading Room',
    slug: 'quiet-corner-reading-room',
    category: 'reading_room',
    description: 'A silent reading room with individual booths, ideal for deep focus.',
    address_line_1: '9 Karol Bagh Ansari Road',
    locality: 'Karol Bagh',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110005',
  },
  {
    name: 'Sunrise Reading Room',
    slug: 'sunrise-reading-room',
    category: 'reading_room',
    description: 'Early-opening reading room popular with morning study groups.',
    address_line_1: '2 Vikaspuri District Centre',
    locality: 'Vikaspuri',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110018',
  },
  {
    name: 'The Brew & Books Cafe',
    slug: 'the-brew-and-books-cafe',
    category: 'study_cafe',
    description: 'Coffee-shop vibe with fast Wi-Fi and unlimited refills for long sessions.',
    address_line_1: '56 Hauz Khas Village',
    locality: 'Hauz Khas',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110016',
  },
  {
    name: 'Pageturner Study Cafe',
    slug: 'pageturner-study-cafe',
    category: 'study_cafe',
    description: 'Cozy cafe seating with charging points at every table.',
    address_line_1: '14 Satya Niketan',
    locality: 'Satya Niketan',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110021',
  },
  {
    name: 'UPSC Prep Exam Hub',
    slug: 'upsc-prep-exam-hub',
    category: 'exam_hub',
    description: 'Dedicated hub for competitive exam aspirants with mock-test halls.',
    address_line_1: '31 Old Rajinder Nagar',
    locality: 'Old Rajinder Nagar',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110060',
  },
  {
    name: 'Bank & SSC Exam Hub',
    slug: 'bank-and-ssc-exam-hub',
    category: 'exam_hub',
    description: 'Focused prep space for banking and SSC exam candidates.',
    address_line_1: '5 Laxmi Nagar District Centre',
    locality: 'Laxmi Nagar',
    city: 'Delhi',
    state: 'Delhi',
    postal_code: '110092',
  },
];

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  try {
    for (const entry of entries) {
      await client.query(
        `INSERT INTO public.libraries
          (name, slug, category, description, address_line_1, locality, city, state, postal_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (slug) DO NOTHING`,
        [
          entry.name,
          entry.slug,
          entry.category,
          entry.description,
          entry.address_line_1,
          entry.locality,
          entry.city,
          entry.state,
          entry.postal_code,
        ],
      );
    }
    console.log(`Seeded ${entries.length} entries across reading rooms / study cafes / exam hubs.`);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
