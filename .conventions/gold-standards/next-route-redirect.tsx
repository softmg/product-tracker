// Gold Standard: App Router page that performs a simple redirect at the route boundary
// Pay attention to: default-exported page component, minimal logic, using next/navigation directly

import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/login")
}
