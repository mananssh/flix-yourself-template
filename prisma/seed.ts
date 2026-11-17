/**
 * Database seed for Flix Yourself.
 *
 * Populates a small but realistic catalog — genres, people, movies, series with
 * episodes, and collections — so the browse page and API have something to show
 * out of the box. Safe to re-run: it clears the catalog tables first, so the
 * result is deterministic.
 *
 * Run with:  npm run db:seed   (or `prisma db seed`)
 *
 * This file is self-contained (it builds its own Prisma Client via the pg driver
 * adapter) so it can be executed directly by Node's native TypeScript support
 * without a separate compile step. It intentionally avoids path aliases and TS
 * `enum` declarations for that reason; the Prisma-generated enum objects are used
 * as runtime values instead.
 */

import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import {
  ImageType,
  MediaType,
  PersonRole,
  PrismaClient,
} from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

/* -------------------------------------------------------------------------- */
/*                              Placeholder assets                             */
/* -------------------------------------------------------------------------- */

const POSTER_W = 400
const POSTER_H = 600
const BACKDROP_W = 1280
const BACKDROP_H = 720

/** Deterministic placeholder poster/backdrop URLs keyed by a stable slug. */
function posterUrl(slug: string): string {
  return `https://picsum.photos/seed/${slug}-poster/${POSTER_W}/${POSTER_H}`
}
function backdropUrl(slug: string): string {
  return `https://picsum.photos/seed/${slug}-backdrop/${BACKDROP_W}/${BACKDROP_H}`
}

const MIN_PER_HOUR = 60
const SEC_PER_MIN = 60
function minutes(n: number): number {
  return n * SEC_PER_MIN
}
function hoursMinutes(h: number, m: number): number {
  return (h * MIN_PER_HOUR + m) * SEC_PER_MIN
}

/* -------------------------------------------------------------------------- */
/*                               Seed definitions                             */
/* -------------------------------------------------------------------------- */

const GENRES = ['Action', 'Drama', 'Comedy', 'Documentary'] as const
type GenreName = (typeof GENRES)[number]

const PEOPLE = [
  { name: 'Ava Monroe' },
  { name: 'Diego Reyes' },
  { name: 'Lena Park' },
  { name: 'Marcus Hale' },
  { name: 'Sofia Grant' },
  { name: 'Daniel Okafor' },
] as const
type PersonName = (typeof PEOPLE)[number]['name']

interface CastMember {
  name: PersonName
  role: PersonRole
}

interface MovieSeed {
  slug: string
  title: string
  description: string
  releaseYear: number
  durationSec: number
  maturityRating: string
  genres: GenreName[]
  cast: CastMember[]
}

interface EpisodeSeed {
  title: string
  description: string
  episodeNumber: number
  durationSec: number
  releaseYear: number
}

interface SeriesSeed {
  slug: string
  title: string
  description: string
  releaseYear: number
  maturityRating: string
  genres: GenreName[]
  cast: CastMember[]
  episodes: EpisodeSeed[]
}

