"use client"

import { useEffect, useMemo, useState } from "react"
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
import { $teams, fetchTeamsFx } from "@/lib/stores/admin/teams"
import {
  $userOptions,
  fetchUserOptionsFx,
} from "@/lib/stores/users"
import {
  $hypotheses,
  $hypothesesMeta,
  $isLoading,
  fetchHypothesesFx,
  requestHypotheses,
} from "@/lib/stores/hypotheses/model"
import type { ApiHypothesisList } from "@/lib/stores/hypotheses/types"

type ViewMode = "table" | "kanban"

const TABLE_PAGE_SIZE = 10
const KANBAN_PAGE_SIZE = 100

const allStatuses: HypothesisStatus[] = [
  "backlog",
  "scoring",
  "deep_dive",
  "experiment",
  "go_no_go",
  "done",
  "archived",
]

const statusLabelsRu: Record<HypothesisStatus, string> = {
  backlog: "Идея",
  scoring: "Скоринг",
  deep_dive: "Deep Dive",
  experiment: "Эксперимент",
  go_no_go: "Питч",
  done: "Done",
  archived: "Архив",
}

function isHypothesisStatus(value: string): value is HypothesisStatus {
  return allStatuses.includes(value as HypothesisStatus)
}

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
  const [currentPage, setCurrentPage] = useState(1)
  const [kanbanHypothesesRaw, setKanbanHypothesesRaw] = useState<ApiHypothesisList[]>([])
  const [isKanbanLoading, setIsKanbanLoading] = useState(false)

  const [hypothesesRaw, hypothesesMeta, isTableLoading, teams, users] = useUnit([
    $hypotheses,
    $hypothesesMeta,
    $isLoading,
    $teams,
    $userOptions,
  ])

  useEffect(() => {
    const savedView = localStorage.getItem("hypotheses-view-mode") as ViewMode | null
    if (savedView === "table" || savedView === "kanban") {
      setViewMode(savedView)
    }
  }, [])

  useEffect(() => {
    void fetchTeamsFx().catch(() => undefined)
    void fetchUserOptionsFx().catch(() => undefined)
  }, [])

  useEffect(() => {
    const filters = {
      status: viewMode === "table" && statusFilter !== "all" ? statusFilter : undefined,
      search: searchQuery || undefined,
      team_id: teamFilter !== "all" ? Number(teamFilter) : undefined,
      owner_id: ownerFilter !== "all" ? Number(ownerFilter) : undefined,
    }

    if (viewMode === "table") {
      void fetchHypothesesFx({
        ...filters,
        page: currentPage,
        per_page: TABLE_PAGE_SIZE,
      })

      return
    }

    let isCancelled = false

    const loadKanbanHypotheses = async () => {
      setIsKanbanLoading(true)

      try {
        let page = 1
        let lastPage = 1
        const allHypotheses: ApiHypothesisList[] = []

        do {
          const result = await requestHypotheses({
            ...filters,
            page,
            per_page: KANBAN_PAGE_SIZE,
          })

          if (isCancelled) {
            return
          }

          allHypotheses.push(...result.data)
          lastPage = result.meta.last_page
          page += 1
        } while (page <= lastPage)

        if (!isCancelled) {
          setKanbanHypothesesRaw(allHypotheses)
        }
      } finally {
        if (!isCancelled) {
          setIsKanbanLoading(false)
        }
      }
    }

    void loadKanbanHypotheses()

    return () => {
      isCancelled = true
    }
  }, [currentPage, ownerFilter, searchQuery, statusFilter, teamFilter, viewMode])

  const displayedHypothesesRaw = viewMode === "kanban" ? kanbanHypothesesRaw : hypothesesRaw
  const isLoading = viewMode === "kanban" ? isKanbanLoading : isTableLoading

  const hypotheses = useMemo(
    () => displayedHypothesesRaw.map(apiToHypothesis),
    [displayedHypothesesRaw],
  )

  const availableTeams = useMemo(() => {
    const teamsMap = new Map<string, string>()

    for (const team of teams) {
      teamsMap.set(String(team.id), team.name || `Команда ${team.id}`)
    }

    for (const item of displayedHypothesesRaw) {
      if (item.team) {
        teamsMap.set(String(item.team.id), item.team.name || `Команда ${item.team.id}`)
      }
    }

    return Array.from(teamsMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [displayedHypothesesRaw, teams])

  const owners = useMemo(() => {
    const ownersMap = new Map<string, string>()

    for (const user of users) {
      ownersMap.set(String(user.id), user.name || user.email || `Пользователь ${user.id}`)
    }

    for (const item of displayedHypothesesRaw) {
      if (item.owner) {
        ownersMap.set(String(item.owner.id), item.owner.name || item.owner.email || `Пользователь ${item.owner.id}`)
      }
    }

    return Array.from(ownersMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [displayedHypothesesRaw, users])

  const teamNamesById = useMemo(
    () => Object.fromEntries(availableTeams.map(({ id, name }) => [id, name])),
    [availableTeams],
  )

  const ownerNamesById = useMemo(
    () => Object.fromEntries(owners.map(({ id, name }) => [id, name])),
    [owners],
  )

  useEffect(() => {
    if (teamFilter !== "all" && availableTeams.length > 0 && !availableTeams.some((team) => team.id === teamFilter)) {
      setTeamFilter("all")
    }
  }, [availableTeams, teamFilter])

  useEffect(() => {
    if (ownerFilter !== "all" && owners.length > 0 && !owners.some((owner) => owner.id === ownerFilter)) {
      setOwnerFilter("all")
    }
  }, [ownerFilter, owners])

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
    setCurrentPage(1)
  }

  const handleViewChange = (value: string) => {
    if (value === "table" || value === "kanban") {
      setViewMode(value)
      setCurrentPage(1)
      localStorage.setItem("hypotheses-view-mode", value)
    }
  }

  const visibleCount = viewMode === "kanban"
    ? hypotheses.length
    : (hypothesesMeta?.total ?? hypotheses.length)

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
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setCurrentPage(1)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === "table" && (
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as HypothesisStatus | "all")
                    setCurrentPage(1)
                  }}
                >
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

              <Select
                value={teamFilter}
                onValueChange={(value) => {
                  setTeamFilter(value)
                  setCurrentPage(1)
                }}
              >
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

              <Select
                value={ownerFilter}
                onValueChange={(value) => {
                  setOwnerFilter(value)
                  setCurrentPage(1)
                }}
              >
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
                Найдено: {visibleCount}{" "}
                {visibleCount === 1
                  ? "гипотеза"
                  : visibleCount >= 2 && visibleCount <= 4
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
            <HypothesisTable
              hypotheses={hypotheses}
              teamNamesById={teamNamesById}
              ownerNamesById={ownerNamesById}
              currentPage={hypothesesMeta?.current_page ?? currentPage}
              totalPages={hypothesesMeta?.last_page ?? 1}
              totalItems={hypothesesMeta?.total ?? hypotheses.length}
              from={hypothesesMeta?.from ?? null}
              to={hypothesesMeta?.to ?? null}
              onPageChange={setCurrentPage}
            />
          ) : (
            <HypothesisKanban hypotheses={hypotheses} />
          )}
        </div>
      </main>
    </>
  )
}
