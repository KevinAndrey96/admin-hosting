'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { DatesSetArg } from '@fullcalendar/core';

function getEvents() {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };
  return [
    { title: 'All Day Event', start: fmt(now) },
    { title: 'Long Event', start: fmt(addDays(now, 1)), end: fmt(addDays(now, 4)) },
    { title: 'Repeating Event', start: fmt(addDays(now, 2)) + 'T16:00:00' },
    { title: 'Conference', start: fmt(addDays(now, 5)), end: fmt(addDays(now, 7)) },
    { title: 'Meeting', start: fmt(addDays(now, 3)) + 'T10:30:00', end: fmt(addDays(now, 3)) + 'T12:30:00' },
    { title: 'Lunch', start: fmt(addDays(now, 3)) + 'T12:00:00' },
    { title: 'Happy Hour', start: fmt(addDays(now, 3)) + 'T17:30:00' },
    { title: 'Birthday Party', start: fmt(addDays(now, 4)) + 'T07:00:00' },
  ];
}

const plugins = [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin];

interface CalendarClientProps {
  onDatesSet?: (arg: DatesSetArg) => void;
}

export default function CalendarClient({ onDatesSet }: CalendarClientProps) {
  return (
    <FullCalendar
      plugins={plugins}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
      }}
      initialDate={new Date().toISOString().slice(0, 10)}
      navLinks
      editable
      dayMaxEvents
      events={getEvents()}
      datesSet={onDatesSet}
    />
  );
}
