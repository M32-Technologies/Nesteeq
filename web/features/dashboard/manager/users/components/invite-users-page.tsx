"use client"

import Link from "next/link"
import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Info,
  Mail,
  Phone,
  Send,
  Upload,
  UserRound,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import {
  useBlocksQuery,
  useBulkCreateResidentInvitationsMutation,
  useCreateResidentInvitationMutation,
  useDownloadResidentInviteTemplateMutation,
  useFlatsQuery,
} from "../hooks/use-residents-query"
import type {
  BulkInviteResult,
  ResidentType,
} from "../types/users"

type InviteTab = "single" | "bulk"

type SingleInviteForm = {
  fullName: string
  email: string
  phoneNumber: string
  role: ResidentType | ""
  blockId: string
  flatId: string
}

const initialForm: SingleInviteForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  role: "",
  blockId: "",
  flatId: "",
}

export default function InviteUsersPage() {
  const [activeTab, setActiveTab] = useState<InviteTab>("single")
  const [form, setForm] = useState<SingleInviteForm>(initialForm)
  const [file, setFile] = useState<File | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkInviteResult | null>(null)
  const { data: blocks = [], isLoading: isBlocksLoading } = useBlocksQuery()
  const { data: flats = [], isLoading: isFlatsLoading } =
    useFlatsQuery(form.blockId)
  const createInvite = useCreateResidentInvitationMutation()
  const bulkInvite = useBulkCreateResidentInvitationsMutation()
  const downloadTemplate = useDownloadResidentInviteTemplateMutation()

  const selectedBlockName = useMemo(
    () => blocks.find((block) => block.id === form.blockId)?.name ?? "",
    [blocks, form.blockId]
  )

  const updateForm = (key: keyof SingleInviteForm, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "blockId" ? { flatId: "" } : {}),
    }))
  }

  const submitSingleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.fullName.trim() || !form.email.trim() || !form.role || !form.flatId) {
      toast.error("Fill all required fields")
      return
    }

    try {
      await createInvite.mutateAsync({
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber || null,
        flatId: form.flatId,
        role: form.role,
      })
      toast.success("Invitation sent")
      setForm(initialForm)
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send invitation"))
    }
  }

  const submitBulkInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!file) {
      toast.error("Choose an Excel file")
      return
    }

    try {
      const result = await bulkInvite.mutateAsync(file)
      setBulkResult(result)
      toast.success(`${result.created} invitations created`)
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload invitations"))
    }
  }

  const handleTemplateDownload = async () => {
    try {
      const template = await downloadTemplate.mutateAsync()
      const url = URL.createObjectURL(template)
      const link = document.createElement("a")

      link.href = url
      link.download = "resident-invite-template.xlsx"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to download template"))
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setBulkResult(null)
    setFile(event.target.files?.[0] ?? null)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
        <Link href="/property-manager" className="hover:text-slate-950">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/property-manager/users" className="hover:text-slate-950">
          Users
        </Link>
        <span>/</span>
        <span className="text-slate-950">Invite Users</span>
      </div>

      <div className="space-y-5">
        <Link
          href="/property-manager/users"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          Back to Users
        </Link>

        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-slate-950">
            Invite Users
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Send invitations to apartment owners and tenants.
          </p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div role="tablist" className="flex">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "single"}
            onClick={() => setActiveTab("single")}
            className={`inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-t-lg border border-b-0 px-5 text-sm font-semibold transition ${
              activeTab === "single"
                ? "border-slate-200 bg-white text-[#0F5F45] shadow-sm"
                : "border-transparent text-slate-700 hover:bg-white hover:text-slate-950"
            }`}
          >
            <UserRound size={16} />
            Single Invite
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bulk"}
            onClick={() => setActiveTab("bulk")}
            className={`inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-t-lg border border-b-0 px-5 text-sm font-semibold transition ${
              activeTab === "bulk"
                ? "border-slate-200 bg-white text-[#0F5F45] shadow-sm"
                : "border-transparent text-slate-700 hover:bg-white hover:text-slate-950"
            }`}
          >
            <FileSpreadsheet size={16} />
            Bulk Upload
          </button>
        </div>
      </div>

      {activeTab === "single" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
          <form onSubmit={submitSingleInvite} className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={<Users size={20} />}
                title="Personal Information"
                description="Basic details for the person receiving the invitation."
              />

              <div className="mt-6 space-y-5">
                <Field label="Full Name" required>
                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(event) => updateForm("fullName", event.target.value)}
                      placeholder="Enter full name"
                      className={inputClassName}
                    />
                  </div>
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Email Address" required>
                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => updateForm("email", event.target.value)}
                        placeholder="Enter email address"
                        className={inputClassName}
                      />
                    </div>
                  </Field>

                  <Field label="Phone Number">
                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="tel"
                        value={form.phoneNumber}
                        onChange={(event) =>
                          updateForm("phoneNumber", event.target.value)
                        }
                        placeholder="Enter phone number"
                        className={inputClassName}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={<Building2 size={20} />}
                title="Residence Information"
                description="Assign the invitee to a flat and resident type."
              />

              <div className="mt-6 space-y-5">
                <Field label="Resident Type" required>
                  <SelectWrap>
                    <select
                      value={form.role}
                      onChange={(event) =>
                        updateForm("role", event.target.value as ResidentType)
                      }
                      className={selectClassName}
                    >
                      <option value="">Select resident type</option>
                      <option value="owner">Owner</option>
                      <option value="resident">Tenant</option>
                    </select>
                  </SelectWrap>
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Block" required>
                    <SelectWrap>
                      <select
                        value={form.blockId}
                        onChange={(event) =>
                          updateForm("blockId", event.target.value)
                        }
                        className={selectClassName}
                      >
                        <option value="">
                          {isBlocksLoading ? "Loading blocks..." : "Select block"}
                        </option>
                        {blocks.map((block) => (
                          <option key={block.id} value={block.id}>
                            {block.name}
                          </option>
                        ))}
                      </select>
                    </SelectWrap>
                  </Field>

                  <Field label="Flat" required>
                    <SelectWrap>
                      <select
                        value={form.flatId}
                        onChange={(event) =>
                          updateForm("flatId", event.target.value)
                        }
                        disabled={!form.blockId || isFlatsLoading}
                        className={selectClassName}
                      >
                        <option value="">
                          {!form.blockId
                            ? "Select block first"
                            : isFlatsLoading
                              ? "Loading flats..."
                              : "Select flat"}
                        </option>
                        {flats.map((flat) => (
                          <option key={flat.id} value={flat.id}>
                            {selectedBlockName
                              ? `${selectedBlockName} - ${flat.flatNumber}`
                              : flat.flatNumber}
                          </option>
                        ))}
                      </select>
                    </SelectWrap>
                  </Field>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-between">
              <Link
                href="/property-manager/users"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-6 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={createInvite.isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send size={16} />
                {createInvite.isPending ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>

          <InviteHelpPanel />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
          <form onSubmit={submitBulkInvite} className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={<FileSpreadsheet size={20} />}
                title="Bulk Upload"
                description="Upload the resident invitation Excel file."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                  <Upload className="mx-auto text-slate-500" size={28} />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {file ? file.name : "Choose an .xlsx file"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    Maximum upload size is 5 MB.
                  </p>
                  <label className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-[#0F5F45] px-4 text-sm font-semibold text-white transition hover:bg-[#0B4D38]">
                    Select File
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleTemplateDownload}
                  disabled={downloadTemplate.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 md:self-start"
                >
                  <Download size={16} />
                  {downloadTemplate.isPending ? "Downloading..." : "Download Template"}
                </button>
              </div>
            </section>

            {bulkResult ? <BulkResultPanel result={bulkResult} /> : null}

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-between">
              <Link
                href="/property-manager/users"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-6 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={bulkInvite.isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Upload size={16} />
                {bulkInvite.isPending ? "Uploading..." : "Upload Invitations"}
              </button>
            </div>
          </form>

          <BulkHelpPanel />
        </div>
      )}
    </div>
  )
}

const inputClassName =
  "h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10"

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0F5F45] text-white">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-900">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
    </label>
  )
}