const MOVIES: MovieSeed[] = [
  {
    slug: 'neon-horizon',
    title: 'Neon Horizon',
    description:
      'A courier races across a rain-soaked megacity to deliver a package that could topple its rulers.',
    releaseYear: 2021,
    durationSec: hoursMinutes(1, 52),
    maturityRating: 'PG-13',
    genres: ['Action'],
    cast: [
      { name: 'Ava Monroe', role: PersonRole.ACTOR },
      { name: 'Diego Reyes', role: PersonRole.ACTOR },
      { name: 'Sofia Grant', role: PersonRole.DIRECTOR },
    ],
  },
  {
    slug: 'the-last-signal',
    title: 'The Last Signal',
    description:
      'A retired radio operator picks up a transmission that forces her to confront a decades-old secret.',
    releaseYear: 2019,
    durationSec: hoursMinutes(2, 8),
    maturityRating: 'R',
    genres: ['Drama'],
    cast: [
      { name: 'Lena Park', role: PersonRole.ACTOR },
      { name: 'Daniel Okafor', role: PersonRole.DIRECTOR },
    ],
  },
  {
    slug: 'paper-moons',
    title: 'Paper Moons',
    description:
      'Two rival wedding planners are forced to share a tiny office — and, eventually, a client from hell.',
    releaseYear: 2022,
    durationSec: hoursMinutes(1, 38),
    maturityRating: 'PG-13',
    genres: ['Comedy', 'Drama'],
    cast: [
      { name: 'Ava Monroe', role: PersonRole.ACTOR },
      { name: 'Marcus Hale', role: PersonRole.ACTOR },
    ],
  },
  {
    slug: 'deep-blue-planet',
    title: 'Deep Blue Planet',
    description:
      'A sweeping look at the creatures of the midnight zone, filmed three kilometres below the waves.',
    releaseYear: 2020,
    durationSec: hoursMinutes(1, 29),
    maturityRating: 'G',
    genres: ['Documentary'],
    cast: [{ name: 'Daniel Okafor', role: PersonRole.DIRECTOR }],
  },
  {
    slug: 'midnight-circuit',
    title: 'Midnight Circuit',
    description:
      'A street-racing prodigy is pulled into one last job by the crew that raised her.',
    releaseYear: 2023,
    durationSec: hoursMinutes(2, 1),
    maturityRating: 'PG-13',
    genres: ['Action', 'Drama'],
    cast: [
      { name: 'Diego Reyes', role: PersonRole.ACTOR },
      { name: 'Lena Park', role: PersonRole.ACTOR },
      { name: 'Sofia Grant', role: PersonRole.DIRECTOR },
    ],
  },
  {
    slug: 'letters-to-no-one',
    title: 'Letters to No One',
    description:
      'Over one long winter, a grieving novelist writes to a stranger who may not exist.',
    releaseYear: 2018,
    durationSec: hoursMinutes(1, 47),
    maturityRating: 'PG-13',
    genres: ['Drama'],
    cast: [
      { name: 'Lena Park', role: PersonRole.ACTOR },
      { name: 'Marcus Hale', role: PersonRole.ACTOR },
    ],
  },
  {
    slug: 'office-hours',
    title: 'Office Hours',
    description:
      'A burnt-out professor and an over-eager TA accidentally start the campus’s most popular podcast.',
    releaseYear: 2021,
    durationSec: hoursMinutes(1, 34),
    maturityRating: 'PG',
    genres: ['Comedy'],
    cast: [
      { name: 'Marcus Hale', role: PersonRole.ACTOR },
      { name: 'Ava Monroe', role: PersonRole.ACTOR },
    ],
  },
]

