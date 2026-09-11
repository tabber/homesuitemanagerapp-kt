"use client"

/**
 * TenantReport — a printable record for a single tenant/lease.
 *
 * Pulls from three tables that already exist:
 *   - leases   (lease terms + tenant identity fields)
 *   - payments (dated payment history)
 *   - messages (two-way landlord/tenant communication log)
 *
 * Everything renders on screen; the "Print / Save as PDF" button uses the
 * browser's native print (window.print) against a print-only stylesheet, so
 * there's no PDF library or server work involved.
 *
 * IMPORTANT: This is a self-contained component. It does not modify any
 * existing file. Drop it into a lease/tenant view and pass the leaseId.
 *
 * Data-honesty note: the payment section shows each payment's stored status
 * verbatim (e.g. "pending" vs "completed") and does NOT compute a "total
 * paid", because payment status is the thing most likely to be mid-flow.
 * Showing the raw ledger is truthful; a computed total could mislead.
 */

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

type Lease = {
  id: string
  tenant_id: string | null
  tenant_name: string | null
  tenant_email: string | null
  tenant_phone: string | null
  landlord_name: string | null
  property_id: string | null
  unit_id: string | null
  start_date: string | null
  end_date: string | null
  monthly_rent: number | null
  security_deposit: number | null
  payment_due_day: number | null
  status: string | null
}

type Payment = {
  id: string
  amount: number | null
  payment_date: string | null
  payment_method: string | null
  status: string | null
}

type Message = {
  id: string
  sender_id: string | null
  recipient_id: string | null
  subject: string | null
  content: string | null
  created_at: string | null
}

