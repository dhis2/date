import { Temporal } from '@js-temporal/polyfill'
import { numberingSystems } from '../constants'
import {
    CalendarCustomLocale,
    customCalendars,
    CustomCalendarTypes,
} from '../custom-calendars'
<<<<<<< HEAD
import { LocaleOptions } from '../hooks/useDatePicker'
import { formatYyyyMmDD, isCustomCalendar } from './helpers'
=======
import { PickerOptions } from '../types'
import { isCustomCalendar } from './helpers'
>>>>>>> main

const getCustomCalendarLocale = (
    calendar: Temporal.CalendarLike,
    locale: string | undefined
): CalendarCustomLocale | undefined => {
    const customCalendar = customCalendars[calendar as CustomCalendarTypes]

    if (!customCalendar) {
        return undefined
    }
    const customLocalisations = customCalendar.locales || {}
    const result =
        (locale && customLocalisations?.[locale]) ??
        customLocalisations?.[customCalendar.defaultLocale]

    if (!result) {
        throw new Error(
            `no localisation found for custom calendar ${calendar}. Requested locale: ${locale}, Default locale ${customCalendar.defaultLocale}`
        )
    }
    return result
}

<<<<<<< HEAD
type LocaliseDateLabel = (
    selectedDateZdt: Temporal.ZonedDateTime | Temporal.PlainDate,
    localeOptions: LocaleOptions,
    options?: { dateStyle: 'full' | 'long' | 'medium' | 'short' | undefined }
) => string

const localiseDateLabel: LocaliseDateLabel = (
    selectedDateZdt,
    localeOptions,
    options = { dateStyle: 'full' }
=======
const localiseDateLabel = (
    selectedDateZdt: Temporal.ZonedDateTime | null,
    localeOptions: PickerOptions
>>>>>>> main
) => {
    if (!localeOptions.calendar) {
        throw new Error('no calendar provided to localise function')
    }

    if (!selectedDateZdt) {
        throw new Error('a date must be provided to localiseDateLabel')
    }

    const isCustom = isCustomCalendar(localeOptions.calendar)

    const nonCustomDate =
        selectedDateZdt instanceof Temporal.ZonedDateTime
            ? selectedDateZdt?.toPlainDate()
            : selectedDateZdt

    return isCustom
        ? formatYyyyMmDD(selectedDateZdt)
        : nonCustomDate
              .toLocaleString(localeOptions.locale, {
                  calendar: localeOptions.calendar,
                  dateStyle: options.dateStyle,
              })
              .toString()
}

const localiseWeekLabel = (
    zdt: Temporal.ZonedDateTime,
    localeOptions: PickerOptions
) => {
    if (!localeOptions.calendar) {
        throw new Error('no calendar provided to localise function')
    }
    const isCustom = isCustomCalendar(localeOptions.calendar)
    const customLocale = getCustomCalendarLocale(
        localeOptions.calendar,
        localeOptions.locale
    )

    return isCustom
        ? customLocale?.numbers?.[zdt.day] || zdt.day
        : zdt.toPlainDate().toLocaleString(localeOptions.locale, {
              calendar: localeOptions.calendar,
              numberingSystem: numberingSystems.includes(
                  localeOptions.numberingSystem as typeof numberingSystems[number]
              )
                  ? localeOptions.numberingSystem
                  : undefined,
              day: 'numeric',
          })
}

const localiseMonth = (
    zdt: Temporal.ZonedDateTime | Temporal.PlainYearMonth | Temporal.PlainDate,
    localeOptions: PickerOptions,
    format: Intl.DateTimeFormatOptions
) => {
    if (!localeOptions.calendar) {
        throw new Error('no calendar provided to localise function')
    }
    const isCustom = isCustomCalendar(localeOptions.calendar)
    const customLocale = getCustomCalendarLocale(
        localeOptions.calendar,
        localeOptions.locale
    )

    return isCustom
        ? customLocale?.monthNames[zdt.month - 1]
        : zdt.toLocaleString(localeOptions.locale, format)
}

export const localiseWeekDayLabel = (
    zdt: Temporal.ZonedDateTime,
    localeOptions: PickerOptions
) => {
    if (!localeOptions.calendar) {
        throw new Error('no calendar provided to localise function')
    }
    const isCustom = isCustomCalendar(localeOptions.calendar)

    const customCalendar = getCustomCalendarLocale(
        localeOptions.calendar,
        localeOptions.locale
    )
    const customDayString = customCalendar?.dayNamesShort[zdt.dayOfWeek - 1] // dayOfWeek is 1-based

    return isCustom && customDayString
        ? customDayString
        : zdt.toPlainDate().toLocaleString(localeOptions.locale, {
              weekday: localeOptions.weekDayFormat,
              calendar: localeOptions.calendar,
          })
}

export const localiseYear = (
    zdt: Temporal.ZonedDateTime,
    localeOptions: PickerOptions,
    format: Intl.DateTimeFormatOptions
) => {
    if (!localeOptions.calendar) {
        throw new Error('no calendar provided to localise function')
    }
    const isCustom = isCustomCalendar(localeOptions.calendar)

    return isCustom
        ? zdt.year
        : zdt.toPlainYearMonth().toLocaleString(localeOptions.locale, format)
}
const localisationHelpers = {
    localiseYear,
    localiseDateLabel,
    localiseWeekLabel,
    localiseMonth,
    localiseWeekDayLabel,
}

export default localisationHelpers
