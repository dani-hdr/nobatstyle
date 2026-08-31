import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Admin-configurable footer. Everything the visitor sees in the site footer
 * (brand text, link columns, social icons, copyright) is edited from the
 * admin panel. Read is public so the frontend can always render it.
 */
export const FooterGlobal: GlobalConfig = {
  slug: 'footer',
  label: 'فوتر',
  admin: {
    group: 'تنظیمات',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      type: 'group',
      name: 'brand',
      label: 'برند',
      fields: [
        {
          name: 'aboutText',
          type: 'textarea',
          label: 'متن معرفی',
          admin: { description: 'توضیح کوتاهی که زیر نام سایت در فوتر نمایش داده می‌شود.' },
        },
      ],
    },
    {
      name: 'columns',
      type: 'array',
      label: 'ستون‌های لینک',
      labels: { singular: 'ستون', plural: 'ستون‌ها' },
      admin: {
        description: 'هر ستون یک عنوان و چند لینک دارد (مثل «دسترسی سریع» یا «پشتیبانی»).',
      },
      fields: [
        { name: 'title', type: 'text', required: true, label: 'عنوان ستون' },
        {
          name: 'links',
          type: 'array',
          label: 'لینک‌ها',
          fields: [
            { name: 'label', type: 'text', required: true, label: 'عنوان' },
            { name: 'href', type: 'text', required: true, label: 'آدرس' },
          ],
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'شبکه‌های اجتماعی',
      labels: { singular: 'شبکه اجتماعی', plural: 'شبکه‌های اجتماعی' },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          label: 'آیکون',
          options: [
            { label: 'اینستاگرام', value: 'instagram' },
            { label: 'تلگرام', value: 'telegram' },
            { label: 'توییتر / X', value: 'twitter' },
            { label: 'یوتیوب', value: 'youtube' },
            { label: 'واتس‌اپ', value: 'whatsapp' },
           
          ],
        },
        { name: 'label', type: 'text', label: 'عنوان (برای دسترسی‌پذیری)' },
        { name: 'href', type: 'text', required: true, label: 'آدرس' },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      label: 'متن کپی‌رایت',
      admin: { description: 'متن انتهای فوتر؛ در صورت خالی ماندن از نام سایت استفاده می‌شود.' },
    },
  ],
}
