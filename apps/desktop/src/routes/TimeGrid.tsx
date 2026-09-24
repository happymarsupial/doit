import type { CalendarEvent } from "@doit/core-data";
import { format, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function minutesFromMidnight(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function TimeGrid({
  days,
  events,
  calendarColor,
  onSlotClick,
  onEventClick,
}: {
  days: Date[];
  events: CalendarEvent[];
  calendarColor: string;
  onSlotClick: (day: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  return (
    <div className="timegrid">
      <div className="timegrid-header">
        <div className="timegrid-gutter" />
        {days.map((day) => (
          <div key={day.toISOString()} className="timegrid-day-header">
            <span className="timegrid-weekday">{format(day, "EEE", { locale: es })}</span>
            <span className={`timegrid-daynum ${isToday(day) ? "today" : ""}`}>{format(day, "d")}</span>
          </div>
        ))}
      </div>
      <div className="timegrid-body">
        <div className="timegrid-gutter">
          {HOURS.map((h) => (
            <div key={h} className="timegrid-hour-label">
              {h === 0 ? "" : `${h}:00`}
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startAt), day) && !e.allDay);
          const allDayEvents = events.filter((e) => isSameDay(new Date(e.startAt), day) && e.allDay);
          return (
            <div key={day.toISOString()} className="timegrid-day-column">
              {allDayEvents.map((ev) => (
                <button
                  key={ev.id}
                  className="timegrid-allday-pill"
                  style={{ background: ev.colorOverride ?? calendarColor }}
                  onClick={() => onEventClick(ev)}
                >
                  {ev.title}
                </button>
              ))}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="timegrid-hour-slot"
                  style={{ height: HOUR_HEIGHT }}
                  onClick={() => onSlotClick(day, h)}
                />
              ))}
              {dayEvents.map((ev) => {
                const start = minutesFromMidnight(ev.startAt);
                const end = Math.max(minutesFromMidnight(ev.endAt), start + 20);
                const top = (start / 60) * HOUR_HEIGHT;
                const height = ((end - start) / 60) * HOUR_HEIGHT;
                return (
                  <button
                    key={ev.id}
                    className="timegrid-event"
                    style={{
                      top,
                      height,
                      background: ev.colorOverride ?? calendarColor,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                  >
                    {ev.title}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
