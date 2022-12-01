import { Temporal } from "@js-temporal/polyfill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { numberingSystems } from "../constants";
import {
  customCalendars,
  getCustomCalendarLocale,
  getCustomCalendarLocales,
} from "../custom-calendars";
import { SupportedCalendar } from "../types";
import { isCustomCalendar } from "../utils/helpers";
import { useCalendarWeekDays } from "./internal/useCalendarWeekDays";
import {
  useNavigation,
  UseNavigationReturnType,
} from "./internal/useNavigation";
import { useWeekDayLabels } from "./internal/useWeekDayLabels";
import "../date-override";

type DatePickerOptions = {
  date: string;
  options: LocaleOptions;
  onDateSelect: ({
    calendarDate,
    isoDate,
  }: {
    calendarDate: Temporal.ZonedDateTime;
    isoDate: Temporal.ZonedDateTime;
  }) => void;
};

type LocaleOptions = {
  locale: string;
  calendar?: SupportedCalendar;
  timeZone?: Temporal.TimeZoneLike | Temporal.TimeZoneProtocol;
  numberingSystem?: string;
  weekDayFormat?: "narrow" | "short" | "long";
};

export type UseDatePickerReturn = UseNavigationReturnType & {
  weekDayLabels: string[];
  selectedDate: {
    zdt: Temporal.ZonedDateTime | null;
    label: string | undefined;
  };
  today: {
    label: string;
    navigateTo: () => void;
  };
  calendarWeekDays: {
    zdt: Temporal.ZonedDateTime;
    label: string | number;
    onClick: () => void;
    isSelected: boolean | undefined;
    isToday: boolean;
    isInCurrentMonth: boolean;
  }[][];
};

type UseDatePickerHookType = (
  options: DatePickerOptions
) => UseDatePickerReturn;

export const useDatePicker: UseDatePickerHookType = ({
  onDateSelect,
  date,
  options,
}) => {
  const prevDateStringRef = useRef(date);

  const { calendar: calendarFromOptions = "iso8601" } = options;

  const customCalendar = customCalendars[calendarFromOptions]?.calendar;

  const calendar: Temporal.CalendarProtocol | Temporal.CalendarLike =
    customCalendar || options.calendar || "iso8601";

  const isCustom = isCustomCalendar(calendarFromOptions);

  if (isCustom) {
    const customLocalisations = getCustomCalendarLocales(calendar) || {};
    const allowedLocales = Object.keys(customLocalisations);
    if (!allowedLocales.includes(options.locale)) {
      throw new Error(
        `For the custom calendar "${
          options.calendar
        }", only specific locales are allowed: ${allowedLocales.join(", ")}`
      );
    }
  }

  const temporalCalendar = useMemo(
    () => Temporal.Calendar.from(calendar),
    [calendar]
  );
  const temporalTimeZone = useMemo(
    () =>
      Temporal.TimeZone.from(
        options.timeZone ||
          Intl?.DateTimeFormat?.().resolvedOptions?.()?.timeZone ||
          "UTC"
      ),
    [options]
  );

  const todayZdt = useMemo(
    () =>
      Temporal.Now.zonedDateTime(temporalCalendar)
        .withTimeZone(temporalTimeZone)
        .startOfDay(),
    [temporalCalendar, temporalTimeZone]
  );

  const selectedDateZdt = useMemo(
    () =>
      date
        ? Temporal.PlainDate.from(date)
            .toZonedDateTime({
              timeZone: temporalTimeZone,
            })
            .withCalendar(temporalCalendar)
        : null,
    [date, temporalTimeZone, temporalCalendar]
  );

  const [firstZdtOfVisibleMonth, setFirstZdtOfVisibleMonth] = useState(() => {
    const zdt = selectedDateZdt || todayZdt;
    return zdt.with({ day: 1 });
  });

  const { locale } = options;

  const localeOptions = useMemo(
    () => ({
      locale,
      calendar: temporalCalendar,
      timeZone: temporalTimeZone,
      weekDayFormat: options.weekDayFormat || "narrow",
      numberingSystem: options.numberingSystem,
    }),
    [
      locale,
      temporalCalendar,
      temporalTimeZone,
      options.weekDayFormat,
      options.numberingSystem,
    ]
  );

  const weekDayLabels = useWeekDayLabels(localeOptions);

  const navigation = useNavigation(
    firstZdtOfVisibleMonth,
    setFirstZdtOfVisibleMonth,
    localeOptions
  );
  const selectDate = useCallback(
    (zdt: Temporal.ZonedDateTime) => {
      onDateSelect({
        calendarDate: zdt,
        isoDate: zdt.withCalendar("iso8601"),
      });
    },
    [onDateSelect]
  );
  const calendarWeekDaysZdts = useCalendarWeekDays(firstZdtOfVisibleMonth);

  useEffect(() => {
    if (date === prevDateStringRef.current) {
      return;
    }

    prevDateStringRef.current = date;

    if (!date) {
      return;
    }

    const zdt = Temporal.ZonedDateTime.from(date)
      .withCalendar(temporalCalendar)
      .withTimeZone(temporalTimeZone);

    if (
      (firstZdtOfVisibleMonth.year !== zdt.year ||
        firstZdtOfVisibleMonth.month !== zdt.month) &&
      !calendarWeekDaysZdts.some((week) => week.some((day) => day.equals(zdt)))
    ) {
      setFirstZdtOfVisibleMonth(zdt.subtract({ days: zdt.day - 1 }));
    }
  }, [
    date,
    firstZdtOfVisibleMonth,
    calendarWeekDaysZdts,
    temporalCalendar,
    temporalTimeZone,
  ]);

  const customLocale = getCustomCalendarLocale(calendar, locale);

  return {
    selectedDate: {
      zdt: selectedDateZdt,
      label: isCustom
        ? `${selectedDateZdt?.day}-${selectedDateZdt?.month}-${selectedDateZdt?.year}`
        : selectedDateZdt
            ?.toLocaleString(locale, {
              ...localeOptions,
              timeZone: localeOptions.timeZone.id,
              dateStyle: "full",
            })
            .toString(),
    },
    today: {
      label: new window.Intl.RelativeTimeFormat(locale, {
        numeric: "auto",
      }).format(0, "day"),
      navigateTo: () =>
        setFirstZdtOfVisibleMonth(
          todayZdt.subtract({ days: todayZdt.day - 1 })
        ),
    },
    calendarWeekDays: calendarWeekDaysZdts.map((week) =>
      week.map((zdt) => ({
        zdt,
        label: isCustom
          ? customLocale?.numbers?.[zdt.day] || zdt.day
          : zdt.toInstant().toLocaleString(locale, {
              ...localeOptions,
              numberingSystem: numberingSystems.includes(
                options.numberingSystem as typeof numberingSystems[number]
              )
                ? options.numberingSystem
                : undefined,
              day: "numeric",
            }),
        onClick: () => selectDate(zdt),
        isSelected: selectedDateZdt
          ?.withCalendar("iso8601")
          .equals(zdt.withCalendar("iso8601")),
        isToday: todayZdt && zdt.equals(todayZdt),
        isInCurrentMonth:
          firstZdtOfVisibleMonth && zdt.month === firstZdtOfVisibleMonth.month,
      }))
    ),
    ...navigation,
    weekDayLabels,
  };
};
