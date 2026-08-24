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
        { name: 'siteName', type: 'text', label: 'نام سایت' },
        { name: 'logo', type: 'upload', relationTo: 'media', label: 'لوگو', admin: { description: 'لوگوی برند (در هدر و فوتر نمایش داده می‌شود)' } },
        { name: 'supportPhone', type: 'text', label: 'تلفن پشتیبانی' },
        { name: 'supportEmail', type: 'text', label: 'ایمیل پشتیبانی' },
        { name: 'timezone', type: 'text', defaultValue: 'Asia/Tehran', label: 'منطقه زمانی' },
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
          label: 'گام زمانی اسلات‌ها',
          admin: { description: 'گام زمانی اسلات‌ها (دقیقه)' },
        },
        {
          name: 'cancellationWindowMinutes',
          type: 'number',
          defaultValue: 120,
          label: 'مهلت لغو رزرو',
          admin: { description: 'حداقل زمان قبل از شروع رزرو برای لغو بدون جریمه' },
        },
        {
          name: 'maxBookingHorizonDays',
          type: 'number',
          defaultValue: 45,
          label: 'حداکثر فاصله رزرو',
          admin: { description: 'حداکثر فاصله روز برای رزرو' },
        },
        {
          name: 'defaultStatus',
          type: 'select',
          defaultValue: 'pending',
          label: 'وضعیت پیش‌فرض رزرو',
          options: [
            { label: 'در انتظار تأیید', value: 'pending' },
            { label: 'تأیید خودکار', value: 'confirmed' },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'navigation',
      label: 'ناوبری',
      fields: [
        {
          name: 'links',
          type: 'array',
          label: 'لینک‌های منوی بالا',
          admin: {
            description: 'لینک‌های ناوبری هدر (خانه، آرایشگرها و...)',
          },
          fields: [
            { name: 'label', type: 'text', required: true, label: 'عنوان' },
            { name: 'href', type: 'text', required: true, label: 'آدرس' },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'monetization',
      label: 'اشتراک آرایشگران',
      fields: [
        {
          name: 'enforceSubscription',
          type: 'checkbox',
          defaultValue: true,
          label: 'اجبار اشتراک برای پذیرش نوبت',
          admin: { description: 'مشتریان همیشه رایگان‌اند؛ با فعال بودن این گزینه، آرایشگرها بعد از پایان دوره آزمایشی باید اشتراک فعال داشته باشند تا نوبت بپذیرند.' },
        },
        {
          name: 'trialDays',
          type: 'number',
          defaultValue: 14,
          min: 0,
          label: 'دوره آزمایشی رایگان (روز)',
          admin: { description: 'از لحظه ساخت پروفایل آرایشگر محاسبه می‌شود' },
        },
      ],
    },
    {
      type: 'group',
      name: 'auth',
      label: 'ثبت‌نام و ورود',
      fields: [
        { name: 'registrationEnabled', type: 'checkbox', defaultValue: true, label: 'فعال بودن ثبت‌نام' },
        { name: 'otpEnabled', type: 'checkbox', defaultValue: false, label: 'فعال بودن کد یکبارمصرف' },
      ],
    },
  ],
}
