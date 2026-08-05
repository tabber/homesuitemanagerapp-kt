"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Search,
  Download,
  Trash2,
  Upload,
  File as FileIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface DocRow {
  id: string
  fileName: string
  filePath: string
  fileSize: number | null
  docType: string
  createdAt: string | null
  propertyId: string | null
  propertyName: string
  leaseId: string | null
  tenantName: string
}


const PROVINCE_RESOURCES: Record<
  string,
  { label: string; links: { name: string; description: string; url: string }[] }
> = {
  BC: {
    label: "British Columbia",
    links: [
      {
        name: "RTB tenancy forms (all)",
        description:
          "Official Residential Tenancy Branch forms — notices, agreements, condition inspection reports",
        url: "https://www2.gov.bc.ca/gov/content/housing-tenancy/residential-tenancies/calculators-and-resources/tenancy-forms",
      },
      {
        name: "RTB forms listed by number",
        description: "Look up a specific RTB form number with current revision dates",
        url: "https://www2.gov.bc.ca/gov/content/housing-tenancy/residential-tenancies/calculators-and-resources/tenancy-forms/forms-listed-number",
      },
    ],
  },
  ON: {
    label: "Ontario",
    links: [
      {
        name: "Landlord and Tenant Board",
        description:
          "Official LTB forms (N-series notices, L-series applications) and filing information",
        url: "https://tribunalsontario.ca/ltb/",
      },
    ],
  },
}

const DOC_TYPES = [
  { value: "lease", label: "Lease agreement" },
  { value: "notice", label: "Notice" },
  { value: "receipt", label: "Receipt" },
  { value: "inspection", label: "Inspection report" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
]

function formatSize(bytes: number | null) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d)
}

