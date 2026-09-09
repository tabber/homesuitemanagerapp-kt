"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, CheckCircle2, Loader2, MapPin, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export interface ContractorJob {
  id: string
  propertyAddress: string
  unitNumber?: string
  priority: string
  title: string
  description: string
  currentStatus: string
}

export interface ContractorJobUpdatePageProps {
  job: ContractorJob
  onUpdateStatus: (status: string) => Promise<void>
  onSubmitUpdate: (notes: string, photos: File[]) => Promise<void>
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "on_my_way", label: "On my way" },
  { value: "started", label: "Started" },
  { value: "completed", label: "Completed" },
]

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  on_my_way: "On my way",
  started: "Started",
  in_progress: "In progress",
  completed: "Completed",
}

function formatStatus(status: string) {
  if (STATUS_LABELS[status]) return STATUS_LABELS[status]
  return status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

function priorityClasses(priority: string) {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "bg-destructive/10 text-destructive border-destructive/30"
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-300"
    case "medium":
      return "bg-warning/15 text-warning border-warning/40"
    default:
      return "bg-sage/40 text-navy border-sage"
  }
}

function statusBadgeClasses(status: string) {
  if (status === "completed") return "bg-success/15 text-success border-success/40"
  if (status === "started" || status === "in_progress" || status === "on_my_way")
    return "bg-teal/15 text-teal-dark border-teal/40"
  return "bg-sage/40 text-navy border-sage"
}

interface PhotoPreview {
  file: File
  url: string
}

export function ContractorJobUpdatePage({
  job,
  onUpdateStatus,
  onSubmitUpdate,
}: ContractorJobUpdatePageProps) {
  const [status, setStatus] = useState(job.currentStatus)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [notes, setNotes] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Release object URLs when previews change or the component unmounts
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [photos])

  const handleStatusChange = async (nextStatus: string) => {
    if (statusUpdating || nextStatus === status) return
    const previous = status
    setStatus(nextStatus)
    setStatusError(null)
    setStatusUpdating(true)
    try {
      await onUpdateStatus(nextStatus)
    } catch (err) {
      setStatus(previous)
      setStatusError(err instanceof Error ? err.message : "Could not update status. Please try again.")
    } finally {
      setStatusUpdating(false)
    }
  }

  const addFiles = (fileList: FileList | File[]) => {
    const images = Array.from(fileList).filter((f) => f.type.startsWith("image/"))
    if (images.length === 0) return
    setPhotos((prev) => [
      ...prev,
      ...images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ])
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const next = [...prev]
      const [removed] = next.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed.url)
      return next
    })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const handleSubmit = async () => {
    if (submitting) return
    if (!notes.trim() && photos.length === 0) {
      setSubmitError("Add a note or at least one photo before sending.")
      return
    }
    setSubmitError(null)
    setSubmitting(true)
    try {
      await onSubmitUpdate(
        notes.trim(),
        photos.map((p) => p.file)
      )
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not send update. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = !submitting && (notes.trim().length > 0 || photos.length > 0)

  return (
    <main className="min-h-screen bg-sage/10 px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <Card className="border-sage/50 bg-background">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 text-navy">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-snug text-pretty">
                    {job.propertyAddress}
                  </span>
                  {job.unitNumber && (
                    <span className="text-xs text-text-muted">Unit {job.unitNumber}</span>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 capitalize ${priorityClasses(job.priority)}`}
              >
                {job.priority}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl font-medium text-navy text-balance">{job.title}</CardTitle>
              {job.description && (
                <p className="text-sm leading-relaxed text-text-muted text-pretty">{job.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-text-muted">Status</span>
              <Badge variant="outline" className={statusBadgeClasses(status)}>
                {formatStatus(status)}
              </Badge>
              {statusUpdating && (
                <Loader2
                  className="h-4 w-4 animate-spin text-text-muted"
                  aria-label="Updating status"
                />
              )}
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {submitted ? (
              <div
                role="status"
                className="flex flex-col items-center gap-3 rounded-lg border border-sage/50 bg-sage/10 px-4 py-8 text-center"
              >
                <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <p className="text-base font-medium text-navy">Update sent</p>
                  <p className="text-sm text-text-muted">The landlord has been notified.</p>
                </div>
              </div>
            ) : (
              <>
                <section aria-labelledby="status-heading" className="flex flex-col gap-2">
                  <h2 id="status-heading" className="text-sm font-medium text-navy">
                    Update status
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((option) => {
                      const active = status === option.value
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          variant={active ? "default" : "outline"}
                          disabled={statusUpdating}
                          aria-pressed={active}
                          onClick={() => handleStatusChange(option.value)}
                          className={
                            active
                              ? "h-11 bg-teal text-white hover:bg-teal-dark"
                              : "h-11 border-sage/50 text-navy hover:bg-sage/20"
                          }
                        >
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>
                  {statusError && (
                    <p role="alert" className="text-sm text-destructive">
                      {statusError}
                    </p>
                  )}
                </section>

                <section aria-labelledby="photos-heading" className="flex flex-col gap-2">
                  <h2 id="photos-heading" className="text-sm font-medium text-navy">
                    Photos
                  </h2>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Add photos"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                      isDragging ? "border-teal bg-teal/10" : "border-sage/50 bg-sage/10 hover:bg-sage/20"
                    }`}
                  >
                    <Camera className="h-8 w-8 text-text-muted" aria-hidden="true" />
                    <p className="text-sm text-navy">Tap to take or add photos</p>
                    <p className="text-xs text-text-muted">or drag and drop images here</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files) addFiles(e.target.files)
                        e.target.value = ""
                      }}
                    />
                  </div>

                  {photos.length > 0 && (
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {photos.map((photo, index) => (
                        <li key={photo.url} className="relative aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={`Photo ${index + 1}: ${photo.file.name}`}
                            className="h-full w-full rounded-md border border-sage/50 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            aria-label={`Remove photo ${index + 1}`}
                            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-white shadow"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-labelledby="notes-heading" className="flex flex-col gap-2">
                  <label id="notes-heading" htmlFor="contractor-notes" className="text-sm font-medium text-navy">
                    Add a note for the landlord (optional)
                  </label>
                  <Textarea
                    id="contractor-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you find? What was done? Anything the landlord should know?"
                    className="min-h-[110px] border-sage/50 text-navy placeholder:text-text-muted"
                  />
                </section>

                {submitError && (
                  <p role="alert" className="text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="h-12 w-full bg-teal text-base text-white hover:bg-teal-dark"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    "Send update"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default ContractorJobUpdatePage