function SelectWrap({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
      />
    </div>
  )
}

function InviteHelpPanel() {
  return (
    <aside className="space-y-5">
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Info size={17} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              How Invitation Works
            </h3>
            <div className="mt-4 space-y-3 text-sm font-medium leading-6 text-slate-700">
              <p>An invitation email will be sent to the email address provided.</p>
              <p>The user can accept the invitation and set up their account.</p>
              <HelpItem>User will receive an email invitation</HelpItem>
              <HelpItem>They can accept and create an account</HelpItem>
              <HelpItem>You can track the invitation status</HelpItem>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
            <AlertCircle size={17} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Important Notes
            </h3>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm font-medium text-slate-700">
              <li>Use a correct and active email address</li>
              <li>Each invite is only for Owner or Tenant</li>
              <li>You can resend pending invitations later</li>
            </ul>
          </div>
        </div>
      </section>
    </aside>
  )
}

function BulkHelpPanel() {
  return (
    <aside className="space-y-5">
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Info size={17} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Bulk Upload Rules
            </h3>
            <div className="mt-4 space-y-3 text-sm font-medium leading-6 text-slate-700">
              <HelpItem>Download the Excel template first</HelpItem>
              <HelpItem>Use only Owner or Tenant as the role</HelpItem>
              <HelpItem>Upload one .xlsx file at a time</HelpItem>
            </div>
          </div>
        </div>
      </section>
    </aside>
  )
}

function HelpItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 size={16} className="shrink-0 text-blue-600" />
      <span>{children}</span>
    </div>
  )
}

function BulkResultPanel({ result }: { result: BulkInviteResult }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Upload Result</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <ResultStat label="Total" value={result.total} />
        <ResultStat label="Created" value={result.created} />
        <ResultStat label="Skipped" value={result.skipped} />
        <ResultStat label="Failed" value={result.failed} />
      </div>

      {result.results.length > 0 ? (
        <div className="mt-5 max-h-[260px] overflow-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Row
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Email
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.results.map((row) => (
                <tr key={`${row.row}-${row.email}`}>
                  <td className="px-3 py-2 font-medium text-slate-700">
                    {row.row}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-700">
                    {row.email}
                  </td>
                  <td className="px-3 py-2 font-semibold capitalize text-slate-900">
                    {row.status}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-600">
                    {row.reason ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

function ResultStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  const apiError = error as {
    response?: {
      data?: {
        message?: string
        error?: string
      }
    }
  }

  return apiError.response?.data?.message ?? apiError.response?.data?.error ?? fallback
}
