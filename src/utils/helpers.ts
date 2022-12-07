import { Temporal } from "@js-temporal/polyfill";
import { customCalendars, CustomCalendarTypes } from "../custom-calendars";
import { SupportedCalendar } from "../types";

export const isCustomCalendar = (calendar: SupportedCalendar) =>
  !!customCalendars[calendar as CustomCalendarTypes];

export const padWithZeroes = (number: number, count = 2) =>
  String(number).padStart(count, "0");

export const capitalize = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

export const getCustomCalendarIfExists = (
  calendar: SupportedCalendar,
  locale: string
): Temporal.CalendarProtocol | Temporal.CalendarLike => {
  const isCustom = isCustomCalendar(calendar);
  if (!isCustom) {
    return calendar;
  }

  const customCalendar = customCalendars[
    calendar as keyof typeof customCalendars
  ]?.calendar as Temporal.CalendarProtocol;

  if (!customCalendar) {
    throw new Error(`No implemenation found for custom calendar ${calendar}`);
  }

  const customLocalisations =
    customCalendars[calendar as CustomCalendarTypes]?.locales || {};
  const allowedLocales = Object.keys(customLocalisations);
  if (!allowedLocales.includes(locale)) {
    throw new Error(
      `For the custom calendar "${calendar}", only specific locales are allowed: ${allowedLocales.join(
        ", "
      )}`
    );
  }
  return customCalendar;
};