const SERIES: SeriesSeed[] = [
  {
    slug: 'parallel',
    title: 'Parallel',
    description:
      'A physicist discovers her lab can glimpse other versions of her life — each one a little more dangerous.',
    releaseYear: 2022,
    maturityRating: 'TV-MA',
    genres: ['Drama', 'Action'],
    cast: [
      { name: 'Ava Monroe', role: PersonRole.ACTOR },
      { name: 'Daniel Okafor', role: PersonRole.CREATOR },
    ],
    episodes: [
      {
        title: 'Observer Effect',
        description: 'Mira sees herself on the other side of the glass.',
        episodeNumber: 1,
        durationSec: minutes(48),
        releaseYear: 2022,
      },
      {
        title: 'Entanglement',
        description: 'Two timelines begin to bleed into one another.',
        episodeNumber: 2,
        durationSec: minutes(51),
        releaseYear: 2022,
      },
      {
        title: 'Collapse',
        description: 'Mira must choose which version of her life survives.',
        episodeNumber: 3,
        durationSec: minutes(55),
        releaseYear: 2022,
      },
    ],
  },
  {
    slug: 'the-commons',
    title: 'The Commons',
    description:
      'The residents of a shared apartment block navigate feuds, romances, and one very contested laundry room.',
    releaseYear: 2020,
    maturityRating: 'TV-14',
    genres: ['Comedy'],
    cast: [
      { name: 'Marcus Hale', role: PersonRole.ACTOR },
      { name: 'Lena Park', role: PersonRole.ACTOR },
      { name: 'Sofia Grant', role: PersonRole.CREATOR },
    ],
    episodes: [
      {
        title: 'Move-In Day',
        description: 'Nobody reads the house rules. It goes about as well as expected.',
        episodeNumber: 1,
        durationSec: minutes(27),
        releaseYear: 2020,
      },
      {
        title: 'The Thermostat Wars',
        description: 'A cold snap turns neighbours into diplomats.',
        episodeNumber: 2,
        durationSec: minutes(25),
        releaseYear: 2020,
      },
      {
        title: 'Potluck',
        description: 'Everyone brings the same dish. Chaos is served.',
        episodeNumber: 3,
        durationSec: minutes(29),
        releaseYear: 2020,
      },
    ],
  },
  {
    slug: 'wild-earth',
    title: 'Wild Earth',
    description:
      'An immersive documentary series tracing the hidden journeys animals take across a single continent.',
    releaseYear: 2019,
    maturityRating: 'TV-G',
    genres: ['Documentary'],
    cast: [{ name: 'Daniel Okafor', role: PersonRole.CREATOR }],
    episodes: [
      {
        title: 'The Great Thaw',
        description: 'Spring unlocks a frozen valley and everything within it wakes.',
        episodeNumber: 1,
        durationSec: minutes(44),
        releaseYear: 2019,
      },
      {
        title: 'Night Shift',
        description: 'When the sun sets, a different cast takes the stage.',
        episodeNumber: 2,
        durationSec: minutes(46),
        releaseYear: 2019,
      },
    ],
  },
]

/** Collections, referencing media by slug. Order within a list is preserved. */
const COLLECTIONS: Array<{
  name: string
  description: string
  mediaSlugs: string[]
}> = [
  {
    name: 'Staff Picks',
    description: 'A handful of favourites from the team.',
    mediaSlugs: ['neon-horizon', 'the-last-signal', 'parallel', 'office-hours'],
  },
  {
    name: 'New Releases',
    description: 'The latest additions to the library.',
    mediaSlugs: ['midnight-circuit', 'paper-moons', 'parallel'],
  },
]

/* -------------------------------------------------------------------------- */
/*                                   Seeding                                   */
/* -------------------------------------------------------------------------- */

/** Standard image + a single sample video for a media/episode, by slug. */
function mediaImagesCreate(slug: string) {
  return [
    {
      type: ImageType.POSTER,
      storagePath: `images/posters/${slug}.jpg`,
      url: posterUrl(slug),
      width: POSTER_W,
      height: POSTER_H,
    },
    {
      type: ImageType.BACKDROP,
      storagePath: `images/backdrops/${slug}.jpg`,
      url: backdropUrl(slug),
      width: BACKDROP_W,
      height: BACKDROP_H,
    },
  ]
}

async function clearCatalog(): Promise<void> {
  // Delete roots; cascades remove join rows, images, videos, and episodes.
  await prisma.mediaCollection.deleteMany()
  await prisma.media.deleteMany()
  await prisma.genre.deleteMany()
  await prisma.person.deleteMany()
}

