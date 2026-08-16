import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import type { City } from '@/payload-types'
import config from '@payload-config'
import { IRAN_PROVINCES } from '../data/iran-provinces'

const PERSIAN_TO_ASCII: Record<string, string> = {
  ا: 'a', ب: 'b', پ: 'p', ت: 't', ث: 's', ج: 'j', چ: 'ch', ح: 'h', خ: 'kh',
  د: 'd', ذ: 'z', ر: 'r', ز: 'z', ژ: 'zh', س: 's', ش: 'sh', ص: 's', ض: 'z',
  ط: 't', ظ: 'z', ع: '', غ: 'gh', ف: 'f', ق: 'gh', ک: 'k', گ: 'g', ل: 'l',
  م: 'm', ن: 'n', و: 'v', ه: 'h', ی: 'y', آ: 'a', ' ': '-', '\u200c': '',
}

/**
 * Transliterates a Persian city name to an ASCII slug. Payload's slugField
 * re-slugifies on create and strips non-ASCII, so we must provide ASCII-safe
 * slugs here.
 */
function makeSlug(name: string): string {
  return name
    .split('')
    .map((c) => PERSIAN_TO_ASCII[c] ?? c)
    .join('')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Seeds the Cities collection with all Iran provinces and their cities.
 *
 * Creates city documents (name + province) if they don't already exist,
 * keyed by the city name so subsequent runs are idempotent.
 *
 * Run with: pnpm tsx src/scripts/seed-cities.ts
 */
async function seed() {
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0
  const seenNames = new Set<string>()

  for (const { province, cities } of IRAN_PROVINCES) {
    const provinceValue = province as City['province']
    for (const name of cities) {
      // Skip duplicate city names appearing later in the dataset.
      if (seenNames.has(name)) {
        skipped++
        continue
      }
      seenNames.add(name)

      const existing = await payload.find({
        collection: 'cities',
        where: { name: { equals: name } },
        limit: 1,
        depth: 0,
      })

      if (existing.docs.length > 0) {
        // Update province in case it was missing or changed.
        await payload.update({
          collection: 'cities',
          id: existing.docs[0].id,
          data: { province: provinceValue },
          overrideAccess: true,
        })
        skipped++
        continue
      }

      await payload.create({
        collection: 'cities',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { name, province: provinceValue, slug: makeSlug(name), isActive: true } as any,
        overrideAccess: true,
      })
      created++
    }
  }

  console.log(`Done. Created ${created}, skipped ${skipped}.`)
  process.exit(0)
}

void seed()
