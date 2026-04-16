// Gold Standard: Client-side form section using local state with typed entities and shadcn primitives
// Pay attention to: Props interface, useState hooks near top, early-return validation, immutable array updates

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { HypothesisRisk } from "@/lib/types"

interface RisksResourcesFormProps {
  risks?: HypothesisRisk[]
  readOnly?: boolean
}

export function RisksResourcesForm({ risks: initialRisks = [], readOnly = false }: RisksResourcesFormProps) {
  const [risks, setRisks] = useState<HypothesisRisk[]>(initialRisks)
  const [newRisk, setNewRisk] = useState({ title: "", description: "", severity: 3 as 1 | 2 | 3 | 4 | 5 })

  const handleAddRisk = () => {
    if (!newRisk.title.trim()) return

    const risk: HypothesisRisk = {
      id: `risk-${Date.now()}`,
      title: newRisk.title,
      description: newRisk.description,
      severity: newRisk.severity,
      createdAt: new Date().toISOString(),
      createdBy: "",
    }

    setRisks([...risks, risk])
    setNewRisk({ title: "", description: "", severity: 3 })
  }

  return !readOnly ? <Button onClick={handleAddRisk}>Добавить</Button> : null
}
