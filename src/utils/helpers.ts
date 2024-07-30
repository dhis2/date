import { Temporal } from '@js-temporal/polyfill'
import { customCalendars, CustomCalendarTypes } from '../custom-calendars'
import { PickerOptions } from '../types'
import { extractDatePartsFromDateString } from './extract-date-parts-from-date-string'
import getNowInCalendar from './getNowInCalendar'
import { validateDateString } from './validate-date-string'

export const isCustomCalendar = (calendar: Temporal.CalendarLike) =>
    !!customCalendars[calendar as CustomCalendarTypes]

export const padWithZeroes = (number: number, count = 2) =>
    String(number).padStart(count, '0')

type DayType = 'endOfMonth' | 'startOfMonth'

type customDate = Temporal.PlainDateLike & {
    isValid: boolean
    warningMessage?: string
    errorMessage?: string
    format?: string
}

export const formatDate = (
    date: Temporal.PlainDate | Temporal.ZonedDateTime,
    dayType?: DayType,
    format?: string
) => {
    const year = date.eraYear ?? date.year
    const month = padWithZeroes(date.month)
    let day = date.day
    if (dayType === 'endOfMonth') {
        day = date.daysInMonth
    } else if (dayType === 'startOfMonth') {
        day = 1
    }

    const dayString = padWithZeroes(day)

    return format === 'DD-MM-YYYY'
        ? `${dayString}-${month}-${year}`
        : `${year}-${month}-${dayString}`
}

// capitalize method taking into account locales that have different way of lower/upper case
// based on https://stackoverflow.com/a/53930826
export const capitalize = (
    [firstLetter = '', ...rest]: string,
    locale = 'en'
) => [firstLetter.toLocaleUpperCase(locale), ...rest].join('')

export const getCustomCalendarIfExists = (
    calendar: Temporal.CalendarLike
): Temporal.CalendarProtocol | Temporal.CalendarLike => {
    const isCustom = isCustomCalendar(calendar)
    if (!isCustom) {
        return calendar
    }

    const customCalendar = customCalendars[
        calendar as keyof typeof customCalendars
    ]?.calendar as Temporal.CalendarProtocol

    if (!customCalendar) {
        throw new Error(
            `No implemenation found for custom calendar ${calendar}`
        )
    }

    return customCalendar
}

export const extractAndValidateDateString = (
    date: string,
    options: PickerOptions & {
        minDateString?: string
        maxDateString?: string
        strictValidation?: boolean
        format?: 'YYYY-MM-DD' | 'DD-MM-YYYY'
    }
): Temporal.PlainDateLike & {
    isValid: boolean
    warningMessage?: string
    errorMessage?: string
} => {
    if (!date) {
        return getCurrentDateResult(options)
    }

    const validation = validateDateString(date, options)
    if (validation.isValid) {
        return getValidDateResult(date, validation, options)
    } else {
        return getInvalidDateResult(options, validation.errorMessage)
    }
}

const getCurrentDateResult = (options: PickerOptions) => {
    const { year, month, day } = getNowInCalendar(
        options.calendar,
        options.timeZone
    )
    return { year, month, day, isValid: true }
}

const getValidDateResult = (
    date: string,
    validation: {
        isValid: boolean
        warningMessage?: string
        errorMessage?: string
    },
    options: PickerOptions
) => {
    const { year, month, day, format } = extractDatePartsFromDateString(date)
    let result: customDate = {
        year,
        month,
        day,
        format,
        isValid: validation.isValid,
        warningMessage: validation.warningMessage,
        errorMessage: validation.errorMessage,
    }

    if (options.calendar === 'ethiopic') {
        result = adjustForEthiopicCalendar(result)
    }

    return result
}

const getInvalidDateResult = (
    options: PickerOptions,
    errorMessage?: string
) => {
    const { year, month, day } = getNowInCalendar(
        options.calendar,
        options.timeZone
    )
    return { year, month, day, isValid: false, errorMessage }
}

const adjustForEthiopicCalendar = (result: customDate) => {
    result.era = 'era1'
    result.eraYear = result.year
    delete result.year
    return result
}
