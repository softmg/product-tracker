import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"
export interface UserOption {
  id: number
  name: string
  email: string
}

export const fetchUserOptionsFx = createEffect(async (): Promise<UserOption[]> => {
  const { data } = await apiClient.get<{ data: UserOption[] }>("/api/v1/users")
  return data.data
})

export const $userOptions = createStore<UserOption[]>([])
  .on(fetchUserOptionsFx.doneData, (_, users) => users)

export const $userOptionsLoading = fetchUserOptionsFx.pending