async function main(): Promise<void> {
  console.log('Seeding catalog…')
  await clearCatalog()

  // Genres — keyed by name for later connect().
  const genreByName = new Map<GenreName, string>()
  for (const name of GENRES) {
    const genre = await prisma.genre.create({ data: { name } })
    genreByName.set(name, genre.id)
  }

  // People — keyed by name for later connect().
  const personByName = new Map<PersonName, string>()
  for (const { name } of PEOPLE) {
    const person = await prisma.person.create({ data: { name } })
    personByName.set(name, person.id)
  }

  const requireGenre = (name: GenreName): string => {
    const id = genreByName.get(name)
    if (!id) throw new Error(`Missing seeded genre: ${name}`)
    return id
  }
  const requirePerson = (name: PersonName): string => {
    const id = personByName.get(name)
    if (!id) throw new Error(`Missing seeded person: ${name}`)
    return id
  }

  // Keep media ids by slug so collections can connect to them.
  const mediaIdBySlug = new Map<string, string>()

  // Movies.
  for (const movie of MOVIES) {
    const created = await prisma.media.create({
      data: {
        title: movie.title,
        type: MediaType.MOVIE,
        description: movie.description,
        releaseYear: movie.releaseYear,
        durationSec: movie.durationSec,
        maturityRating: movie.maturityRating,
        images: { create: mediaImagesCreate(movie.slug) },
        videos: {
          create: [
            {
              storagePath: `videos/movies/${movie.slug}.mp4`,
              container: 'mp4',
              language: 'en',
            },
          ],
        },
        genres: {
          create: movie.genres.map((g) => ({
            genre: { connect: { id: requireGenre(g) } },
          })),
        },
        people: {
          create: movie.cast.map((c) => ({
            role: c.role,
            person: { connect: { id: requirePerson(c.name) } },
          })),
        },
      },
    })
    mediaIdBySlug.set(movie.slug, created.id)
  }

  // Series (+ episodes).
  for (const series of SERIES) {
    const created = await prisma.media.create({
      data: {
        title: series.title,
        type: MediaType.SERIES,
        description: series.description,
        releaseYear: series.releaseYear,
        maturityRating: series.maturityRating,
        images: { create: mediaImagesCreate(series.slug) },
        genres: {
          create: series.genres.map((g) => ({
            genre: { connect: { id: requireGenre(g) } },
          })),
        },
        people: {
          create: series.cast.map((c) => ({
            role: c.role,
            person: { connect: { id: requirePerson(c.name) } },
          })),
        },
        episodes: {
          create: series.episodes.map((ep) => ({
            title: ep.title,
            description: ep.description,
            episodeNumber: ep.episodeNumber,
            durationSec: ep.durationSec,
            releaseYear: ep.releaseYear,
            videos: {
              create: [
                {
                  storagePath: `videos/series/${series.slug}/ep-${ep.episodeNumber}.mp4`,
                  container: 'mp4',
                  language: 'en',
                },
              ],
            },
            images: {
              create: [
                {
                  type: 'THUMBNAIL',
                  storagePath: `images/episodes/${series.slug}/ep-${ep.episodeNumber}.jpg`,
                  url: backdropUrl(`${series.slug}-ep-${ep.episodeNumber}`),
                  width: BACKDROP_W,
                  height: BACKDROP_H,
                },
              ],
            },
          })),
        },
      },
    })
    mediaIdBySlug.set(series.slug, created.id)
  }

  // Collections.
  for (const collection of COLLECTIONS) {
    await prisma.mediaCollection.create({
      data: {
        name: collection.name,
        description: collection.description,
        items: {
          create: collection.mediaSlugs.map((slug, index) => {
            const mediaId = mediaIdBySlug.get(slug)
            if (!mediaId) {
              throw new Error(
                `Collection "${collection.name}" references unknown media slug: ${slug}`,
              )
            }
            return { sortOrder: index, media: { connect: { id: mediaId } } }
          }),
        },
      },
    })
  }

  const [mediaCount, genreCount, personCount, collectionCount, episodeCount] =
    await Promise.all([
      prisma.media.count(),
      prisma.genre.count(),
      prisma.person.count(),
      prisma.mediaCollection.count(),
      prisma.episode.count(),
    ])

  console.log(
    `Seeded: ${mediaCount} media (${episodeCount} episodes), ${genreCount} genres, ` +
      `${personCount} people, ${collectionCount} collections.`,
  )
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => {
    void prisma.$disconnect()
  })
