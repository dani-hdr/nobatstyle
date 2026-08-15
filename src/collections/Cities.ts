import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { isAdmin } from '../access'

export const Cities: CollectionConfig = {
  slug: 'cities',
  labels: {
    singular: 'شهر',
    plural: 'شهرها',
  },
  admin: {
    useAsTitle: 'name',
    group: 'جغرافیا',
    defaultColumns: ['name', 'slug', 'isActive'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام شهر',
    },
    slugField({
      useAsSlug: 'name',
      overrides: (field) => {
        const slugField = field.fields[1] as { label?: string }
        if (slugField) slugField.label = 'شناسه'
        return field
      },
    }),
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
