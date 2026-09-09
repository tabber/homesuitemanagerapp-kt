"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { AlertTriangle, Bot, Check, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type MaintenanceChatRole = "assistant" | "tenant"
export type MaintenanceUrgency = "urgent" | "high" | "medium" | "low"

export interface MaintenanceChatMessage {
  role: MaintenanceChatRole
  text: string
}

export interface MaintenanceChatIntakeProps {
  messages: MaintenanceChatMessage[]
  isTyping: boolean
  readyToSubmit: boolean
  detectedCategory?: string
  detectedUrgency?: MaintenanceUrgency
  onSendMessage: (text: string) => void
  onSubmitRequest: () => Promise<void>
}

const urgencyStyles: Record<MaintenanceUrgency, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-sage/30 text-navy border-sage/50",
}

const urgencyLabels: Record<MaintenanceUrgency, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
}

export function MaintenanceChatIntake({
  messages,
  isTyping,
  readyToSubmit,
  detectedCategory,
  detectedUrgency,
  onSendMessage,
  onSubmitRequest,
}: MaintenanceChatIntakeProps) {
  const [draft, setDraft] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, isTyping, readyToSubmit])

  const canSend = draft.trim().length > 0 && !isTyping

  const sendDraft = () => {
    const text = draft.trim()
    if (!text || isTyping) return
    onSendMessage(text)
    setDraft("")
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendDraft()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    sendDraft()
  }

  const handleSubmitRequest = async () => {
    if (submitting || submitted) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmitRequest()
      setSubmitted(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "We couldn't submit your request. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isUrgent = detectedUrgency === "urgent"

  return (
    <Card className="flex h-full max-h-[720px] flex-col border-sage/50 bg-background">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <div
          role="log"
          aria-live="polite"
          aria-label="Maintenance intake conversation"
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"
        >
          {messages.length === 0 && !isTyping && (
            <p className="py-8 text-center text-sm text-text-muted">
              Describe the issue you&apos;re experiencing to get started.
            </p>
          )}

          {messages.map((message, index) =>
            message.role === "assistant" ? (
              <div key={index} className="flex items-end gap-2 self-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage/30 text-navy">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Assistant</span>
                </span>
                <div className="max-w-[80%] rounded-lg bg-sage/20 px-3 py-2 text-sm leading-relaxed text-navy">
                  {message.text}
                </div>
              </div>
            ) : (
              <div key={index} className="flex self-end">
                <span className="sr-only">You</span>
                <div className="max-w-[80%] rounded-lg bg-teal px-3 py-2 text-sm leading-relaxed text-white">
                  {message.text}
                </div>
              </div>
            )
          )}

          {isTyping && (
            <div className="flex items-end gap-2 self-start" aria-label="Assistant is typing">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage/30 text-navy">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-sage/20 px-3 py-2.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/60"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {readyToSubmit && (
            <div className="flex flex-col gap-3 pt-2">
              {isUrgent && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>This looks urgent — we&apos;re notifying your landlord immediately</p>
                </div>
              )}

              <div className="rounded-lg border border-sage/50 bg-sage/10 p-4">
                <h3 className="text-sm font-medium text-navy">Request summary</h3>
                <dl className="mt-3 flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-text-muted">Issue category</dt>
                    <dd className="text-right font-medium text-navy">
                      {detectedCategory ?? "General maintenance"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-text-muted">Urgency</dt>
                    <dd>
                      {detectedUrgency ? (
                        <Badge variant="outline" className={cn("border", urgencyStyles[detectedUrgency])}>
                          {urgencyLabels[detectedUrgency]}
                        </Badge>
                      ) : (
                        <span className="text-text-muted">Not determined</span>
                      )}
                    </dd>
                  </div>
                </dl>

                {submitError && (
                  <p role="alert" className="mt-3 text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={submitting || submitted}
                  className="mt-4 w-full bg-teal text-white hover:bg-teal-dark"
                >
                  {submitted ? (
                    <>
                      <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                      Request submitted
                    </>
                  ) : submitting ? (
                    "Submitting..."
                  ) : (
                    "Submit maintenance request"
                  )}
                </Button>
              </div>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-sage/50 pt-4">
          <label htmlFor="maintenance-chat-input" className="sr-only">
            Describe your maintenance issue
          </label>
          <Input
            id="maintenance-chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTyping ? "Assistant is typing..." : "Describe the issue..."}
            disabled={submitted}
            autoComplete="off"
            className="border-sage/50 text-navy"
          />
          <Button
            type="submit"
            disabled={!canSend || submitted}
            className="bg-teal text-white hover:bg-teal-dark"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default MaintenanceChatIntake
