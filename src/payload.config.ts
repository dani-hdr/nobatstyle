import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Cities } from './collections/Cities'
import { Barbers } from './collections/Barbers'
import { Services } from './collections/Services'
import { Appointments } from './collections/Appointments'
import { Reviews } from './collections/Reviews'
import { AvailabilityExceptions } from './collections/AvailabilityExceptions'
import { Portfolio } from './collections/Portfolio'
import { Conversations } from './collections/Conversations'
import { Messages } from './collections/Messages'
import { Notifications } from './collections/Notifications'
import { SubscriptionPlans } from './collections/SubscriptionPlans'

import { Settings } from './globals/Settings'
import { Home } from './globals/Home'

import {
  settingsPublicEndpoint,
  statusMetaEndpoint,
  customerDashboardEndpoint,
  barberDashboardEndpoint,
} from './endpoints'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Cities,
    Barbers,
    Services,
    Appointments,
    Reviews,
    AvailabilityExceptions,
    Portfolio,
    Conversations,
    Messages,
    Notifications,
    SubscriptionPlans,
  ],
  globals: [Settings, Home],
  endpoints: [
    settingsPublicEndpoint,
    statusMetaEndpoint,
    customerDashboardEndpoint,
    barberDashboardEndpoint,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
})
