import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'رسانه',
    plural: 'رسانه‌ها',
  },
  admin: {
    group: 'پایه و رسانه',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'متن جایگزین',
    },
  ],
  upload: true,
}
