"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { MoreHorizontal, Eye, Pencil, Archive, ArrowRight, ArrowLeft, User, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import type { Hypothesis, HypothesisStatus, SLAConfig } from "@/lib/types"

const statusDisplayInfo: Record<HypothesisStatus, { label: string; colorClass: string }> = {
  backlog: { label: "Идея", colorClass: "bg-[#F3F4F6] text-[#6B7280]" },
  scoring: { label: "Скоринг", colorClass: "bg-[#E0E7FF] text-[#4338CA]" },
  deep_dive: { label: "Deep Dive", colorClass: "bg-[#DBEAFE] text-[#1D4ED8]" },
  experiment: { label: "Эксперимент", colorClass: "bg-[#FEF3C7] text-[#B45309]" },
  analysis: { label: "Анализ", colorClass: "bg-[#FCE7F3] text-[#BE185D]" },
  go_no_go: { label: "Питч", colorClass: "bg-[#EDE9FE] text-[#6D28D9]" },
  done: { label: "Архив", colorClass: "bg-[#DCFCE7] text-[#15803D]" },
}

const defaultSLAConfigs: SLAConfig[] = [
  { id: "sla-backlog", status: "backlog", limitDays: 14, warningDays: 3, isActive: true },
  { id: "sla-scoring", status: "scoring", limitDays: 7, warningDays: 2, isActive: true },
  { id: "sla-deep-dive", status: "deep_dive", limitDays: 21, warningDays: 5, isActive: true },
  { id: "sla-experiment", status: "experiment", limitDays: 30, warningDays: 7, isActive: true },
  { id: "sla-analysis", status: "analysis", limitDays: 7, warningDays: 2, isActive: true },
  { id: "sla-go-no-go", status: "go_no_go", limitDays: 5, warningDays: 2, isActive: true },
  { id: "sla-done", status: "done", limitDays: 0, warningDays: 0, isActive: true },
]

interface HypothesisKanbanProps {
  hypotheses: Hypothesis[]
  ownerNamesById?: Record<string, string>
  onDelete?: (id: string) => void
}

interface KanbanCardProps {
  hypothesis: Hypothesis
  ownerNamesById?: Record<string, string>
}

interface HypothesisKanbanProps {
  hypotheses: Hypothesis[]
  onDelete?: (id: string) => void
}

// Kanban column order
const KANBAN_STATUSES: HypothesisStatus[] = [
  'backlog',
  'scoring',
  'deep_dive',
  'experiment',
  'analysis',
  'go_no_go',
  'done',
]

// Kanban column display names (Russian)
const KANBAN_STATUS_NAMES: Record<HypothesisStatus, string> = {
  backlog: 'Идея',
  scoring: 'Первичный',
  deep_dive: 'Deep Dive',
  experiment: 'Эксперимент',
  analysis: 'Анализ',
  go_no_go: 'Питч',
  done: 'Архив',
}

const INITIAL_CARDS_TO_SHOW = 5
const LOAD_MORE_COUNT = 5

type SLAStatus = 'ok' | 'warning' | 'overdue'

function getSLAStatus(hypothesis: Hypothesis): { status: SLAStatus; daysText: string } | null {
  if (!hypothesis.deadline) return null
  
  const deadline = new Date(hypothesis.deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)
  
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  // Get SLA config for current status
  const slaConfig = mockSLAConfigs.find(c => c.status === hypothesis.status)
  const warningDays = slaConfig?.warningDays || 3
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  }
  
  const startDate = new Date(hypothesis.updatedAt)
  const daysText = `${formatDate(startDate)} – ${formatDate(deadline)}`
  
  if (diffDays < 0) {
    return { status: 'overdue', daysText }
  } else if (diffDays <= warningDays) {
    return { status: 'warning', daysText }
  }
  return { status: 'ok', daysText }
}

function SLAIndicator({ hypothesis }: { hypothesis: Hypothesis }) {
  const slaInfo = getSLAStatus(hypothesis)
  
  if (!slaInfo) return null
  
  const { status, daysText } = slaInfo
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs",
      status === 'ok' && "text-green-600 dark:text-green-400",
      status === 'warning' && "text-yellow-600 dark:text-yellow-400",
      status === 'overdue' && "text-red-600 dark:text-red-400"
    )}>
      {status === 'ok' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'warning' && <AlertTriangle className="h-3 w-3" />}
      {status === 'overdue' && <AlertCircle className="h-3 w-3" />}
      <span>SLA: {daysText}</span>
    </div>
  )
}

