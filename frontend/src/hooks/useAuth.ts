import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api.ts'
import { useAuthStore } from '@/store/auth.ts'
import type { User } from '@/types'

interface AuthResponse { token: string; user: User }

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
    onSuccess: ({ token, user }) => setAuth(token, user),
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
    onSuccess: ({ token, user }) => setAuth(token, user),
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => logout(),
  })
}
