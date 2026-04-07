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
import { mockTeams, mockUsers, statusDisplayInfo } from "@/lib/mock-data"
import type { Hypothesis, HypothesisStatus } from "@/lib/types"
import {
  $hypotheses,
  $isLoading,
  fetchHypothesesFx,
  isHypothesisMockMode,
} from "@/lib/stores/hypotheses/model"
import type { ApiHypothesisList } from "@/lib/stores/hypotheses/types"

type ViewMode = "table" | "kanban"

/** Bridge: map API list item to the Hypothesis shape expected by UI components */
function apiToHypothesis(h: ApiHypothesisList): Hypothesis {
  return {
    id: String(h.id),
    code: h.code,
    title: h.title,
    description: "",
    status: h.status as HypothesisStatus,
    teamId: h.team ? String(h.team.id) : "",
    ownerId: h.owner ? String(h.owner.id) : "",
    deadline: h.sla_deadline ?? undefined,
    createdAt: h.created_at,
    updatedAt: h.updated_at,
    scoring: h.scoring_primary != null
      ? { criteriaScores: {}, stopFactorTriggered: false, totalScore: h.scoring_primary, scoredAt: "", scoredBy: "" }
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

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("hypotheses-view-mode") as ViewMode | null
    if (savedView && (savedView === "table" || savedView === "kanban")) {
      setViewMode(savedView)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    void fetchHypothesesFx({})
  }, [])

  // Re-fetch from API when filters change (API mode only — mock mode filters client-side)
  useEffect(() => {
    if (!isHypothesisMockMode) {
      void fetchHypothesesFx({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
        team_id: teamFilter !== "all" ? Number(teamFilter) : undefined,
      })
    }
  }, [statusFilter, searchQuery, teamFilter])

  const hypotheses = useMemo(() => hypothesesRaw.map(apiToHypothesis), [hypothesesRaw])

  // Client-side filtering (used in mock mode; API mode relies on server filtering)
  const filteredHypotheses = useMemo(() => {
    if (!isHypothesisMockMode) return hypotheses

    return hypotheses.filter((h) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !h.title.toLowerCase().includes(query) &&
          !h.code.toLowerCase().includes(query) &&
          !h.description.toLowerCase().includes(query)
        ) {
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

  // Save view preference to localStorage
  const handleViewChange = (value: string) => {
    if (value === "table" || value === "kanban") {
      setViewMode(value)
      localStorage.setItem("hypotheses-view-mode", value)
    }
  }

  // Owners list from current hypothesis data
  const owners = mockUsers.filter((u) => hypotheses.some((h) => h.ownerId === u.id))

  return (
    <>
      <Header breadcrumbs={[{ title: "Гипотезы" }]} />

      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Гипотезы</h1>
              <p className="text-sm text-muted-foreground">
                Управление и отслеживание продуктовых гипотез
              </p>
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

          {/* Filters */}
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
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    {Object.entries(statusDisplayInfo).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все команды</SelectItem>
                  {mockTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Owner" />
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

              {/* View toggle */}
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

          {/* Results count */}
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

          {/* Table / Kanban View */}
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
