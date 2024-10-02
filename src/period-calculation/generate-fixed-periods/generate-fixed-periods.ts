import { dhis2CalendarsMap } from '../../constants/dhis2CalendarsMap'
import { SupportedCalendar } from '../../types'
import getValidLocale from '../../utils/getValidLocale'
import { fromAnyDate, getCustomCalendarIfExists } from '../../utils/index'
import {
    monthlyFixedPeriodTypes,
    weeklyFixedPeriodTypes,
    yearlyFixedPeriodTypes,
} from '../period-type-groups'
import { FixedPeriod, PeriodType } from '../types'
import generateFixedPeriodsDaily from './generate-fixed-periods-daily'
import generateFixedPeriodsMonthly from './generate-fixed-periods-monthly'
import generateFixedPeriodsWeekly from './generate-fixed-periods-weekly'
import generateFixedPeriodsYearly from './generate-fixed-periods-yearly'

type GenerateFixedPeriods = (options: {
    year: number
    periodType: PeriodType
    calendar: SupportedCalendar
    locale?: string
    startingDay?: number /** 1 is Monday */
    yearsCount?: number | null
    endsBefore?: string
}) => Array<FixedPeriod>

/**
 * @param {Object} options
 * @param {string} [options.endsBefore] - Excludes all periods that end on or
 * after the provided date. This will help generating periods up to a certain
 * point (e.g. "now" or "in two weeks" when two open future periods are
 * allowed, like in the aggregate data entry app)
 */
const generateFixedPeriods: GenerateFixedPeriods = ({
    periodType,
    year: yearString,
    endsBefore: _endsBefore,
    calendar: requestedCalendar,
    locale = 'en',
    yearsCount = 10,
    startingDay = 1,
}) => {
    let year: number
    if (typeof yearString === 'number') {
        year = yearString
    } else {
        if (!isNaN(yearString) && !isNaN(parseInt(yearString))) {
            year = parseInt(yearString)
        } else {
            throw new Error('year must be a number')
        }
    }

    const calendar = getCustomCalendarIfExists(
        dhis2CalendarsMap[requestedCalendar] ?? requestedCalendar
    ) as SupportedCalendar

    const validLocale = getValidLocale(locale) ?? 'en'

    const endsBefore = _endsBefore
        ? fromAnyDate({ calendar, date: _endsBefore })
        : undefined

    if (weeklyFixedPeriodTypes.includes(periodType)) {
        return generateFixedPeriodsWeekly({
            year,
            periodType,
            calendar,
            startingDay,
            endsBefore,
        })
    }

    if (yearlyFixedPeriodTypes.includes(periodType)) {
        return generateFixedPeriodsYearly({
            year,
            periodType,
            locale: validLocale,
            calendar,
            endsBefore,
            yearsCount,
        })
    }

    if (monthlyFixedPeriodTypes.includes(periodType)) {
        return generateFixedPeriodsMonthly({
            year,
            periodType,
            locale: validLocale,
            calendar,
            endsBefore,
        })
    }

    if (periodType === 'DAILY') {
        return generateFixedPeriodsDaily({
            year,
            locale: validLocale,
            calendar,
            endsBefore,
        })
    }

    throw new Error(
        `can not generate period for unrecognised period type "${periodType}"`
    )
}

export default generateFixedPeriods
