"use client"

import Link from "next/link"
import {
  CheckCircle2,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react"
import type { ReactNode } from "react"

import type { PropertyFlat } from "../types/property"

type FlatActionMenuProps = {
  flat: PropertyFlat
  open: boolean
  onToggle: () => void
  onViewDetails: () => void
  onEdit: () => void
  onDeactivate: () => void
  onReactivate: () => void
}

export default function FlatActionsMenu({
  flat,
  open,
  onToggle,
  onViewDetails,
  onEdit,
  onDeactivate,
  onReactivate,
}: FlatActionMenuProps) {
  const actions = getFlatMenuActions({
    flat,
    onViewDetails,
    onEdit,
    onDeactivate,
    onReactivate,
  })

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`Open actions for ${flat.flatNumber}`}
        className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
          {actions.map((action, index) =>
            action.type === "separator" ? (
              <div key={`separator-${index}`} className="my-1 border-t border-slate-100" />
            ) : action.href ? (
              <Link
                key={action.label}
                href={action.href}
                className={actionClassName(action.tone)}
              >
                {action.icon}
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={actionClassName(action.tone)}
              >
                {action.icon}
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

type MenuAction =
  | {
      type: "item"
      label: string
      icon: ReactNode
      tone?: "default" | "danger"
      href?: string
      onClick?: () => void
    }
  | {
      type: "separator"
}

function getFlatMenuActions({
  flat,
  onViewDetails,
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  flat: PropertyFlat
  onViewDetails: () => void
  onEdit: () => void
  onDeactivate: () => void
  onReactivate: () => void
}): MenuAction[] {
  const isActive = flat.status === "active"
  const isVacant = flat.occupancyStatus === "VACANT"
  const hasResident = Boolean(flat.residentId)

  if (!isActive) {
    return [
      {
        type: "item",
        label: "View Details",
        icon: <Eye size={15} />,
        onClick: onViewDetails,
      },
      {
        type: "separator",
      },
      {
        type: "item",
        label: "Reactivate Flat",
        icon: <CheckCircle2 size={15} />,
        onClick: onReactivate,
      },
    ]
  }

  const actions: MenuAction[] = [
    {
      type: "item",
      label: "View Details",
      icon: <Eye size={15} />,
      onClick: onViewDetails,
    },
    {
      type: "item",
      label: "Edit Flat",
      icon: <Pencil size={15} />,
      onClick: onEdit,
    },
    {
      type: "separator",
    },
  ]

  if (isVacant) {
    actions.push(
      {
        type: "item",
        label: "Assign Owner",
        icon: <UserPlus size={15} />,
        href: getInviteHref(flat, "owner"),
      },
      {
        type: "item",
        label: "Assign Tenant",
        icon: <UserPlus size={15} />,
        href: getInviteHref(flat, "resident"),
      }
    )
  } else if (hasResident) {
    actions.push({
      type: "item",
      label: "View Resident",
      icon: <UserRound size={15} />,
      onClick: onViewDetails,
    })
  }

  actions.push(
    {
      type: "separator",
    },
    {
      type: "item",
      label: "Deactivate Flat",
      icon: <Trash2 size={15} />,
      tone: "danger",
      onClick: onDeactivate,
    }
  )

  return actions
}

function getInviteHref(flat: PropertyFlat, role: "owner" | "resident") {
  const params = new URLSearchParams({
    role,
    flatId: flat.id,
    blockId: flat.blockId,
    flatNumber: flat.flatNumber,
  })

  return `/property-manager/users/invite?${params.toString()}`
}

function actionClassName(tone?: "default" | "danger") {
  const color =
    tone === "danger"
      ? "text-red-600 hover:bg-red-50"
      : "text-slate-700 hover:bg-slate-50"

  return `flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${color}`
}
