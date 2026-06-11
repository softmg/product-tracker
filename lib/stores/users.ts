import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"
import type { UserOption } from "@/lib/types"

export const fetchUserOptionsFx = createEffect(async (): Promise<UserOption[]> => {
  const { data } = await apiClient.get<{ data: UserOption[] }>("/api/v1/users")
  return data.data
})

export const $userOptions = createStore<UserOption[]>([])
  .on(fetchUserOptionsFx.doneData, (_, users) => users)

export const $userOptionsLoading = fetchUserOptionsFx.pending
