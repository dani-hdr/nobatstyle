import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Platform-wide configuration. Read is public (admin panel), while a custom
 * /api/settings/public endpoint exposes only the safe subset to the frontend.
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
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
      name: 'general',
      label: 'عمومی',
      fields: [
        { name: 'siteName', type: 'text' },
        { name: 'supportPhone', type: 'text' },
        { name: 'supportEmail', type: 'text' },
        { name: 'timezone', type: 'text', defaultValue: 'Asia/Tehran' },
      ],
    },
    {
      type: 'group',
      name: 'booking',
      label: 'رزرو',
      fields: [
        {
          name: 'slotStepMinutes',
          type: 'number',
          defaultValue: 15,
          min: 5,
          admin: { description: 'گام زمانی اسلات‌ها (دقیقه)' },
        },
        {
          name: 'cancellationWindowMinutes',
          type: 'number',
          defaultValue: 120,
          admin: { description: 'حداقل زمان قبل از شروع رزرو برای لغو بدون جریمه' },
        },
        {
          name: 'maxBookingHorizonDays',
          type: 'number',
          defaultValue: 45,
          admin: { description: 'حداکثر فاصله روز برای رزرو' },
        },
        {
          name: 'defaultStatus',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'در انتظار تأیید', value: 'pending' },
            { label: 'تأیید خودکار', value: 'confirmed' },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'auth',
      label: 'ثبت‌نام و ورود',
      fields: [
        { name: 'registrationEnabled', type: 'checkbox', defaultValue: true },
        { name: 'otpEnabled', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}
