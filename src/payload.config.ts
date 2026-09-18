import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { fa } from '@payloadcms/translations/languages/fa'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Otps } from './collections/Otps'
import { Media } from './collections/Media'
import { Cities } from './collections/Cities'
import { Barbers } from './collections/Barbers'
import { Services } from './collections/Services'
import { Appointments } from './collections/Appointments'
import { BarberRequests } from './collections/BarberRequests'
import { Comments } from './collections/Comments'
import { Conversations } from './collections/Conversations'
import { Messages } from './collections/Messages'
import { SubscriptionPlans } from './collections/SubscriptionPlans'
import { Subscriptions } from './collections/Subscriptions'
import { Pages } from './collections/Pages'

import { Settings } from './globals/Settings'
import { Home } from './globals/Home'
import { FooterGlobal } from './globals/Footer'

import {
  statusMetaEndpoint,
  customerDashboardEndpoint,
  barberDashboardEndpoint,
} from './endpoints'
import { profileGetEndpoint, profileUpdateEndpoint, profileAvatarEndpoint } from './endpoints/profile'
import { requestOtpEndpoint, verifyOtpEndpoint } from './endpoints/otp'
import { conversationsListEndpoint, conversationCreateEndpoint } from './endpoints/chat'
import { commentsListEndpoint } from './endpoints/comments'
import {
  barberSubscriptionGetEndpoint,
  barberSubscriptionPurchaseEndpoint,
} from './endpoints/subscriptions'

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
    Otps,
    Media,
    Cities,
    Barbers,
    Services,
    Appointments,
    BarberRequests,
    Comments,
    Conversations,
    Messages,
    SubscriptionPlans,
    Subscriptions,
    Pages,
  ],
  globals: [Settings, Home, FooterGlobal],
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en, fa },
  },
  endpoints: [
    statusMetaEndpoint,
    customerDashboardEndpoint,
    barberDashboardEndpoint,
    profileGetEndpoint,
    profileUpdateEndpoint,
    profileAvatarEndpoint,
    requestOtpEndpoint,
    verifyOtpEndpoint,
    conversationsListEndpoint,
    conversationCreateEndpoint,
    commentsListEndpoint,
    barberSubscriptionGetEndpoint,
    barberSubscriptionPurchaseEndpoint,
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
