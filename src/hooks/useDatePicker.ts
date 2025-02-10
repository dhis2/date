import { Temporal } from '@js-temporal/polyfill'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { dhis2CalendarsMap } from '../constants/dhis2CalendarsMap'
import { getNowInCalendar } from '../index'
import { PickerOptions, SupportedCalendar } from '../types'
import {
    formatDate,
    getCustomCalendarIfExists,
    extractAndValidateDateString,
} from '../utils/helpers'
import localisationHelpers from '../utils/localisationHelpers'
import { useCalendarWeekDays } from './internal/useCalendarWeekDays'
import {
    useNavigation,
    UseNavigationReturnType,
} from './internal/useNavigation'
import { useResolvedLocaleOptions } from './internal/useResolvedLocaleOptions'
import { useWeekDayLabels } from './internal/useWeekDayLabels'

export type OnDateSelectPayload = {
    calendarDateString: string
} | null

export type DatePickerOptions = {
    date: string
    options: PickerOptions
    onDateSelect: (payload: OnDateSelectPayload) => void
    minDate?: string
    maxDate?: string
    format?: 'YYYY-MM-DD' | 'DD-MM-YYYY'
    strictValidation?: boolean
}

export type UseDatePickerReturn = UseNavigationReturnType & {
    weekDayLabels: string[]
    calendarWeekDays: {
        dateValue: string
        label: string | number
        onClick: () => void
        isSelected: boolean | undefined
        isToday: boolean
        isInCurrentMonth: boolean
    }[][]
}
type UseDatePickerHookType = (options: DatePickerOptions) => UseDatePickerReturn
type ValidatedDate = Temporal.YearOrEraAndEraYear &
    Temporal.MonthOrMonthCode & {
        day: number
        format?: string
    }

export const useDatePicker: UseDatePickerHookType = ({
    onDateSelect,
    date: dateString,
    minDate,
    maxDate,
    format,
    strictValidation,
    options,
}) => {
    const optionsWithCustomerCalendar = useMemo(() => {
        const calendar = getCustomCalendarIfExists(
            dhis2CalendarsMap[options.calendar ?? 'gregorian'] ??
                options.calendar
        ) as SupportedCalendar
        return {
            ...options,
            calendar,
        }
    }, [options])

    const resolvedOptions = useResolvedLocaleOptions(
        optionsWithCustomerCalendar
    )

    const prevDateStringRef = useRef(dateString)

    const todayZdt = useMemo(
        () =>
            getNowInCalendar(
                resolvedOptions.calendar,
                resolvedOptions.timeZone
            ).startOfDay(),
        [resolvedOptions]
    )

    const date = useMemo(
        () =>
            extractAndValidateDateString(dateString, {
                ...resolvedOptions,
                minDateString: minDate,
                maxDateString: maxDate,
                strictValidation,
                format,
            }) as ValidatedDate,
        [
            minDate,
            maxDate,
            strictValidation,
            format,
            resolvedOptions,
            dateString,
        ]
    )

    date.format = !date.format ? format : date.format

    const temporalCalendar = useMemo(
        () => Temporal.Calendar.from(resolvedOptions.calendar),
        [resolvedOptions.calendar]
    )
    const temporalTimeZone = useMemo(
        () => Temporal.TimeZone.from(resolvedOptions.timeZone),
        [resolvedOptions.timeZone]
    )

    const selectedDateZdt = dateString
        ? Temporal.Calendar.from(temporalCalendar)
              .dateFromFields(date)
              .toZonedDateTime({
                  timeZone: temporalTimeZone,
              })
        : null

    const [firstZdtOfVisibleMonth, setFirstZdtOfVisibleMonth] = useState(() => {
        const zdt = selectedDateZdt || todayZdt
        return zdt.with({ day: 1 })
    })

    const localeOptions = useMemo(
        () => ({
            locale: resolvedOptions.locale,
            calendar: temporalCalendar,
            timeZone: temporalTimeZone,
            weekDayFormat: resolvedOptions.weekDayFormat,
            numberingSystem: resolvedOptions.numberingSystem,
        }),
        [resolvedOptions, temporalCalendar, temporalTimeZone]
    )

    const weekDayLabels = useWeekDayLabels(localeOptions)

    const navigation = useNavigation(
        firstZdtOfVisibleMonth.withCalendar(localeOptions.calendar),
        setFirstZdtOfVisibleMonth,
        localeOptions
    )
    const selectDate = useCallback(
        (zdt: Temporal.ZonedDateTime) => {
            onDateSelect({
                calendarDateString: formatDate(zdt, undefined, date.format),
            })
        },
        [onDateSelect, date.format]
    )
    const calendarWeekDaysZdts = useCalendarWeekDays(firstZdtOfVisibleMonth)

    useEffect(() => {
        if (dateString === prevDateStringRef.current) {
            return
        }

        prevDateStringRef.current = dateString

        const zdt = Temporal.Calendar.from(temporalCalendar)
            .dateFromFields(date)
            .toZonedDateTime({
                timeZone: temporalTimeZone,
            })

        if (
            (firstZdtOfVisibleMonth.year !== zdt.year ||
                firstZdtOfVisibleMonth.month !== zdt.month) &&
            !calendarWeekDaysZdts.some((week) =>
                week.some((day) => day.equals(zdt))
            )
        ) {
            setFirstZdtOfVisibleMonth(zdt.subtract({ days: zdt.day - 1 }))
        }
    }, [
        date,
        dateString,
        firstZdtOfVisibleMonth,
        calendarWeekDaysZdts,
        temporalCalendar,
        temporalTimeZone,
    ])
    const result: UseDatePickerReturn = {
        calendarWeekDays: calendarWeekDaysZdts.map((week) =>
            week.map((weekDayZdt) => ({
                dateValue: formatDate(weekDayZdt, undefined, format),
                label: localisationHelpers.localiseWeekLabel(
                    weekDayZdt.withCalendar(localeOptions.calendar),
                    {...localeOptions, calendar: resolvedOptions.calendar}
                ),
                onClick: () => selectDate(weekDayZdt),
                isSelected: selectedDateZdt
                    ? selectedDateZdt
                          ?.withCalendar('iso8601')
                          .equals(weekDayZdt.withCalendar('iso8601'))
                    : false,
                isToday: todayZdt && weekDayZdt.equals(todayZdt),
                isInCurrentMonth:
                    firstZdtOfVisibleMonth &&
                    weekDayZdt.month === firstZdtOfVisibleMonth.month,
            }))
        ),
        ...navigation,
        weekDayLabels,
    }

    return result
}