interface TenantReportProps {
  leaseId: string
  /** The landlord's own user id, so we can label who sent each message. */
  landlordId: string
  landlordName?: string
  propertyName?: string
  unitNumber?: string
  onClose?: () => void
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function fmtDateTime(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function fmtMoney(n: number | null) {
  if (n == null) return "—"
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(n)
}

export function TenantReport({
  leaseId,
  landlordId,
  landlordName,
  propertyName,
  unitNumber,
  onClose,
}: TenantReportProps) {
  const [lease, setLease] = useState<Lease | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  // Which sections to include in the printout
  const [includePayments, setIncludePayments] = useState(true)
  const [includeMessages, setIncludeMessages] = useState(true)

  // Message date-range filter (empty = no bound)
  const [msgFrom, setMsgFrom] = useState("")
  const [msgTo, setMsgTo] = useState("")

  const generatedAt = useRef(new Date())

  useEffect(() => {
    let mounted = true
    async function load() {
      const supabase = createClient()

      const { data: leaseRow } = await supabase
        .from("leases")
        .select(
          "id, tenant_id, tenant_name, tenant_email, tenant_phone, landlord_name, property_id, unit_id, start_date, end_date, monthly_rent, security_deposit, payment_due_day, status"
        )
        .eq("id", leaseId)
        .maybeSingle()

      const { data: payRows } = await supabase
        .from("payments")
        .select("id, amount, payment_date, payment_method, status")
        .eq("lease_id", leaseId)
        .order("payment_date", { ascending: false })

      // Messages between THIS landlord and THIS tenant. Messages are not
      // reliably stamped with lease_id (general inbox messages omit it), so
      // filtering by lease_id alone would silently drop most of the real
      // conversation. Instead we match the landlord<->tenant pair in both
      // directions, which mirrors how the inbox groups a conversation.
      let msgRows: Message[] = []
      const tenantId = (leaseRow as Lease | null)?.tenant_id
      if (leaseRow && tenantId) {
        const { data: mRows } = await supabase
          .from("messages")
          .select("id, sender_id, recipient_id, subject, content, created_at")
          .or(
            `and(sender_id.eq.${landlordId},recipient_id.eq.${tenantId}),and(sender_id.eq.${tenantId},recipient_id.eq.${landlordId})`
          )
          .order("created_at", { ascending: true })
        msgRows = mRows ?? []
      }

      if (!mounted) return
      setLease(leaseRow as Lease | null)
      setPayments(payRows ?? [])
      setMessages(msgRows)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [leaseId, landlordId])

  const filteredMessages = messages.filter((m) => {
    if (!m.created_at) return false
    const t = new Date(m.created_at).getTime()
    if (msgFrom && t < new Date(msgFrom).getTime()) return false
    if (msgTo) {
      // include the whole "to" day
      const end = new Date(msgTo)
      end.setHours(23, 59, 59, 999)
      if (t > end.getTime()) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-text-muted">
        Loading tenant record…
      </div>
    )
  }

  if (!lease) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-text-muted">
          Couldn&apos;t load this tenant record. Try again, or pick the lease
          from the property view.
        </p>
      </div>
    )
  }

  const tenantName = lease.tenant_name || "Tenant"

  // If the lease has no linked tenant_id yet (invite not accepted), the
  // conversation can't be matched — say so rather than showing an empty list
  // that looks like "no messages".
  const tenantNotLinked = !lease.tenant_id

  return (
    <div className="tenant-report-root">
      {/* Print styles: only the .report-sheet prints; controls are hidden. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-sheet, .report-sheet * { visibility: visible; }
          .report-sheet { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
          .report-section { break-inside: avoid; }
          .msg-entry { break-inside: avoid; }
        }
        .report-sheet { color: #1B2E22; }
        .report-sheet h1 { font-family: Georgia, serif; }
        .report-sheet h2 { font-family: Georgia, serif; }
      `}</style>

      {/* ---- Controls (never printed) ---- */}
      <div className="no-print mb-4 flex flex-wrap items-end gap-4 rounded-lg border border-sage/50 bg-sage/10 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted mb-1">
            Include in report
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={includePayments}
                onChange={(e) => setIncludePayments(e.target.checked)}
              />
              Payment history
            </label>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={includeMessages}
                onChange={(e) => setIncludeMessages(e.target.checked)}
              />
              Communication log
            </label>
          </div>
        </div>

        {includeMessages && (
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">
                Messages from
              </label>
              <input
                type="date"
                value={msgFrom}
                onChange={(e) => setMsgFrom(e.target.value)}
                className="rounded-md border border-sage px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">
                to
              </label>
              <input
                type="date"
                value={msgTo}
                onChange={(e) => setMsgTo(e.target.value)}
                className="rounded-md border border-sage px-2 py-1 text-sm"
              />
            </div>
          </div>
        )}

        <div className="ml-auto flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md border border-navy/20 px-4 py-2 text-sm text-navy hover:bg-navy/5"
            >
              Close
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ---- The printable sheet ---- */}
      <div className="report-sheet mx-auto max-w-3xl bg-white p-8">
        {/* Header */}
        <div className="mb-6 border-b-2 border-[#1F3B2C] pb-4">
          <h1 className="text-2xl font-semibold text-[#1F3B2C]">
            Tenant Record
          </h1>
          <p className="mt-1 text-sm text-[#4B5A50]">
            {tenantName}
            {propertyName ? ` · ${propertyName}` : ""}
            {unitNumber ? ` · Unit ${unitNumber}` : ""}
          </p>
          <p className="mt-2 text-xs text-[#8A8373]">
            Generated {fmtDateTime(generatedAt.current.toISOString())} · HomeSuite
            Manager record, for reference
          </p>
        </div>

        {/* Lease & tenant summary */}
        <section className="report-section mb-6">
          <h2 className="mb-3 text-base font-semibold text-[#1F3B2C]">
            Lease &amp; tenant
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Field label="Tenant" value={tenantName} />
            <Field label="Status" value={lease.status ?? "—"} />
            <Field label="Email" value={lease.tenant_email ?? "—"} />
            <Field label="Phone" value={lease.tenant_phone ?? "—"} />
            <Field
              label="Landlord"
              value={lease.landlord_name || landlordName || "—"}
            />
            <Field
              label="Lease period"
              value={`${fmtDate(lease.start_date)} – ${fmtDate(lease.end_date)}`}
            />
            <Field label="Monthly rent" value={fmtMoney(lease.monthly_rent)} />
            <Field
              label="Security deposit"
              value={fmtMoney(lease.security_deposit)}
            />
            <Field
              label="Rent due day"
              value={
                lease.payment_due_day
                  ? `Day ${lease.payment_due_day} of each month`
                  : "—"
              }
            />
          </div>
        </section>

        {/* Payment history */}
        {includePayments && (
          <section className="report-section mb-6">
            <h2 className="mb-3 text-base font-semibold text-[#1F3B2C]">
              Payment history
            </h2>
            {payments.length === 0 ? (
              <p className="text-sm text-[#8A8373]">
                No payments recorded for this tenant.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBD6C8] text-left text-xs uppercase tracking-wide text-[#8A8373]">
                    <th className="py-2">Date</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-[#EEEBE0]">
                      <td className="py-2">{fmtDate(p.payment_date)}</td>
                      <td className="py-2 capitalize">
                        {(p.payment_method ?? "—").replace(/_/g, " ")}
                      </td>
                      <td className="py-2 capitalize">{p.status ?? "—"}</td>
                      <td className="py-2 text-right">{fmtMoney(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-2 text-xs text-[#8A8373]">
              Status reflects each payment as recorded. Payments marked pending
              are awaiting landlord confirmation.
            </p>
          </section>
        )}

        {/* Communication log */}
        {includeMessages && (
          <section className="report-section">
            <h2 className="mb-1 text-base font-semibold text-[#1F3B2C]">
              Communication log
            </h2>
            <p className="mb-3 text-xs text-[#8A8373]">
              {msgFrom || msgTo
                ? `Showing messages ${msgFrom ? `from ${fmtDate(msgFrom)}` : ""} ${
                    msgTo ? `to ${fmtDate(msgTo)}` : ""
                  }`.trim()
                : "Showing all messages on record"}
            </p>
            {tenantNotLinked ? (
              <p className="text-sm text-[#8A8373]">
                This tenant hasn&apos;t accepted their invitation yet, so there
                is no linked message history to show.
              </p>
            ) : filteredMessages.length === 0 ? (
              <p className="text-sm text-[#8A8373]">
                No messages in this range.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map((m) => {
                  const fromLandlord = m.sender_id === landlordId
                  return (
                    <div
                      key={m.id}
                      className="msg-entry border-l-2 pl-3"
                      style={{
                        borderColor: fromLandlord ? "#2E6B4C" : "#B8912E",
                      }}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-[#1B2E22]">
                          {fromLandlord
                            ? landlordName || lease.landlord_name || "Landlord"
                            : tenantName}
                        </span>
                        <span className="text-xs text-[#8A8373]">
                          {fmtDateTime(m.created_at)}
                        </span>
                      </div>
                      {m.subject && (
                        <p className="text-sm font-medium text-[#4B5A50]">
                          {m.subject}
                        </p>
                      )}
                      {m.content && (
                        <p className="whitespace-pre-line text-sm text-[#1B2E22]">
                          {m.content}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Footer line on print */}
        <div className="mt-8 border-t border-[#DBD6C8] pt-3 text-xs text-[#8A8373]">
          This record was generated by HomeSuite Manager for the landlord&apos;s
          reference. It reflects information stored in the account as of the
          generation date above.
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[#8A8373]">{label}</p>
      <p className="text-[#1B2E22]">{value}</p>
    </div>
  )
}
