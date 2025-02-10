import { Temporal } from '@js-temporal/polyfill'
import { Dispatch, SetStateAction, useMemo } from 'react'
import {
    PickerOptionsWithResolvedCalendar,
    SupportedCalendar,
} from '../../types'
import localisationHelpers from '../../utils/localisationHelpers'

export type UseNavigationReturnType = {
    prevYear: {
        label: string | number
        navigateTo: () => void
    }
    currYear: {
        label: string | number
        value: string | number
    }
    nextYear: {
        label: string | number
        navigateTo: () => void
    }
    prevMonth: {
        label: string | undefined
        navigateTo: () => void
    }
    currMonth: {
        label: string | undefined
    }
    nextMonth: {
        label: string | undefined
        navigateTo: () => void
    }
    months: Array<{
        label: string
        value: number
    }>
    navigateToMonth: (month: number) => void
    navigateToYear: (year: number) => void
}

type Month = {
    value: number
    dateForLabel?: Temporal.PlainDate
}

const getAvailableMonths = (calendarSystem = 'iso8601'): Month[] => {
    try {
        const calendar = new Temporal.Calendar(calendarSystem)
        const referenceDate = calendar.dateFromFields({
            year: 2000,
            month: 1,
            day: 1,
        })

        const months: Month[] = []
        let monthIndex = 1

        while (monthIndex <= 13) {
            try {
                const date = calendar.dateFromFields({
                    year: referenceDate.year,
                    month: monthIndex,
                    day: 1,
                })
                const monthInfo = calendar.monthsInYear(date)
                if (monthIndex > monthInfo) {
                    break
                }
                months.push({
                    value: monthIndex,
                    dateForLabel: date,
                })
                monthIndex++
            } catch (e) {
                break
            }
        }
        return months
    } catch (e) {
        return getAvailableMonths('iso8601')
    }
}

type UseNavigationHook = (
    firstZdtOfVisibleMonth: Temporal.ZonedDateTime,
    setFirstZdtOfVisibleMonth: Dispatch<SetStateAction<Temporal.ZonedDateTime>>,
    localeOptions: PickerOptionsWithResolvedCalendar
) => UseNavigationReturnType
/**
 * internal hook used by useDatePicker to build the navigation of the calendar
 *
 * @param options
 * @returns
 */
export const useNavigation: UseNavigationHook = (
    firstZdtOfVisibleMonth,
    setFirstZdtOfVisibleMonth,
    localeOptions
) => {
    return useMemo(() => {
        const prevYear = firstZdtOfVisibleMonth.subtract({ years: 1 })
        const nextYear = firstZdtOfVisibleMonth.add({ years: 1 })

        // Setting the day to the 14th is guaranteed to get the next month correctly
        // according to our defintion, which considers adding one month to be the equivalent
        // of adding 1 to the current month, while Temporal does the arithmetic in iso8601
        // then converts to the custom calendar, which could end up in the same month.
        // (for example in Nepali where current date + 30 can end up in the same month for a month that has 32 days)
        // todo: clarify the expected behaviour with the Temporal team
        const prevMonth = firstZdtOfVisibleMonth
            .with({ day: 14 })
            .subtract({ months: 1 })
        const nextMonth = firstZdtOfVisibleMonth
            .with({ day: 14 })
            .add({ months: 1 })

        const options = {
            locale: localeOptions.locale,
            calendar: localeOptions.calendar.id as
                | SupportedCalendar
                | undefined,
            numberingSystem: localeOptions.numberingSystem,
        }

        const yearNumericFormat: Intl.DateTimeFormatOptions = {
            ...options,
            year: 'numeric' as const,
        }

        const monthFormat: Intl.DateTimeFormatOptions = {
            ...options,
            month: 'long' as const,
        }

        const monthsData = getAvailableMonths(options.calendar)
        const months = monthsData
            .map((month) => ({
                value: month.value,
                label:
                    (month.dateForLabel &&
                        localisationHelpers.localiseMonth(
                            month.dateForLabel.toZonedDateTime({
                                timeZone: firstZdtOfVisibleMonth.timeZone,
                            }),
                            { ...localeOptions, calendar: options.calendar },
                            monthFormat
                        )) ||
                    '',
            }))
            .filter((month): month is { label: string; value: number } =>
                Boolean(month.label)
            )

        const navigateToMonth = (monthNum: number) => {
            try {
                setFirstZdtOfVisibleMonth(
                    firstZdtOfVisibleMonth.with({ month: monthNum, day: 1 })
                )
            } catch (e) {
                console.error('Invalid month navigation:', e)
            }
        }

        const navigateToYear = (year: number) => {
            try {
                setFirstZdtOfVisibleMonth(firstZdtOfVisibleMonth.with({ year }))
            } catch (e) {
                console.error('Invalid year navigation:', e)
            }
        }

        return {
            prevYear: {
                label: localisationHelpers.localiseYear(
                    prevYear,
                    { ...localeOptions, calendar: options.calendar },
                    yearNumericFormat
                ),
                navigateTo: () => setFirstZdtOfVisibleMonth(prevYear),
            },
            currYear: {
                label: localisationHelpers.localiseYear(
                    firstZdtOfVisibleMonth,
                    { ...localeOptions, calendar: options.calendar },
                    yearNumericFormat
                ),
                value:
                    options.calendar === 'ethiopic'
                        ? firstZdtOfVisibleMonth.eraYear ??
                          String(
                              localisationHelpers.localiseYear(
                                  firstZdtOfVisibleMonth,
                                  {
                                      ...localeOptions,
                                      calendar: options.calendar,
                                  },
                                  yearNumericFormat
                              )
                              // Ethiopic years - when localised to English - add the era (i.e. 2015 ERA1)
                          ).split(' ')[0]
                        : firstZdtOfVisibleMonth.year,
            },
            nextYear: {
                label: localisationHelpers.localiseYear(
                    nextYear,
                    { ...localeOptions, calendar: options.calendar },
                    yearNumericFormat
                ),
                navigateTo: () => setFirstZdtOfVisibleMonth(nextYear),
            },
            prevMonth: {
                label: localisationHelpers.localiseMonth(
                    prevMonth,
                    { ...localeOptions, calendar: options.calendar },
                    monthFormat
                ),
                navigateTo: () => setFirstZdtOfVisibleMonth(prevMonth),
            },
            currMonth: {
                label: localisationHelpers.localiseMonth(
                    firstZdtOfVisibleMonth,
                    { ...localeOptions, calendar: options.calendar },
                    monthFormat
                ),
            },
            nextMonth: {
                label: localisationHelpers.localiseMonth(
                    nextMonth,
                    { ...localeOptions, calendar: options.calendar },
                    monthFormat
                ),
                navigateTo: () => setFirstZdtOfVisibleMonth(nextMonth),
            },
            months,
            navigateToMonth,
            navigateToYear,
        }
    }, [firstZdtOfVisibleMonth, localeOptions, setFirstZdtOfVisibleMonth])
}
