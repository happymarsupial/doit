import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import {
  useCalendars,
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
  type CalendarEvent,
} from "@doit/core-data";
import { Button, IconButton, Input, Modal } from "@doit/design-system";
import { TimeGrid } from "./TimeGrid";
import "./calendar.css";

type CalendarView = "day" | "week" | "month";

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const { data: calendars } = useCalendars();
  const defaultCalendarId = calendars?.find((c) => c.isDefault)?.id ?? calendars?.[0]?.id;
  const calendarColor = calendars?.find((c) => c.id === defaultCalendarId)?.color ?? "#4f6df5";

  const { rangeStart, rangeEnd, title } = useMemo(() => {
    if (view === "day") {
      return {
        rangeStart: startOfDay(cursor),
        rangeEnd: endOfDay(cursor),
        title: format(cursor, "EEEE d 'de' MMMM", { locale: es }),
      };
    }
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      const end = endOfWeek(cursor, { weekStartsOn: 1 });
      return {
        rangeStart: start,
        rangeEnd: end,
        title: `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`,
      };
    }
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    return {
      rangeStart: startOfWeek(monthStart, { weekStartsOn: 1 }),
      rangeEnd: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      title: format(cursor, "MMMM yyyy", { locale: es }),
    };
  }, [view, cursor]);

  const days = useMemo(
    () => eachDayOfInterval({ start: rangeStart, end: rangeEnd }),
    [rangeStart.getTime(), rangeEnd.getTime()],
  );

  const { data: events } = useEvents(rangeStart.toISOString(), rangeEnd.toISOString());
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [composerStart, setComposerStart] = useState<Date | null>(null);
  const [composerTitle, setComposerTitle] = useState("");
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  function eventsForDay(day: Date) {
    return (events ?? []).filter((e) => isSameDay(new Date(e.startAt), day));
  }

  function openComposerForDay(day: Date) {
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    setComposerStart(start);
    setComposerTitle("");
  }

  function openComposerForSlot(day: Date, hour: number) {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    setComposerStart(start);
    setComposerTitle("");
  }

  function submitComposer() {
    if (!composerStart || !composerTitle.trim() || !defaultCalendarId) return;
    const end = new Date(composerStart);
    end.setHours(end.getHours() + 1);
    createEvent.mutate({
      calendarId: defaultCalendarId,
      title: composerTitle.trim(),
      startAt: composerStart.toISOString(),
      endAt: end.toISOString(),
      allDay: false,
    });
    setComposerStart(null);
    setComposerTitle("");
  }

  function submitEdit() {
    if (!editing) return;
    updateEvent.mutate({ id: editing.id, patch: { title: editingTitle.trim() } });
    setEditing(null);
  }

  function navigate(dir: 1 | -1) {
    if (view === "day") setCursor((d) => addDays(d, dir));
    else if (view === "week") setCursor((d) => addWeeks(d, dir));
    else setCursor((d) => addMonths(d, dir));
  }

  return (
    <div className="calendar-page">
      <header className="calendar-header">
        <h1>{title}</h1>
        <div className="calendar-header-actions">
          <div className="calendar-view-switch">
            {(["day", "week", "month"] as const).map((v) => (
              <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
                {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          <IconButton onClick={() => navigate(-1)} aria-label="Anterior">
            <ChevronLeft size={18} />
          </IconButton>
          <Button variant="secondary" onClick={() => setCursor(new Date())}>
            Hoy
          </Button>
          <IconButton onClick={() => navigate(1)} aria-label="Siguiente">
            <ChevronRight size={18} />
          </IconButton>
        </div>
      </header>

      {view === "month" && (
        <>
          <div className="calendar-weekdays">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((day) => {
              const dayEvents = eventsForDay(day);
              const muted = !isSameMonth(day, cursor);
              return (
                <div key={day.toISOString()} className={`calendar-cell ${muted ? "muted" : ""}`}>
                  <div className="calendar-cell-header">
                    <span className={`calendar-day-number ${isToday(day) ? "today" : ""}`}>
                      {format(day, "d")}
                    </span>
                    <IconButton onClick={() => openComposerForDay(day)} aria-label="Agregar evento">
                      <Plus size={14} />
                    </IconButton>
                  </div>
                  <div className="calendar-events">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        className="calendar-event-pill"
                        style={{ background: ev.colorOverride ?? calendarColor }}
                        onClick={() => {
                          setEditing(ev);
                          setEditingTitle(ev.title);
                        }}
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {(view === "day" || view === "week") && (
        <TimeGrid
          days={days}
          events={events ?? []}
          calendarColor={calendarColor}
          onSlotClick={openComposerForSlot}
          onEventClick={(ev) => {
            setEditing(ev);
            setEditingTitle(ev.title);
          }}
        />
      )}

      {composerStart && (
        <Modal onClose={() => setComposerStart(null)}>
          <div className="ds-modal-header">
            <strong>{format(composerStart, "EEEE d 'de' MMMM, HH:mm", { locale: es })}</strong>
            <IconButton onClick={() => setComposerStart(null)} aria-label="Cerrar">
              <X size={16} />
            </IconButton>
          </div>
          <Input
            autoFocus
            placeholder="Título del evento"
            value={composerTitle}
            onChange={(e) => setComposerTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComposer()}
          />
          <Button onClick={submitComposer}>Crear evento</Button>
        </Modal>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="ds-modal-header">
            <strong>Editar evento</strong>
            <IconButton onClick={() => setEditing(null)} aria-label="Cerrar">
              <X size={16} />
            </IconButton>
          </div>
          <Input
            autoFocus
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitEdit()}
          />
          <div className="ds-modal-actions">
            <Button onClick={submitEdit}>Guardar</Button>
            <Button
              variant="secondary"
              onClick={() => {
                deleteEvent.mutate(editing.id);
                setEditing(null);
              }}
            >
              Borrar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