export default function LandlordDocuments() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [docs, setDocs] = useState<DocRow[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [leases, setLeases] = useState<any[]>([])

  const [search, setSearch] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const [showUpload, setShowUpload] = useState(false)
  const [uploadLeaseId, setUploadLeaseId] = useState("")
  const [uploadType, setUploadType] = useState("other")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [province, setProvince] = useState("BC")

  const load = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setUserId(user.id)

    const { data: props } = await supabase
      .from("properties")
      .select("id, name")
      .eq("landlord_id", user.id)
      .order("name", { ascending: true })

    const propMap = new Map<string, string>()
    ;(props ?? []).forEach((p: any) => propMap.set(p.id, p.name))
    setProperties((props ?? []).map((p: any) => ({ id: p.id, name: p.name })))

    const { data: leaseRows } = await supabase
      .from("leases")
      .select("id, tenant_name, property_id, status")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false })

    const leaseMap = new Map<string, any>()
    ;(leaseRows ?? []).forEach((l: any) => leaseMap.set(l.id, l))
    setLeases(
      (leaseRows ?? [])
        .filter((l: any) => l.status === "active" || l.status === "pending")
        .map((l: any) => ({
          ...l,
          label:
            `${l.tenant_name || "Tenant"}` +
            (propMap.get(l.property_id) ? ` — ${propMap.get(l.property_id)}` : ""),
        }))
    )

    const { data: docRows } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })

    setDocs(
      (docRows ?? []).map((d: any) => {
        const lease = d.lease_id ? leaseMap.get(d.lease_id) : null
        return {
          id: d.id,
          fileName: d.file_name ?? "Untitled",
          filePath: d.file_url ?? "",
          fileSize: d.file_size ?? null,
          docType: d.document_type ?? "other",
          createdAt: d.created_at ?? null,
          propertyId: d.property_id ?? null,
          propertyName:
            (d.property_id && propMap.get(d.property_id)) ||
            (lease?.property_id && propMap.get(lease.property_id)) ||
            "—",
          leaseId: d.lease_id ?? null,
          tenantName: lease?.tenant_name || "—",
        }
      })
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = async (doc: DocRow) => {
    if (!doc.filePath) {
      toast.error("This document has no stored file")
      return
    }
    setBusyId(doc.id)
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.filePath, 60)
    setBusyId(null)
    if (error || !data?.signedUrl) {
      toast.error(error?.message || "Could not open this document")
      return
    }
    window.open(data.signedUrl, "_blank")
  }

  const handleDelete = async (doc: DocRow) => {
    setBusyId(doc.id)
    const supabase = createClient()
    const { error } = await supabase.from("documents").delete().eq("id", doc.id)
    if (!error && doc.filePath) {
      await supabase.storage.from("documents").remove([doc.filePath])
    }
    setBusyId(null)
    if (error) {
      toast.error(error.message || "Could not delete this document")
      return
    }
    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
    toast.success("Document deleted")
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadLeaseId || !userId || uploading) return
    setUploading(true)
    const supabase = createClient()

    const lease = leases.find((l) => l.id === uploadLeaseId)
    const filePath = `${uploadLeaseId}/${Date.now()}-${uploadFile.name}`

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, uploadFile, { upsert: false })

    if (uploadError) {
      setUploading(false)
      toast.error(uploadError.message)
      return
    }

    const { error: insertError } = await supabase.from("documents").insert({
      lease_id: uploadLeaseId,
      property_id: lease?.property_id ?? null,
      uploaded_by: userId,
      document_type: uploadType,
      file_url: filePath,
      file_name: uploadFile.name,
      file_size: uploadFile.size,
    })

    setUploading(false)
    if (insertError) {
      toast.error(insertError.message)
      return
    }

    toast.success("Document uploaded")
    setShowUpload(false)
    setUploadFile(null)
    setUploadLeaseId("")
    setUploadType("other")
    load()
  }

  const filtered = docs.filter((d) => {
    const matchesSearch =
      !search ||
      d.fileName.toLowerCase().includes(search.toLowerCase()) ||
      d.tenantName.toLowerCase().includes(search.toLowerCase())
    const matchesProperty =
      propertyFilter === "all" || d.propertyId === propertyFilter
    const matchesType = typeFilter === "all" || d.docType === typeFilter
    return matchesSearch && matchesProperty && matchesType
  })

  const typeLabel = (value: string) =>
    DOC_TYPES.find((t) => t.value === value)?.label ??
    value.charAt(0).toUpperCase() + value.slice(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-navy">Documents</h1>
          <p className="text-sm text-text-muted mt-1">
            Leases, notices, receipts and reports across your properties
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-teal hover:bg-teal-dark text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload document
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-sage/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search file or tenant name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-sage"
              />
            </div>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-52 border-sage">
                <SelectValue placeholder="All properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All properties</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44 border-sage">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-sage/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-navy">
            {loading
              ? "Loading documents..."
              : `${filtered.length} document${filtered.length === 1 ? "" : "s"}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && docs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload leases, notices, receipts or inspection reports and they'll be organised here by property and tenant."
              actionLabel="Upload document"
              onAction={() => setShowUpload(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-text-muted py-10"
                    >
                      {loading ? "Loading..." : "No documents match your filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-teal flex-shrink-0" />
                          <span className="text-navy font-medium truncate max-w-[220px]">
                            {doc.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {typeLabel(doc.docType)}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {doc.propertyName}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {doc.tenantName}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {formatSize(doc.fileSize)}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {formatDate(doc.createdAt)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === doc.id}
                          onClick={() => handleDownload(doc)}
                          className="text-navy hover:bg-navy/5"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === doc.id}
                          onClick={() => handleDelete(doc)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provincial forms */}
      <Card className="border-sage/50">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-medium text-navy">
                Official tenancy forms
              </CardTitle>
              <p className="text-sm text-text-muted mt-1">
                Government sources for notices, agreements and inspection reports
              </p>
            </div>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger className="w-52 border-sage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVINCE_RESOURCES).map(([code, p]) => (
                  <SelectItem key={code} value={code}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {PROVINCE_RESOURCES[province]?.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 bg-sage/10 rounded-lg hover:bg-sage/20 transition-colors"
              >
                <div className="w-10 h-10 rounded bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-navy text-sm">{link.name}</p>
                  <p className="text-xs text-text-muted mt-1">{link.description}</p>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-4">
            Form numbers and requirements change — always download the current
            version from the official source before serving a notice. HomeSuite
            links to these pages for convenience and does not provide legal advice.
          </p>
        </CardContent>
      </Card>

      {/* Upload modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Upload document</DialogTitle>
          </DialogHeader>
          {leases.length === 0 ? (
            <p className="py-6 text-sm text-text-muted text-center">
              You need an active lease before you can attach documents.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="lease">Attach to lease</Label>
                <Select value={uploadLeaseId} onValueChange={setUploadLeaseId}>
                  <SelectTrigger id="lease">
                    <SelectValue placeholder="Select a lease" />
                  </SelectTrigger>
                  <SelectContent>
                    {leases.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Document type</Label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="border-sage"
                />
                {uploadFile && (
                  <p className="text-xs text-text-muted mt-1">
                    {uploadFile.name} · {formatSize(uploadFile.size)}
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUpload(false)}
                  className="border-sage text-navy hover:bg-sage/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadLeaseId || uploading}
                  className="bg-teal hover:bg-teal-dark text-white"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
