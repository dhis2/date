import { Temporal } from '@js-temporal/polyfill'
import { useMemo } from 'react'
import { PickerOptionsWithResolvedCalendar } from '../../types'
import localisationHelpers from '../../utils/localisationHelpers'

export const useWeekDayLabels = (
    localeOptions: PickerOptionsWithResolvedCalendar
) =>
    useMemo(() => {
        if (!localeOptions.calendar) {
            throw new Error('a calendar must be provided to useWeekDayLabels')
        }
        const today = Temporal.Now.zonedDateTime(
            localeOptions.calendar
        ).startOfDay()

        const startOfWeek = today.subtract({ days: today.dayOfWeek - 1 }) // dayOfWeek is 1-based, where 1 is Monday

        const labels = []

        for (let i = 0; i < today.daysInWeek; i++) {
            const currentDate = startOfWeek.add({
                days: i,
            })

            const weekDayString = getWeekDayString(currentDate, localeOptions)
            labels.push(weekDayString)
        }
        return labels
    }, [localeOptions])

const getWeekDayString: (
    date: Temporal.ZonedDateTime,
    localeOptions: PickerOptionsWithResolvedCalendar
) => string = (date, localeOptions) => {
    return localisationHelpers.localiseWeekDayLabel(date, localeOptions)
}
