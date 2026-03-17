import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api.ts'
import type { CalendarEvent, CalendarEventType } from '@/types'

export const calendarKeys = {
  events: (from: string, to: string) => ['calendar', 'events', from, to] as const,
  today: () => ['calendar', 'today-tasks'] as const,
}

export function useTodayCalendarTasks() {
  return useQuery({
    queryKey: calendarKeys.today(),
    queryFn: () => api.get<CalendarEvent[]>('/calendar/today-tasks').then((r) => r.data),
    refetchInterval: 30_000,
  })
}

export function useToggleCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<CalendarEvent>(`/calendar/events/${id}/toggle`).then((r) => r.data),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: calendarKeys.today() })
      const prev = qc.getQueryData<CalendarEvent[]>(calendarKeys.today())
      qc.setQueryData<CalendarEvent[]>(calendarKeys.today(), (old) =>
        old?.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)) ?? []
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(calendarKeys.today(), ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.today() })
      qc.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useCalendarEvents(from: string, to: string) {
  return useQuery({
    queryKey: calendarKeys.events(from, to),
    queryFn: () =>
      api.get<CalendarEvent[]>(`/calendar/events?from=${from}&to=${to}`).then((r) => r.data),
    enabled: !!from && !!to,
  })
}

export interface CalendarEventInput {
  title: string
  description?: string
  startAt: string
  endAt?: string
  allDay?: boolean
  color?: string
  type?: CalendarEventType
}

export function useCreateCalendarEvent(_from?: string, _to?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CalendarEventInput) =>
      api.post<CalendarEvent>('/calendar/events', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  })
}

export function useUpdateCalendarEvent(_from?: string, _to?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: CalendarEventInput & { id: string }) =>
      api.patch<CalendarEvent>(`/calendar/events/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  })
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/calendar/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  })
}
