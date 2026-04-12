"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useUnit } from "effector-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { $hypotheses, createHypothesisFx, fetchHypothesesFx } from "@/lib/stores/hypotheses/model"

type Priority = "low" | "medium" | "high"

const parsePrefixedId = (value: string | undefined, prefix: string): string | null => {
  if (!value || !value.startsWith(prefix)) {
    return null
  }

  const parsed = Number.parseInt(value.slice(prefix.length), 10)
  return Number.isNaN(parsed) ? null : String(parsed)
}

export default function NewHypothesisPage() {
  const router = useRouter()
  const { hasPermission, user } = useAuth()
  const hypotheses = useUnit($hypotheses)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [priority, setPriority] = useState<Priority>("medium")
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("")

  if (!hasPermission("hypothesis:create")) {
    router.push("/hypotheses")
    return null
  }

  useEffect(() => {
    void fetchHypothesesFx({ per_page: 200 })
  }, [])

  const teamOptions = useMemo(() => {
    const map = new Map<string, string>()

    for (const hypothesis of hypotheses) {
      if (hypothesis.team) {
        map.set(String(hypothesis.team.id), hypothesis.team.name || `Команда ${hypothesis.team.id}`)
      }
    }

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [hypotheses])

  const ownerOptions = useMemo(() => {
    const map = new Map<string, string>()

    for (const hypothesis of hypotheses) {
      if (hypothesis.owner) {
        map.set(
          String(hypothesis.owner.id),
          hypothesis.owner.name || hypothesis.owner.email || `Пользователь ${hypothesis.owner.id}`,
        )
      }
    }

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [hypotheses])

  const defaultTeamId = parsePrefixedId(user?.teamId, "team-")
  const defaultOwnerId = parsePrefixedId(user?.id, "user-")

  useEffect(() => {
    if (selectedTeamId) {
      return
    }

    if (defaultTeamId && teamOptions.some((team) => team.id === defaultTeamId)) {
      setSelectedTeamId(defaultTeamId)
      return
    }

    if (teamOptions.length > 0) {
      setSelectedTeamId(teamOptions[0].id)
    }
  }, [defaultTeamId, selectedTeamId, teamOptions])

  useEffect(() => {
    if (selectedOwnerId) {
      return
    }

    if (defaultOwnerId && ownerOptions.some((owner) => owner.id === defaultOwnerId)) {
      setSelectedOwnerId(defaultOwnerId)
      return
    }

    if (ownerOptions.length > 0) {
      setSelectedOwnerId(ownerOptions[0].id)
    }
  }, [defaultOwnerId, ownerOptions, selectedOwnerId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data = new FormData(e.currentTarget)

    try {
      const result = await createHypothesisFx({
        title: String(data.get("title") ?? ""),
        problem: String(data.get("problem") ?? "") || undefined,
        solution: String(data.get("solution") ?? "") || undefined,
        target_audience: String(data.get("audience") ?? "") || undefined,
        priority,
        team_id: selectedTeamId ? Number(selectedTeamId) : undefined,
      })

      router.push(`/hypotheses/${result.id}`)
    } catch {
      setIsSubmitting(false)
    }
  }

  const teamSelectValue = selectedTeamId || "none"
  const ownerSelectValue = selectedOwnerId || "none"

  return (
    <>
      <Header
        breadcrumbs={[
          { title: "Гипотезы", href: "/hypotheses" },
          { title: "Новая гипотеза" },
        ]}
      />

      <main className="flex-1 overflow-auto">
        <div className="container max-w-3xl pl-8 pr-8 py-6 space-y-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/hypotheses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к гипотезам
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Создать гипотезу</h1>
            <p className="text-sm text-muted-foreground">
              Определите новую продуктовую гипотезу для тестирования и валидации
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Данные гипотезы</CardTitle>
                <CardDescription>Укажите основную информацию о вашей гипотезе</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="например, Добавление социального входа увеличит конверсию"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Чёткая, проверяемая формулировка вашей гипотезы</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">Проблема / боль клиента *</Label>
                  <Textarea
                    id="problem"
                    name="problem"
                    placeholder="Опишите проблему или боль клиента, которую вы хотите решить..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solution">Формулировка решения «Мы верим, что...» *</Label>
                  <Textarea
                    id="solution"
                    name="solution"
                    placeholder="Мы верим, что если мы сделаем X, то произойдёт Y..."
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assumptions">Ключевые предположения *</Label>
                  <Textarea
                    id="assumptions"
                    placeholder="Какие предположения лежат в основе вашей гипотезы?"
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Целевая аудитория *</Label>
                  <Textarea
                    id="audience"
                    name="audience"
                    placeholder="Опишите целевую аудиторию для данной гипотезы..."
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Приоритет *</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите приоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="low">Низкий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="team">Команда *</Label>
                    <Select value={teamSelectValue} onValueChange={(value) => setSelectedTeamId(value === "none" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите команду" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamOptions.length > 0 ? (
                          teamOptions.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none">Нет доступных команд</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner">Владелец *</Label>
                    <Select
                      value={ownerSelectValue}
                      onValueChange={(value) => setSelectedOwnerId(value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите владельца" />
                      </SelectTrigger>
                      <SelectContent>
                        {ownerOptions.length > 0 ? (
                          ownerOptions.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none">Нет доступных владельцев</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/hypotheses">Отмена</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Создание..." : "Создать гипотезу"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
    </>
  )
}
