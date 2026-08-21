import { Plus } from "lucide-react"

export default function UsersHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1 text-sm font-medium text-[#64748B]">
          Property Management
        </p>

        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#0F172A] sm:text-[28px]">
          Users & Residents
        </h1>

        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#64748B]">
          Manage apartment owners, tenants and residents from one place.
        </p>
      </div>

      <button
        type="button"
        className="
          inline-flex
          h-10
          shrink-0
          items-center
          justify-center
          gap-2
          rounded-lg
          bg-[#071D35]
          px-4
          text-sm
          font-semibold
          text-white
          transition-colors
          hover:bg-[#0D3158]
          focus:outline-none
          focus:ring-4
          focus:ring-[#071D35]/10
        "
      >
        <Plus className="size-4" />
        Invite User
      </button>
    </div>
  )
}