"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  PlusCircle,
  Pencil,
  ArrowRight,
  Trash2,
  FlaskConical,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AuditLogEntry, HypothesisStatus } from "@/lib/types"
import { StatusBadge } from "@/components/hypotheses/status-badge"
import { Badge } from "@/components/ui/badge"

const statusLabelByStatus: Record<HypothesisStatus, string> = {
  backlog: "Идея",
  scoring: "Скоринг",
  deep_dive: "Deep Dive",
  experiment: "Эксперимент",
  go_no_go: "Питч",
  done: "Done",
  archived: "Архив",
}

interface HistoryTimelineProps {
  entries: AuditLogEntry[]
}

export function HistoryTimeline({ entries }: HistoryTimelineProps) {
  const getActionIcon = (action: string, entityType: string) => {
    if (action === "status_change") {
      return <ArrowRight className="h-4 w-4" />
    }
    if (entityType === "experiment") {
      return <FlaskConical className="h-4 w-4" />
    }
    switch (action) {
      case "create": return <PlusCircle className="h-4 w-4" />
      case "update": return <Pencil className="h-4 w-4" />
      case "delete": return <Trash2 className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-[#DCFCE7] text-[#16A34A]"
      case "update": return "bg-[#DBEAFE] text-[#2563EB]"
      case "delete": return "bg-[#FEE2E2] text-[#DC2626]"
      case "status_change": return "bg-[#EDE9FE] text-[#7C3AED]"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    }
    if (diffDays === 1) {
      return "Yesterday"
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const formatChange = (entry: AuditLogEntry) => {
    if (entry.action === "status_change" && entry.changes.status) {
      const oldStatus = entry.changes.status.old as string
      const newStatus = entry.changes.status.new as string
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">Changed status from</span>
          {oldStatus in statusLabelByStatus ? (
            <StatusBadge status={oldStatus as HypothesisStatus} className="text-xs" />
          ) : (
            <Badge variant="outline" className="text-xs">{oldStatus}</Badge>
          )}
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          {newStatus in statusLabelByStatus ? (
            <StatusBadge status={newStatus as HypothesisStatus} className="text-xs" />
          ) : (
            <Badge variant="outline" className="text-xs">{newStatus}</Badge>
          )}
        </div>
      )
    }
    
    if (entry.action === "create") {
      return (
        <span className="text-sm">
          Created {entry.entityType === "experiment" ? "experiment" : "hypothesis"}
        </span>
      )
    }
    
    if (entry.action === "update") {
      const fields = Object.keys(entry.changes)
      return (
        <span className="text-sm">
          Updated {fields.join(", ")}
        </span>
      )
    }
    
    return (
      <span className="text-sm capitalize">{entry.action.replace("_", " ")}</span>
    )
  }

  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No history yet</h3>
          <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
            Activity will appear here as changes are made to this hypothesis.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
        <CardDescription>
          Timeline of changes and updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          {/* Timeline entries */}
          <div className="space-y-6">
            {entries.map((entry, index) => (
              <div key={entry.id} className="relative flex gap-4">
                {/* Icon */}
                <div className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  getActionColor(entry.action)
                )}>
                  {getActionIcon(entry.action, entry.entityType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {getInitials(entry.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{entry.userName}</span>
                      </div>
                      {formatChange(entry)}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
