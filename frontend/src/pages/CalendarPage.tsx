import { useState, FormEvent, useEffect, useRef } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  subDays,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  useTodayCalendarTasks,
  useToggleCalendarEvent,
} from '@/hooks/useCalendar.ts'
import type { CalendarEvent, CalendarEventType } from '@/types'
import { Button } from '@/components/ui/Button.tsx'
import styles from './CalendarPage.module.css'

type ViewMode = 'month' | 'week' | 'day'

const EVENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9',
]

function toLocalDatetimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toLocalDateValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

interface EventModalProps {
  initial?: Partial<CalendarEvent> & { defaultDate?: Date }
  onClose: () => void
  onSave: (data: {
    id?: string
    title: string
    description?: string
    startAt: string
    endAt?: string
    allDay: boolean
    color: string
    type: CalendarEventType
  }) => void
  onDelete?: (id: string) => void
  saving?: boolean
}

function EventModal({ initial, onClose, onSave, onDelete, saving }: EventModalProps) {
  const defaultDate = initial?.defaultDate ?? new Date()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [allDay, setAllDay] = useState(initial?.allDay ?? false)
  const [color, setColor] = useState(initial?.color ?? EVENT_COLORS[0])
  const [type, setType] = useState<CalendarEventType>(initial?.type ?? 'EVENT')
  const [startAt, setStartAt] = useState(() => {
    if (initial?.startAt) return toLocalDatetimeValue(parseISO(initial.startAt))
    const d = new Date(defaultDate)
    d.setHours(9, 0, 0, 0)
    return toLocalDatetimeValue(d)
  })
  const [endAt, setEndAt] = useState(() => {
    if (initial?.endAt) return toLocalDatetimeValue(parseISO(initial.endAt))
    if (initial?.startAt) {
      const d = new Date(parseISO(initial.startAt))
      d.setHours(d.getHours() + 1)
      return toLocalDatetimeValue(d)
    }
    const d = new Date(defaultDate)
    d.setHours(10, 0, 0, 0)
    return toLocalDatetimeValue(d)
  })
  const [startDate, setStartDate] = useState(() => {
    if (initial?.startAt) return toLocalDateValue(parseISO(initial.startAt))
    return toLocalDateValue(defaultDate)
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const startIso = allDay
      ? new Date(startDate + 'T00:00:00').toISOString()
      : new Date(startAt).toISOString()
    const endIso = allDay ? undefined : new Date(endAt).toISOString()
    onSave({ id: initial?.id, title, description: description || undefined, startAt: startIso, endAt: endIso, allDay, color, type })
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{initial?.id ? 'Редактировать' : 'Новое мероприятие'}</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.field}>
            <label className={styles.label}>Название</label>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название мероприятия"
              required
              autoFocus
            />
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              Весь день
            </label>
            <div className={styles.typeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${type === 'EVENT' ? styles.typeBtnActive : ''}`}
                onClick={() => setType('EVENT')}
              >
                Мероприятие
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${type === 'TASK' ? styles.typeBtnActive : ''}`}
                onClick={() => setType('TASK')}
              >
                Задача
              </button>
            </div>
          </div>

          {allDay ? (
            <div className={styles.field}>
              <label className={styles.label}>Дата</label>
              <input
                className={styles.input}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className={styles.fieldRow2}>
              <div className={styles.field}>
                <label className={styles.label}>Начало</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Конец</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Описание <span className={styles.optional}>(необязательно)</span></label>
            <textarea
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавить описание…"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Цвет</label>
            <div className={styles.colorPicker}>
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorDot} ${color === c ? styles.colorDotActive : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            {initial?.id && onDelete && (
              <Button type="button" variant="ghost" onClick={() => onDelete(initial.id!)} style={{ marginRight: 'auto', color: 'var(--red, #ef4444)' }}>
                Удалить
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
            <Button type="submit" loading={saving}>
              {initial?.id ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Today Progress Bar ────────────────────────────────────────────────────

function TodayProgress() {
  const { data: todayTasks = [] } = useTodayCalendarTasks()
  const toggleDone = useToggleCalendarEvent()

  const total = todayTasks.length
  const done = todayTasks.filter((t) => t.completed).length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  const [displayPct, setDisplayPct] = useState(0)
  const prevPct = useRef(0)

  useEffect(() => {
    let frame: number
    let start: number | null = null
    const from = prevPct.current
    const to = pct
    const duration = 700

    function step(ts: number) {
      if (!start) start = ts
      const elapsed = ts - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayPct(Math.round(from + (to - from) * eased))
      if (t < 1) frame = requestAnimationFrame(step)
      else prevPct.current = to
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [pct])

  const figure = displayPct === 0 ? '🧍' : displayPct === 100 ? '🎉' : '🏃'
  const isRunning = displayPct > 0 && displayPct < 100

  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>Мои задачи сегодня</span>
        <span className={styles.progressCount}>
          {total === 0 ? 'Нет задач на сегодня' : `${done} / ${total} выполнено`}
        </span>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${displayPct}%` }} />
        <span
          className={`${styles.progressFigure} ${isRunning ? styles.progressFigureRun : ''} ${displayPct === 100 ? styles.progressFigureWin : ''}`}
          style={{ left: `clamp(0px, calc(${displayPct}% - 14px), calc(100% - 28px))` }}
        >
          {figure}
        </span>
      </div>
      <div className={styles.progressBottom}>
        <span className={styles.progressPct}>{displayPct}%</span>
        {total > 0 && (
          <div className={styles.taskCheckList}>
            {todayTasks.map((t) => (
              <button
                key={t.id}
                className={`${styles.taskCheckItem} ${t.completed ? styles.taskCheckItemDone : ''}`}
                onClick={() => toggleDone.mutate(t.id)}
                title={t.completed ? 'Отметить не выполненной' : 'Отметить выполненной'}
              >
                <span className={styles.taskCheckCircle}>{t.completed ? '✓' : ''}</span>
                <span className={styles.taskCheckTitle}>{t.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function CalendarPage() {
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState(new Date())
  const [modal, setModal] = useState<{
    open: boolean
    event?: Partial<CalendarEvent> & { defaultDate?: Date }
  }>({ open: false })

  // Compute query range from cursor + view
  const { from, to } = (() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
      const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
      return { from: start.toISOString(), to: end.toISOString() }
    }
    if (view === 'week') {
      const start = startOfWeek(cursor, { weekStartsOn: 1 })
      const end = endOfWeek(cursor, { weekStartsOn: 1 })
      return { from: start.toISOString(), to: end.toISOString() }
    }
    return { from: startOfDay(cursor).toISOString(), to: endOfDay(cursor).toISOString() }
  })()

  const { data: events = [], isLoading } = useCalendarEvents(from, to)
  const create = useCreateCalendarEvent(from, to)
  const update = useUpdateCalendarEvent(from, to)
  const remove = useDeleteCalendarEvent()
  const toggleDone = useToggleCalendarEvent()

  function navigate(dir: 1 | -1) {
    if (view === 'month') setCursor(dir === 1 ? addMonths(cursor, 1) : subMonths(cursor, 1))
    else if (view === 'week') setCursor(dir === 1 ? addWeeks(cursor, 1) : subWeeks(cursor, 1))
    else setCursor(dir === 1 ? addDays(cursor, 1) : subDays(cursor, 1))
  }

  function handleSave(data: Parameters<EventModalProps['onSave']>[0]) {
    if (data.id) {
      update.mutate({ ...data, id: data.id }, { onSuccess: () => setModal({ open: false }) })
    } else {
      create.mutate(data, { onSuccess: () => setModal({ open: false }) })
    }
  }

  function handleDelete(id: string) {
    remove.mutate(id, { onSuccess: () => setModal({ open: false }) })
  }

  function eventsForDay(day: Date) {
    return events.filter((e) => isSameDay(parseISO(e.startAt), day))
  }

  const headerTitle = (() => {
    if (view === 'month') return format(cursor, 'LLLL yyyy', { locale: ru })
    if (view === 'week') {
      const start = startOfWeek(cursor, { weekStartsOn: 1 })
      const end = endOfWeek(cursor, { weekStartsOn: 1 })
      return `${format(start, 'd MMM', { locale: ru })} — ${format(end, 'd MMM yyyy', { locale: ru })}`
    }
    return format(cursor, 'd MMMM yyyy', { locale: ru })
  })()

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Календарь</h1>
          <button className={styles.todayBtn} onClick={() => setCursor(new Date())}>
            Сегодня
          </button>
          <div className={styles.navBtns}>
            <button className={styles.navBtn} onClick={() => navigate(-1)}>‹</button>
            <button className={styles.navBtn} onClick={() => navigate(1)}>›</button>
          </div>
          <span className={styles.periodLabel}>{headerTitle}</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
              <button
                key={v}
                className={`${styles.viewBtn} ${view === v ? styles.viewBtnActive : ''}`}
                onClick={() => setView(v)}
              >
                {v === 'month' ? 'Месяц' : v === 'week' ? 'Неделя' : 'День'}
              </button>
            ))}
          </div>
          <Button onClick={() => setModal({ open: true })}>+ Событие</Button>
        </div>
      </div>

      <TodayProgress />

      {isLoading ? (
        <div className={styles.loading}>Загрузка…</div>
      ) : view === 'month' ? (
        <MonthView
          cursor={cursor}
          eventsForDay={eventsForDay}
          onDayClick={(day) => setModal({ open: true, event: { defaultDate: day } })}
          onEventClick={(ev) => setModal({ open: true, event: ev })}
          onToggleComplete={(id) => toggleDone.mutate(id)}
        />
      ) : view === 'week' ? (
        <WeekView
          cursor={cursor}
          eventsForDay={eventsForDay}
          onDayClick={(day) => setModal({ open: true, event: { defaultDate: day } })}
          onEventClick={(ev) => setModal({ open: true, event: ev })}
          onToggleComplete={(id) => toggleDone.mutate(id)}
        />
      ) : (
        <DayView
          cursor={cursor}
          events={eventsForDay(cursor)}
          onSlotClick={(hour) => {
            const d = new Date(cursor)
            d.setHours(hour, 0, 0, 0)
            setModal({ open: true, event: { defaultDate: d } })
          }}
          onEventClick={(ev) => setModal({ open: true, event: ev })}
          onToggleComplete={(id) => toggleDone.mutate(id)}
        />
      )}

      {modal.open && (
        <EventModal
          initial={modal.event}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={create.isPending || update.isPending}
        />
      )}
    </div>
  )
}

// ─── Month View ────────────────────────────────────────────────────────────

interface MonthViewProps {
  cursor: Date
  eventsForDay: (day: Date) => CalendarEvent[]
  onDayClick: (day: Date) => void
  onEventClick: (ev: CalendarEvent) => void
  onToggleComplete: (id: string) => void
}

function MonthView({ cursor, eventsForDay, onDayClick, onEventClick, onToggleComplete }: MonthViewProps) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })

  const days: Date[] = []
  let d = start
  while (d <= end) { days.push(d); d = addDays(d, 1) }

  const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const [popover, setPopover] = useState<{ day: Date; rect: DOMRect } | null>(null)

  function openPopover(e: React.MouseEvent, day: Date) {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopover({ day, rect })
  }

  return (
    <>
      <div className={styles.monthGrid}>
        {DOW.map((label) => (
          <div key={label} className={styles.dowHeader}>{label}</div>
        ))}
        {days.map((day) => {
          const dayEvents = eventsForDay(day)
          const outside = !isSameMonth(day, cursor)
          const today = isToday(day)
          return (
            <div
              key={day.toISOString()}
              className={`${styles.dayCell} ${outside ? styles.dayCellOutside : ''} ${today ? styles.dayCellToday : ''}`}
              onClick={() => onDayClick(day)}
            >
              <span className={`${styles.dayNum} ${today ? styles.dayNumToday : ''}`}>
                {format(day, 'd')}
              </span>
              <div className={styles.dayEvents}>
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className={`${styles.eventChip} ${ev.type === 'TASK' ? styles.eventChipTask : ''} ${ev.completed ? styles.eventChipDone : ''}`}
                    style={{ background: ev.color + '33', borderLeft: `3px solid ${ev.color}`, color: ev.completed ? 'var(--text-3)' : ev.color }}
                  >
                    {ev.type === 'TASK' && (
                      <button
                        className={`${styles.chipCheck} ${ev.completed ? styles.chipCheckDone : ''}`}
                        style={{ borderColor: ev.color, background: ev.completed ? ev.color : 'transparent' }}
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(ev.id) }}
                        title={ev.completed ? 'Снять отметку' : 'Выполнено'}
                      >
                        {ev.completed && '✓'}
                      </button>
                    )}
                    <span
                      className={styles.chipText}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                    >
                      {ev.allDay ? '' : format(parseISO(ev.startAt), 'HH:mm') + ' '}
                      {ev.title}
                    </span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <button
                    className={styles.moreEvents}
                    onClick={(e) => openPopover(e, day)}
                  >
                    +{dayEvents.length - 3} ещё
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {popover && (
        <DayPopover
          day={popover.day}
          events={eventsForDay(popover.day)}
          anchorRect={popover.rect}
          onClose={() => setPopover(null)}
          onEventClick={(ev) => { setPopover(null); onEventClick(ev) }}
          onToggleComplete={onToggleComplete}
          onAddClick={() => { setPopover(null); onDayClick(popover.day) }}
        />
      )}
    </>
  )
}

// ─── Day Popover ────────────────────────────────────────────────────────────

interface DayPopoverProps {
  day: Date
  events: CalendarEvent[]
  anchorRect: DOMRect
  onClose: () => void
  onEventClick: (ev: CalendarEvent) => void
  onToggleComplete: (id: string) => void
  onAddClick: () => void
}

function DayPopover({ day, events, anchorRect, onClose, onEventClick, onToggleComplete, onAddClick }: DayPopoverProps) {
  const popRef = useRef<HTMLDivElement>(null)

  // Position: prefer below the anchor cell, flip up if near bottom
  const style: React.CSSProperties = (() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = 260
    const spaceBelow = vh - anchorRect.bottom
    const spaceAbove = anchorRect.top

    let top: number
    let left = Math.min(anchorRect.left, vw - w - 12)
    left = Math.max(left, 8)

    if (spaceBelow >= 280 || spaceBelow >= spaceAbove) {
      top = anchorRect.bottom + 6
    } else {
      top = anchorRect.top - 6  // will use transform translateY(-100%)
      return { top, left, width: w, transform: 'translateY(-100%)' }
    }
    return { top, left, width: w }
  })()

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const tasks = events.filter((e) => e.type === 'TASK')
  const evts  = events.filter((e) => e.type === 'EVENT')

  return (
    <div ref={popRef} className={styles.dayPopover} style={style}>
      <div className={styles.dayPopoverHeader}>
        <span className={styles.dayPopoverDate}>{format(day, 'd MMMM', { locale: ru })}</span>
        <div className={styles.dayPopoverActions}>
          <button className={styles.dayPopoverAdd} onClick={onAddClick} title="Добавить событие">+</button>
          <button className={styles.dayPopoverClose} onClick={onClose}>✕</button>
        </div>
      </div>

      <div className={styles.dayPopoverBody}>
        {events.length === 0 && (
          <p className={styles.dayPopoverEmpty}>Нет событий</p>
        )}

        {evts.length > 0 && (
          <div className={styles.dayPopoverSection}>
            <span className={styles.dayPopoverSectionLabel}>Мероприятия</span>
            {evts.map((ev) => (
              <button
                key={ev.id}
                className={styles.dayPopoverItem}
                style={{ borderLeft: `3px solid ${ev.color}` }}
                onClick={() => onEventClick(ev)}
              >
                <span className={styles.dayPopoverItemTime}>
                  {ev.allDay ? 'Весь день' : format(parseISO(ev.startAt), 'HH:mm')}
                  {ev.endAt && !ev.allDay ? '–' + format(parseISO(ev.endAt), 'HH:mm') : ''}
                </span>
                <span className={styles.dayPopoverItemTitle}>{ev.title}</span>
              </button>
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div className={styles.dayPopoverSection}>
            <span className={styles.dayPopoverSectionLabel}>Задачи</span>
            {tasks.map((ev) => (
              <div
                key={ev.id}
                className={`${styles.dayPopoverItem} ${ev.completed ? styles.dayPopoverItemDone : ''}`}
                style={{ borderLeft: `3px solid ${ev.color}` }}
              >
                <button
                  className={`${styles.dayPopoverCheck} ${ev.completed ? styles.dayPopoverCheckDone : ''}`}
                  style={{ borderColor: ev.color, background: ev.completed ? ev.color : 'transparent' }}
                  onClick={(e) => { e.stopPropagation(); onToggleComplete(ev.id) }}
                >
                  {ev.completed && '✓'}
                </button>
                <div className={styles.dayPopoverItemContent} onClick={() => onEventClick(ev)}>
                  <span className={styles.dayPopoverItemTime}>
                    {ev.allDay ? 'Весь день' : format(parseISO(ev.startAt), 'HH:mm')}
                  </span>
                  <span className={styles.dayPopoverItemTitle}>{ev.title}</span>
                  {ev.description && (
                    <span className={styles.dayPopoverItemDesc}>{ev.description}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Week View ─────────────────────────────────────────────────────────────

interface WeekViewProps {
  cursor: Date
  eventsForDay: (day: Date) => CalendarEvent[]
  onDayClick: (day: Date) => void
  onEventClick: (ev: CalendarEvent) => void
  onToggleComplete: (id: string) => void
}

function WeekView({ cursor, eventsForDay, onDayClick, onEventClick, onToggleComplete }: WeekViewProps) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  return (
    <div className={styles.weekGrid}>
      {days.map((day) => {
        const dayEvents = eventsForDay(day)
        const today = isToday(day)
        return (
          <div key={day.toISOString()} className={`${styles.weekCol} ${today ? styles.weekColToday : ''}`}>
            <div className={styles.weekDayHeader} onClick={() => onDayClick(day)}>
              <span className={styles.weekDow}>{format(day, 'EEE', { locale: ru })}</span>
              <span className={`${styles.weekDayNum} ${today ? styles.dayNumToday : ''}`}>
                {format(day, 'd')}
              </span>
            </div>
            <div className={styles.weekEvents}>
              {dayEvents.map((ev) => (
                <button
                  key={ev.id}
                  className={`${styles.weekEventChip} ${ev.type === 'TASK' ? styles.eventChipTask : ''} ${ev.completed ? styles.eventChipDone : ''}`}
                  style={{ background: ev.color + '22', borderLeft: `3px solid ${ev.color}`, color: ev.completed ? 'var(--text-3)' : ev.color }}
                  onClick={() => onEventClick(ev)}
                >
                  <div className={styles.weekEventTop}>
                    {ev.type === 'TASK' && (
                      <button
                        className={`${styles.chipCheck} ${ev.completed ? styles.chipCheckDone : ''}`}
                        style={{ borderColor: ev.color, background: ev.completed ? ev.color : 'transparent' }}
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(ev.id) }}
                        title={ev.completed ? 'Снять отметку' : 'Выполнено'}
                      >
                        {ev.completed && '✓'}
                      </button>
                    )}
                    {!ev.allDay && (
                      <span className={styles.weekEventTime}>{format(parseISO(ev.startAt), 'HH:mm')}</span>
                    )}
                  </div>
                  <span className={styles.weekEventTitle}>{ev.title}</span>
                </button>
              ))}
              <button className={styles.addEventBtn} onClick={() => onDayClick(day)}>+</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Day View ──────────────────────────────────────────────────────────────

interface DayViewProps {
  cursor: Date
  events: CalendarEvent[]
  onSlotClick: (hour: number) => void
  onEventClick: (ev: CalendarEvent) => void
  onToggleComplete: (id: string) => void
}

function DayView({ cursor, events, onSlotClick, onEventClick, onToggleComplete }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  function eventsForHour(hour: number) {
    return events.filter((e) => !e.allDay && parseISO(e.startAt).getHours() === hour)
  }

  const allDayEvents = events.filter((e) => e.allDay)

  return (
    <div className={styles.dayView}>
      {allDayEvents.length > 0 && (
        <div className={styles.allDayRow}>
          <span className={styles.allDayLabel}>Весь день</span>
          <div className={styles.allDayEvents}>
            {allDayEvents.map((ev) => (
              <div
                key={ev.id}
                className={`${styles.weekEventChip} ${ev.completed ? styles.eventChipDone : ''}`}
                style={{ background: ev.color + '22', borderLeft: `3px solid ${ev.color}`, color: ev.completed ? 'var(--text-3)' : ev.color }}
              >
                {ev.type === 'TASK' && (
                  <button
                    className={`${styles.chipCheck} ${ev.completed ? styles.chipCheckDone : ''}`}
                    style={{ borderColor: ev.color, background: ev.completed ? ev.color : 'transparent' }}
                    onClick={(e) => { e.stopPropagation(); onToggleComplete(ev.id) }}
                  >
                    {ev.completed && '✓'}
                  </button>
                )}
                <span onClick={() => onEventClick(ev)}>{ev.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={styles.dayHours}>
        {hours.map((hour) => {
          const slotEvents = eventsForHour(hour)
          const now = new Date()
          const isCurrent = isToday(cursor) && now.getHours() === hour
          return (
            <div
              key={hour}
              className={`${styles.hourRow} ${isCurrent ? styles.hourRowCurrent : ''}`}
              onClick={() => onSlotClick(hour)}
            >
              <span className={styles.hourLabel}>{String(hour).padStart(2, '0')}:00</span>
              <div className={styles.hourSlot}>
                {slotEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`${styles.dayEventBlock} ${ev.completed ? styles.eventChipDone : ''}`}
                    style={{ background: ev.color + '22', borderLeft: `3px solid ${ev.color}`, color: ev.completed ? 'var(--text-3)' : ev.color }}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                  >
                    <div className={styles.dayEventHeader}>
                      {ev.type === 'TASK' && (
                        <button
                          className={`${styles.chipCheck} ${ev.completed ? styles.chipCheckDone : ''}`}
                          style={{ borderColor: ev.color, background: ev.completed ? ev.color : 'transparent' }}
                          onClick={(e) => { e.stopPropagation(); onToggleComplete(ev.id) }}
                          title={ev.completed ? 'Снять отметку' : 'Выполнено'}
                        >
                          {ev.completed && '✓'}
                        </button>
                      )}
                      <span className={styles.dayEventTime}>{format(parseISO(ev.startAt), 'HH:mm')}{ev.endAt ? ' – ' + format(parseISO(ev.endAt), 'HH:mm') : ''}</span>
                    </div>
                    <span>{ev.title}</span>
                    {ev.description && <span className={styles.dayEventDesc}>{ev.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
