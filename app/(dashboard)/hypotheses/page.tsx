"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, X, Filter, LayoutList, LayoutGrid } from "lucide-react"
import { useUnit } from "effector-react"
import { Header } from "@/components/layout/header"
import { HypothesisTable } from "@/components/hypotheses/hypothesis-table"
import { HypothesisKanban } from "@/components/hypotheses/hypothesis-kanban"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import type { Hypothesis, HypothesisStatus } from "@/lib/types"
import {
  $hypotheses,
  $isLoading,
  fetchHypothesesFx,
  isHypothesisMockMode,
} from "@/lib/stores/hypotheses/model"
import type { ApiHypothesisList } from "@/lib/stores/hypotheses/types"

type ViewMode = "table" | "kanban"

const allStatuses: HypothesisStatus[] = [
  "backlog",
  "scoring",
  "deep_dive",
  "experiment",
  "analysis",
  "go_no_go",
  "done",
]

const statusLabelsRu: Record<HypothesisStatus, string> = {
  backlog: "Идея",
  scoring: "Скоринг",
  deep_dive: "Deep Dive",
  experiment: "Эксперимент",
  analysis: "Анализ",
  go_no_go: "Питч",
  done: "Архив",
}

function isHypothesisStatus(value: string): value is HypothesisStatus {
  return allStatuses.includes(value as HypothesisStatus)
}

/** Bridge: map API list item to the Hypothesis shape expected by UI components */
function apiToHypothesis(h: ApiHypothesisList): Hypothesis {
  return {
    id: String(h.id),
    code: h.code,
    title: h.title,
    description: "",
    status: isHypothesisStatus(h.status) ? h.status : "backlog",
    teamId: h.team ? String(h.team.id) : "",
    ownerId: h.owner ? String(h.owner.id) : "",
    deadline: h.sla_deadline ?? undefined,
    createdAt: h.created_at,
    updatedAt: h.updated_at,
    scoring:
      h.scoring_primary != null
        ? {
            criteriaScores: {},
            stopFactorTriggered: false,
            totalScore: h.scoring_primary,
            scoredAt: "",
            scoredBy: "",
          }
        : undefined,
  }
}

export default function HypothesesPage() {
  const { hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<HypothesisStatus | "all">("all")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [ownerFilter, setOwnerFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  const hypothesesRaw = useUnit($hypotheses)
  const isLoading = useUnit($isLoading)

  useEffect(() => {
    const savedView = localStorage.getItem("hypotheses-view-mode") as ViewMode | null
    if (savedView === "table" || savedView === "kanban") {
      setViewMode(savedView)
    }
  }, [])

  useEffect(() => {
    void fetchHypothesesFx({})
  }, [])

  useEffect(() => {
    if (!isHypothesisMockMode) {
      void fetchHypothesesFx({
        status: viewMode === "table" && statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
        team_id: teamFilter !== "all" ? Number(teamFilter) : undefined,
      })
    }
  }, [statusFilter, searchQuery, teamFilter, viewMode])

  const hypotheses = useMemo(() => hypothesesRaw.map(apiToHypothesis), [hypothesesRaw])

  const availableTeams = useMemo(() => {
    const teamsMap = new Map<string, string>()

    for (const item of hypothesesRaw) {
      if (item.team) {
        teamsMap.set(String(item.team.id), item.team.name || `Команда ${item.team.id}`)
      }
    }

    return Array.from(teamsMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [hypothesesRaw])

  const owners = useMemo(() => {
    const ownersMap = new Map<string, string>()

    for (const item of hypothesesRaw) {
      if (item.owner) {
        ownersMap.set(String(item.owner.id), item.owner.name || item.owner.email || `Пользователь ${item.owner.id}`)
      }
    }

    return Array.from(ownersMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [hypothesesRaw])

  useEffect(() => {
    if (teamFilter !== "all" && !availableTeams.some((team) => team.id === teamFilter)) {
      setTeamFilter("all")
    }
  }, [availableTeams, teamFilter])

  useEffect(() => {
    if (ownerFilter !== "all" && !owners.some((owner) => owner.id === ownerFilter)) {
      setOwnerFilter("all")
    }
  }, [ownerFilter, owners])

  const filteredHypotheses = useMemo(() => {
    return hypotheses.filter((h) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!h.title.toLowerCase().includes(query) && !h.code.toLowerCase().includes(query)) {
          return false
        }
      }

      if (viewMode === "table" && statusFilter !== "all" && h.status !== statusFilter) return false
      if (teamFilter !== "all" && h.teamId !== teamFilter) return false
      if (ownerFilter !== "all" && h.ownerId !== ownerFilter) return false

      return true
    })
  }, [hypotheses, searchQuery, statusFilter, teamFilter, ownerFilter, viewMode])

  const activeFiltersCount = [
    viewMode === "table" && statusFilter !== "all",
    teamFilter !== "all",
    ownerFilter !== "all",
  ].filter(Boolean).length

  const clearFilters = () => {
    setStatusFilter("all")
    setTeamFilter("all")
    setOwnerFilter("all")
    setSearchQuery("")
  }

  const handleViewChange = (value: string) => {
    if (value === "table" || value === "kanban") {
      setViewMode(value)
      localStorage.setItem("hypotheses-view-mode", value)
    }
  }

  return (
    <>
      <Header breadcrumbs={[{ title: "Гипотезы" }]} />

      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Гипотезы</h1>
              <p className="text-sm text-muted-foreground">Управление и отслеживание продуктовых гипотез</p>
            </div>
            {hasPermission("hypothesis:create") && (
              <Button asChild>
                <Link href="/hypotheses/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Новая гипотеза
                </Link>
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск гипотез..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === "table" && (
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as HypothesisStatus | "all")}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    {allStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabelsRu[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Команда" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все команды</SelectItem>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Владелец" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все владельцы</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Сбросить
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                </Button>
              )}

              <div className="border-l pl-2 ml-1">
                <ToggleGroup type="single" value={viewMode} onValueChange={handleViewChange}>
                  <ToggleGroupItem value="table" aria-label="Таблица" title="Таблица">
                    <LayoutList className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="kanban" aria-label="Доска" title="Доска">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Найдено: {filteredHypotheses.length}{" "}
                {filteredHypotheses.length === 1
                  ? "гипотеза"
                  : filteredHypotheses.length >= 2 && filteredHypotheses.length <= 4
                    ? "гипотезы"
                    : "гипотез"}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : viewMode === "table" ? (
            <HypothesisTable hypotheses={filteredHypotheses} />
          ) : (
            <HypothesisKanban hypotheses={filteredHypotheses} />
          )}
        </div>
      </main>
    </>
  )
}
