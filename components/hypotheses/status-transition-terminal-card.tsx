"use client"

import { Archive, Clock, AlertTriangle, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "./status-badge"
import type { Hypothesis } from "@/lib/types"

interface StatusTransitionTerminalCardProps {
  hypothesis: Hypothesis
  currentStatus: "done" | "archived"
  onTabChange?: (tab: string) => void
}

export function StatusTransitionTerminalCard({
  hypothesis,
  currentStatus,
  onTabChange,
}: StatusTransitionTerminalCardProps) {
  const isArchived = currentStatus === "archived"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">{isArchived ? "Архив" : "Done"}</CardTitle>
              <CardDescription>
                {isArchived ? "Архивирована" : "Закрыта"}: {hypothesis.updatedAt ? new Date(hypothesis.updatedAt).toLocaleDateString("ru-RU") : "-"}
              </CardDescription>
            </div>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hypothesis.decision && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Причина закрытия:</p>
            <p className="text-sm text-muted-foreground">
              Решение комитета: {hypothesis.decision.result === "go" ? "Go" : hypothesis.decision.result === "no_go" ? "No-Go" : "Iterate"}
            </p>
            {hypothesis.decision.comment && (
              <p className="text-sm text-muted-foreground">
                Комментарий: &quot;{hypothesis.decision.comment}&quot;
              </p>
            )}
          </div>
        )}

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onTabChange?.("passport")}>
            <FileText className="mr-2 h-4 w-4" />
            Просмотреть паспорт
          </Button>
          <Button variant="outline" size="sm" onClick={() => onTabChange?.("history")}>
            <Clock className="mr-2 h-4 w-4" />
            Просмотреть аудит
          </Button>
          <Button variant="outline" size="sm">
            Экспорт PDF
          </Button>
          <Button variant="outline" size="sm">
            Экспорт Excel
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Редактирование основных полей недоступно для архивных гипотез
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
