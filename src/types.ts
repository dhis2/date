import { Temporal } from '@js-temporal/polyfill'
import { calendars } from './constants/calendars'
import { numberingSystems } from './constants/numberingSystems'

export type SupportedCalendar = typeof calendars[number]
export type SupportedNumberingSystem = typeof numberingSystems[number]

export type WeekDayFormat = 'narrow' | 'short' | 'long'

export type PickerOptions = Partial<ResolvedLocaleOptions>

export type PickerOptionsWithResolvedCalendar = Omit<PickerOptions, 'calendar'> & {
    calendar: Temporal.CalendarProtocol 
}

export type ResolvedLocaleOptions = {
    calendar: SupportedCalendar
    locale: string
    timeZone: Temporal.TimeZoneLike
    numberingSystem: string
    weekDayFormat: WeekDayFormat
}
