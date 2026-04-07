"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { isAuthMockMode } from "@/lib/stores/auth/model"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react"

export default function SetupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const router = useRouter()

  if (isAuthMockMode) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Настройка системы</h1>
          <p className="text-sm text-muted-foreground">
            Создание администратора недоступно в режиме мок-данных.
          </p>
        </div>
        <div className="text-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            ← Вернуться ко входу
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-6">
        <div className="space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-semibold tracking-tight">Администратор создан</h1>
          <p className="text-sm text-muted-foreground">
            Войдите с указанными данными. После входа откроется руководство по настройке системы.
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Перейти ко входу
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== passwordConfirmation) {
      setError("Пароли не совпадают.")
      return
    }

    if (password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов.")
      return
    }

    setIsLoading(true)

    try {
      await apiClient.post("/api/v1/setup/admin", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      setDone(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(
        axiosErr.response?.data?.message ??
          "Не удалось создать администратора. Возможно, система уже настроена."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Первоначальная настройка</h1>
        <p className="text-sm text-muted-foreground">
          Создайте учётную запись администратора для управления системой.
          Этот экран доступен только один раз — пока нет ни одного пользователя.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg">Создать администратора</CardTitle>
          <CardDescription>Данные для первого входа в систему</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                type="text"
                placeholder="Иван Иванов"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Повтор пароля</Label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="Повторите пароль"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Создать администратора
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          ← Вернуться ко входу
        </Link>
      </p>
    </div>
  )
}
