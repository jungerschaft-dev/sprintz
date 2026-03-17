import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api.ts'
import type { Sprint, SprintStatus } from '@/types'

export const sprintKeys = {
  byProject: (projectId: string) => ['sprints', projectId] as const,
  detail: (id: string) => ['sprints', 'detail', id] as const,
}

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: sprintKeys.byProject(projectId),
    queryFn: () => api.get<Sprint[]>(`/sprints?projectId=${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })
}

export function useSprint(id: string) {
  return useQuery({
    queryKey: sprintKeys.detail(id),
    queryFn: () => api.get<Sprint>(`/sprints/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; goal?: string; startDate?: string; endDate?: string }) =>
      api.post<Sprint>('/sprints', { ...data, projectId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) }),
  })
}

export function useUpdateSprint(id: string, projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<{ name: string; goal: string; status: SprintStatus; startDate: string; endDate: string }>) =>
      api.patch<Sprint>(`/sprints/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) })
      qc.invalidateQueries({ queryKey: sprintKeys.detail(id) })
    },
  })
}

export function useDeleteSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sprints/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: sprintKeys.byProject(projectId) }),
  })
}
