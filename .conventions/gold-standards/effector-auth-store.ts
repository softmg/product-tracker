// Gold Standard: Effector model keeps effects/events/stores at one boundary layer
// Pay attention to: typed payloads, .on wiring, and sample() for login-submit flow

import { createEffect, createEvent, createStore, sample } from "effector"

type LoginParams = { email: string; password: string }
type AuthUser = { id: number; name: string; role: string }

export const loginSubmitted = createEvent<LoginParams>()
export const logoutClicked = createEvent()

export const loginFx = createEffect(async (params: LoginParams): Promise<AuthUser> => {
  const response = await fetch("/api/v1/auth/login", { method: "POST", body: JSON.stringify(params) })
  const data = await response.json()
  return data.data as AuthUser
})

export const logoutFx = createEffect(async () => {
  await fetch("/api/v1/auth/logout", { method: "POST" })
})

export const $authUser = createStore<AuthUser | null>(null)
  .on(loginFx.doneData, (_, user) => user)
  .reset(logoutFx.done)

sample({ clock: loginSubmitted, target: loginFx })
sample({ clock: logoutClicked, target: logoutFx })
