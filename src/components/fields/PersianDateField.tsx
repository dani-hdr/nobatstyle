'use client'

import type { DateFieldClientComponent, DateFieldClientProps } from 'payload'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import React, { useCallback, useMemo } from 'react'
import DatePicker from 'react-multi-date-picker'
import type DateObject from 'react-date-object'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import TimePicker from 'react-multi-date-picker/plugins/time_picker'

import './PersianDateField.scss'

const fmtDayOnly = 'YYYY/MM/DD'
const fmtDateTime = 'YYYY/MM/DD HH:mm'

type PersianDateFieldProps = DateFieldClientProps & {
  withTime?: boolean
}

function PersianDateFieldInner(props: PersianDateFieldProps) {
  const {
    field,
    field: {
      admin: { description } = {},
      label,
      required,
    },
    path: pathFromProps,
    readOnly,
    withTime = false,
  } = props

  const { disabled: disabledFromField, path, setValue, showError, value } = useField({
    potentiallyStalePath: pathFromProps,
  })

  const disabled = Boolean(readOnly || disabledFromField)

  const pickerValue = useMemo(() => {
    if (!value) return undefined
    const parsed = new Date(String(value))
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])

  const onChange = useCallback(
    (dateObj: DateObject | null) => {
      if (disabled) return
      if (!dateObj) {
        setValue(null)
        return
      }
      const isEpochPlaceholder = dateObj.year === 1 && dateObj.day === 1 && dateObj.month.number === 1
      if (isEpochPlaceholder) {
        setValue(null)
        return
      }
      const js = dateObj.toDate()
      if (withTime) {
        setValue(js.toISOString())
      } else {
        const y = js.getFullYear()
        const m = String(js.getMonth() + 1).padStart(2, '0')
        const d = String(js.getDate()).padStart(2, '0')
        setValue(`${y}-${m}-${d}`)
      }
    },
    [disabled, setValue, withTime],
  )

  const baseClass = 'date-time-field'
  const classes = [baseClass, showError && `${baseClass}--has-error`, disabled && 'read-only']
    .filter(Boolean)
    .join(' ')

  const pickerProps = {
    calendar: persian,
    locale: persian_fa,
    format: withTime ? fmtDateTime : fmtDayOnly,
    value: pickerValue,
    onChange,
    id: path,
    name: path,
    readOnly: disabled,
    editable: false,
    arrow: false,
    zIndex: 9999,
    calendarPosition: 'bottom-left',
  } as const

  return (
    <div className={classes}>
      <FieldLabel htmlFor={path} label={label} required={required} />
      <div className={`${baseClass}__wrap`} id={`field-${path.replace(/\./g, '__')}`}>
        <FieldError path={path} showError={showError} />
        <div className="persian-date-field">
          <DatePicker
            {...pickerProps}
            plugins={withTime ? [<TimePicker key="time" position="bottom" hideSeconds />] : []}
          />
        </div>
      </div>
      {description ? <FieldDescription description={description} path={path} /> : null}
    </div>
  )
}

export const PersianDateField: DateFieldClientComponent = (props) => (
  <PersianDateFieldInner {...props} withTime={false} />
)

export const PersianDateTimeField: DateFieldClientComponent = (props) => (
  <PersianDateFieldInner {...props} withTime />
)

export default PersianDateField
