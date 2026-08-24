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
import { Reviews } from './collections/Reviews'
import { Comments } from './collections/Comments'
import { Portfolio } from './collections/Portfolio'
import { Conversations } from './collections/Conversations'
import { Messages } from './collections/Messages'
import { Notifications } from './collections/Notifications'
import { SubscriptionPlans } from './collections/SubscriptionPlans'
import { Subscriptions } from './collections/Subscriptions'

import { Settings } from './globals/Settings'
import { Home } from './globals/Home'

import {
  settingsPublicEndpoint,
  statusMetaEndpoint,
  customerDashboardEndpoint,
  barberDashboardEndpoint,
} from './endpoints'
import { profileGetEndpoint, profileUpdateEndpoint, profileAvatarEndpoint } from './endpoints/profile'
import { requestOtpEndpoint, verifyOtpEndpoint } from './endpoints/otp'
import { conversationsListEndpoint, conversationCreateEndpoint } from './endpoints/chat'
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
    Reviews,
    Comments,
    Portfolio,
    Conversations,
    Messages,
    Notifications,
    SubscriptionPlans,
    Subscriptions,
  ],
  globals: [Settings, Home],
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en, fa },
  },
  endpoints: [
    settingsPublicEndpoint,
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
