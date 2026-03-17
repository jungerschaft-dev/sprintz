import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api.ts'
import type { Task, TaskStatus, Priority } from '@/types'

export const taskKeys = {
  bySprint: (sprintId: string) => ['tasks', 'sprint', sprintId] as const,
  detail: (id: string) => ['tasks', id] as const,
}

export function useSprintTasks(sprintId: string) {
  return useQuery({
    queryKey: taskKeys.bySprint(sprintId),
    queryFn: () => api.get<Task[]>(`/tasks?sprintId=${sprintId}`).then((r) => r.data),
    enabled: !!sprintId,
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateTask(sprintId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      projectId: string
      title: string
      description?: string
      status?: TaskStatus
      priority?: Priority
      assignedToId?: string
      storyPoints?: number
    }) => api.post<Task>('/tasks', { ...data, sprintId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.bySprint(sprintId) }),
  })
}

export function useUpdateTask(id: string, sprintId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Task>) => api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.bySprint(sprintId) })
      qc.invalidateQueries({ queryKey: taskKeys.detail(id) })
    },
  })
}

export function useMoveTask(sprintId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: TaskStatus; position: number }) =>
      api.patch(`/tasks/${id}/move`, { status, position }).then((r) => r.data),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: taskKeys.bySprint(sprintId) })
      const prev = qc.getQueryData<Task[]>(taskKeys.bySprint(sprintId))
      qc.setQueryData<Task[]>(taskKeys.bySprint(sprintId), (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t)) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(taskKeys.bySprint(sprintId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.bySprint(sprintId) }),
  })
}

export function useToggleTaskDone(sprintId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isDone }: { id: string; isDone: boolean }) =>
      api.patch(`/tasks/${id}/move`, { status: isDone ? 'DONE' : 'TODO', position: 0 }).then((r) => r.data),
    onMutate: async ({ id, isDone }) => {
      await qc.cancelQueries({ queryKey: taskKeys.bySprint(sprintId) })
      const prev = qc.getQueryData<Task[]>(taskKeys.bySprint(sprintId))
      qc.setQueryData<Task[]>(taskKeys.bySprint(sprintId), (old) =>
        old?.map((t) => (t.id === id ? { ...t, status: isDone ? 'DONE' : 'TODO' } : t)) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(taskKeys.bySprint(sprintId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.bySprint(sprintId) }),
  })
}

export function useMyTasks() {
  return useQuery({
    queryKey: ['tasks', 'mine'],
    queryFn: () => api.get<Task[]>('/tasks?myTasks=true').then((r) => r.data),
  })
}

export function useDeleteTask(sprintId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.bySprint(sprintId) }),
  })
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => api.post(`/tasks/${taskId}/comments`, { body }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) }),
  })
}
