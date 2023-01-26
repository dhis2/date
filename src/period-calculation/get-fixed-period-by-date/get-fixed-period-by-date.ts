import { dhis2CalendarsMap } from '../../constants/dhis2CalendarsMap'
import { SupportedCalendar } from '../../types'
import { getCustomCalendarIfExists } from '../../utils/helpers'
import {
    MONTLY_PERIOD_TYPES,
    WEEKLY_PERIOD_TYPES,
    YEARLY_PERIOD_TYPES,
} from '../period-types'
import { PeriodIdentifier } from '../types'
import getFixedPeriodByDateDaily from './get-fixed-period-by-date-daily'
import getFixedPeriodByDateMonthly from './get-fixed-period-by-date-monthly'
import getFixedPeriodByDateWeekly from './get-fixed-period-by-date-weekly'
import getFixedPeriodByDateYearly from './get-fixed-period-by-date-yearly'

const getFixedPeriodByDate = ({
    periodType,
    date,
    calendar: requestedCalendar,
    locale = 'en',
}: {
    periodType: PeriodIdentifier
    date: string
    calendar: SupportedCalendar
    locale?: string
}) => {
    const calendar = getCustomCalendarIfExists(
        dhis2CalendarsMap[requestedCalendar] ?? requestedCalendar
    ) as SupportedCalendar
    const payload = { periodType, date, calendar, locale }

    if (periodType === 'DAILY') {
        return getFixedPeriodByDateDaily(payload)
    }

    if (MONTLY_PERIOD_TYPES.includes(periodType)) {
        return getFixedPeriodByDateMonthly(payload)
    }

    if (WEEKLY_PERIOD_TYPES.includes(periodType)) {
        return getFixedPeriodByDateWeekly(payload)
    }

    if (YEARLY_PERIOD_TYPES.includes(periodType)) {
        return getFixedPeriodByDateYearly(payload)
    }

    throw new Error(
        `can not generate period for unrecognised period type "${periodType}"`
    )
}

export default getFixedPeriodByDate
