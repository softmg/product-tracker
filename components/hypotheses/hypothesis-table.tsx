"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "./status-badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import type { Hypothesis } from "@/lib/types"
import { getUserById, getTeamById } from "@/lib/mock-data"

interface HypothesisTableProps {
  hypotheses: Hypothesis[]
  onDelete?: (id: string) => void
}

type SortField = "code" | "title" | "status" | "team" | "owner" | "score" | "updatedAt"
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE = 10

export function HypothesisTable({ hypotheses, onDelete }: HypothesisTableProps) {
  const { hasPermission } = useAuth()
  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedHypotheses = useMemo(() => {
    return [...hypotheses].sort((a, b) => {
      let aValue: string | number = ""
      let bValue: string | number = ""

      switch (sortField) {
        case "code":
          aValue = a.code
          bValue = b.code
          break
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "team":
          aValue = getTeamById(a.teamId)?.name || ""
          bValue = getTeamById(b.teamId)?.name || ""
          break
        case "owner":
          aValue = getUserById(a.ownerId)?.name || ""
          bValue = getUserById(b.ownerId)?.name || ""
          break
        case "score":
          aValue = a.scoring?.totalScore || 0
          bValue = b.scoring?.totalScore || 0
          break
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [hypotheses, sortField, sortDirection])

  const totalPages = Math.ceil(sortedHypotheses.length / ITEMS_PER_PAGE)
  const paginatedHypotheses = sortedHypotheses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-1 h-3 w-3" /> 
      : <ArrowDown className="ml-1 h-3 w-3" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <button 
                  onClick={() => handleSort("code")}
                  className="flex items-center hover:text-foreground"
                >
                  Код
                  <SortIcon field="code" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort("title")}
                  className="flex items-center hover:text-foreground"
                >
                  Название
                  <SortIcon field="title" />
                </button>
              </TableHead>
              <TableHead className="w-[120px]">
                <button 
                  onClick={() => handleSort("status")}
                  className="flex items-center hover:text-foreground"
                >
                  Статус
                  <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead className="w-[100px]">
                <button 
                  onClick={() => handleSort("team")}
                  className="flex items-center hover:text-foreground"
                >
                  Команда
                  <SortIcon field="team" />
                </button>
              </TableHead>
              <TableHead className="w-[140px]">
                <button 
                  onClick={() => handleSort("owner")}
                  className="flex items-center hover:text-foreground"
                >
                  Владелец
                  <SortIcon field="owner" />
                </button>
              </TableHead>
              <TableHead className="w-[80px] text-right">
                <button 
                  onClick={() => handleSort("score")}
                  className="flex items-center justify-end hover:text-foreground ml-auto"
                >
                  Балл
                  <SortIcon field="score" />
                </button>
              </TableHead>
              <TableHead className="w-[100px]">
                <button 
                  onClick={() => handleSort("updatedAt")}
                  className="flex items-center hover:text-foreground"
                >
                  Обновлено
                  <SortIcon field="updatedAt" />
                </button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedHypotheses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Гипотезы не найдены
                </TableCell>
              </TableRow>
            ) : (
              paginatedHypotheses.map((hypothesis) => {
                const team = getTeamById(hypothesis.teamId)
                const owner = getUserById(hypothesis.ownerId)
                
                return (
                  <TableRow key={hypothesis.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {hypothesis.code}
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/hypotheses/${hypothesis.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {hypothesis.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={hypothesis.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {team?.name || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {owner?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {hypothesis.scoring?.totalScore || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(hypothesis.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Открыть меню</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/hypotheses/${hypothesis.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Просмотр
                            </Link>
                          </DropdownMenuItem>
                          {hasPermission("hypothesis:edit") && (
                            <DropdownMenuItem asChild>
                              <Link href={`/hypotheses/${hypothesis.id}?edit=true`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Редактировать
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {hasPermission("hypothesis:delete") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDelete?.(hypothesis.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Показано {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, sortedHypotheses.length)} из {sortedHypotheses.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Назад
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={cn("w-8", currentPage !== page && "bg-transparent")}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Вперёд
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
