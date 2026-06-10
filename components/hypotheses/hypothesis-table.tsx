"use client"

import Link from "next/link"
import {
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
  TableRow,
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

interface HypothesisTableProps {
  hypotheses: Hypothesis[]
  ownerNamesById?: Record<string, string>
  teamNamesById?: Record<string, string>
  onDelete?: (id: string) => void
  currentPage: number
  totalPages: number
  totalItems: number
  from: number | null
  to: number | null
  onPageChange: (page: number) => void
}

export function HypothesisTable({
  hypotheses,
  ownerNamesById = {},
  teamNamesById = {},
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  from,
  to,
  onPageChange,
}: HypothesisTableProps) {
  const { hasPermission } = useAuth()

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
              <TableHead className="w-[100px]">Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="w-[120px]">Статус</TableHead>
              <TableHead className="w-[100px]">Команда</TableHead>
              <TableHead className="w-[140px]">Владелец</TableHead>
              <TableHead className="w-[80px] text-right">Балл</TableHead>
              <TableHead className="w-[100px]">Обновлено</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hypotheses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Гипотезы не найдены
                </TableCell>
              </TableRow>
            ) : (
              hypotheses.map((hypothesis) => {
                const teamName = teamNamesById[hypothesis.teamId]
                const ownerName = ownerNamesById[hypothesis.ownerId]

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
                    <TableCell className="text-sm text-muted-foreground">{teamName || "-"}</TableCell>
                    <TableCell className="text-sm">{ownerName || "-"}</TableCell>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Показано {from ?? 0}-{to ?? 0} из {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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