function KanbanCard({ hypothesis }: { hypothesis: Hypothesis }) {
  const { hasPermission } = useAuth()
  const owner = getUserById(hypothesis.ownerId)
  const initiator = getUserById(hypothesis.ownerId) // Using owner as initiator for now
  
  const score = hypothesis.scoring?.totalScore
  const hasScoring = hypothesis.status !== 'backlog' && score !== undefined
  
  // Priority badge based on score
  const getPriorityBadge = () => {
    if (!hasScoring || score === undefined) return null
    if (score >= 400) return { label: 'Высокий', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    if (score >= 250) return { label: 'Средний', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
    return { label: 'Низкий', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
  }
  
  const priority = getPriorityBadge()
  
  return (
    <div className="bg-card rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with ID */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link 
          href={`/hypotheses/${hypothesis.id}`}
          className="font-mono text-xs text-muted-foreground hover:text-primary"
        >
          {hypothesis.code}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1">
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">Меню</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/hypotheses/${hypothesis.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Открыть карточку
              </Link>
            </DropdownMenuItem>
            {hasPermission("hypothesis:edit") && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/hypotheses/${hypothesis.id}?edit=true`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Изменить статус
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Назначить ответственного
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              <Archive className="mr-2 h-4 w-4" />
              Архивировать
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Title */}
      <Link 
        href={`/hypotheses/${hypothesis.id}`}
        className="block font-medium text-sm leading-snug line-clamp-2 hover:text-primary mb-3"
      >
        {hypothesis.title}
      </Link>
      
      <div className="border-t pt-2 space-y-2">
        {/* Initiator -> Owner */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">{initiator?.name || '-'}</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate font-medium text-foreground">{owner?.name || '-'}</span>
        </div>
        
        {/* Score and Priority */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            Скоринг: <span className="font-mono font-medium text-foreground">{hasScoring ? score : '—'}</span>
          </span>
          {priority && (
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", priority.className)}>
              {priority.label}
            </Badge>
          )}
        </div>
        
        {/* SLA */}
        <SLAIndicator hypothesis={hypothesis} />
      </div>
    </div>
  )
}

function KanbanColumn({ 
  status, 
  hypotheses,
  totalCount 
}: { 
  status: HypothesisStatus
  hypotheses: Hypothesis[]
  totalCount: number
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_CARDS_TO_SHOW)
  
  const visibleHypotheses = hypotheses.slice(0, visibleCount)
  const remainingCount = hypotheses.length - visibleCount
  
  const info = statusDisplayInfo[status]
  
  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0",
        info.colorClass
      )}>
        <span className="font-medium text-sm">{KANBAN_STATUS_NAMES[status]}</span>
        <Badge variant="secondary" className="bg-background/50 text-foreground text-xs">
          {totalCount}
        </Badge>
      </div>
      
      {/* Column content */}
      <div className="flex-1 bg-muted/30 rounded-b-lg border p-2 space-y-2 min-h-[200px]">
        {visibleHypotheses.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            Нет гипотез
          </div>
        ) : (
          <>
            {visibleHypotheses.map((hypothesis) => (
              <KanbanCard key={hypothesis.id} hypothesis={hypothesis} />
            ))}
            
            {remainingCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
              >
                + Ещё {remainingCount}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function HypothesisKanban({ hypotheses }: HypothesisKanbanProps) {
  // Group hypotheses by status
  const hypothesesByStatus = useMemo(() => {
    const grouped: Record<HypothesisStatus, Hypothesis[]> = {
      backlog: [],
      scoring: [],
      deep_dive: [],
      experiment: [],
      analysis: [],
      go_no_go: [],
      done: [],
    }
    
    hypotheses.forEach(h => {
      if (grouped[h.status]) {
        grouped[h.status].push(h)
      }
    })
    
    // Sort by updatedAt within each column
    Object.keys(grouped).forEach(status => {
      grouped[status as HypothesisStatus].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    })
    
    return grouped
  }, [hypotheses])
  
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          hypotheses={hypothesesByStatus[status]}
          totalCount={hypothesesByStatus[status].length}
        />
      ))}
    </div>
  )
}
