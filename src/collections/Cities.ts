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
    defaultColumns: ['name', 'province', 'slug', 'isActive'],
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
      name: 'province',
      type: 'select',
      required: true,
      index: true,
      label: 'استان',
      options: [
        { label: 'آذربایجان شرقی', value: 'azarbaijan-sharghi' },
        { label: 'آذربایجان غربی', value: 'azarbaijan-gharbi' },
        { label: 'اردبیل', value: 'ardabil' },
        { label: 'اصفهان', value: 'isfahan' },
        { label: 'البرز', value: 'alborz' },
        { label: 'ایلام', value: 'ilam' },
        { label: 'بوشهر', value: 'bushehr' },
        { label: 'تهران', value: 'tehran' },
        { label: 'چهارمحال و بختیاری', value: 'chaharmahal-bakhtiari' },
        { label: 'خراسان جنوبی', value: 'khorasan-jonubi' },
        { label: 'خراسان رضوی', value: 'khorasan-razavi' },
        { label: 'خراسان شمالی', value: 'khorasan-shomali' },
        { label: 'خوزستان', value: 'khuzestan' },
        { label: 'زنجان', value: 'zanjan' },
        { label: 'سمنان', value: 'semnan' },
        { label: 'سیستان و بلوچستان', value: 'sistan-baluchestan' },
        { label: 'فارس', value: 'fars' },
        { label: 'قزوین', value: 'qazvin' },
        { label: 'قم', value: 'qom' },
        { label: 'کردستان', value: 'kurdistan' },
        { label: 'کرمان', value: 'kerman' },
        { label: 'کرمانشاه', value: 'kermanshah' },
        { label: 'کهگیلویه و بویراحمد', value: 'kohgiluyeh-boyerahmad' },
        { label: 'گلستان', value: 'golestan' },
        { label: 'گیلان', value: 'gilan' },
        { label: 'لرستان', value: 'lorestan' },
        { label: 'مازندران', value: 'mazandaran' },
        { label: 'مرکزی', value: 'markazi' },
        { label: 'هرمزگان', value: 'hormozgan' },
        { label: 'همدان', value: 'hamadan' },
        { label: 'یزد', value: 'yazd' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
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
