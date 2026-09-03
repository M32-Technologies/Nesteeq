import {
  Building2,
  DoorOpen,
  Grid2X2Plus,
  Home,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { PropertyStats, PropertyTab } from "../types/property";

type PropertyHeaderProps = {
  stats?: PropertyStats;
  isLoading: boolean;
  apartmentTotalBlocks: number;
  isApartmentLoading: boolean;
  activeBlockCount: number;
  isActiveBlockCountLoading: boolean;
  activeTab: PropertyTab;
  isAddBlockDisabled: boolean;
  addBlockDisabledReason: string;
  onTabChange: (tab: PropertyTab) => void;
  onAddBlockClick: () => void;
  onAddFlatClick: () => void;
  onGenerateFlatsClick: () => void;
};

export default function PropertyHeader({
  stats,
  isLoading,
  apartmentTotalBlocks,
  isApartmentLoading,
  activeBlockCount,
  isActiveBlockCountLoading,
  activeTab,
  isAddBlockDisabled,
  addBlockDisabledReason,
  onTabChange,
  onAddBlockClick,
  onAddFlatClick,
  onGenerateFlatsClick,
}: PropertyHeaderProps) {
  const cards: {
    title: string;
    description: string;
    value: number | string;
    icon: LucideIcon;
    accent: string;
    iconBg: string;
    iconColor: string;
    isValueLoading?: boolean;
  }[] = [
    {
      title: "Blocks",
      description: "Created / apartment total",
      value:
        apartmentTotalBlocks > 0
          ? `${activeBlockCount} / ${apartmentTotalBlocks}`
          : activeBlockCount,
      icon: Building2,
      accent: "bg-slate-900",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
      isValueLoading: isActiveBlockCountLoading || isApartmentLoading,
    },
    {
      title: "Total Flats",
      description: "Configured apartment units",
      value: stats?.totalFlats ?? 0,
      icon: Home,
      accent: "bg-[#0F5F45]",
      iconBg: "bg-[#E7F4EE]",
      iconColor: "text-[#0F5F45]",
      isValueLoading: isLoading,
    },
    {
      title: "Occupied",
      description: "Owner and tenant flats",
      value: stats?.occupiedFlats ?? 0,
      icon: Users,
      accent: "bg-sky-500",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-700",
      isValueLoading: isLoading,
    },
    {
      title: "Vacant",
      description: "Available flats",
      value: stats?.vacantFlats ?? 0,
      icon: DoorOpen,
      accent: "bg-amber-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
      isValueLoading: isLoading,
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">
            Property
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage apartment blocks, floors, flats, and occupancy.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onAddBlockClick}
            disabled={isAddBlockDisabled}
            title={isAddBlockDisabled ? addBlockDisabledReason : "Add Block"}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            <Plus size={16} strokeWidth={2.25} />
            Add Block
          </button>

          <button
            type="button"
            onClick={onAddFlatClick}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <DoorOpen size={16} strokeWidth={2.25} />
            Add Flat
          </button>

          <button
            type="button"
            onClick={onGenerateFlatsClick}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0F5F45] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B4D38]"
          >
            <Grid2X2Plus size={16} strokeWidth={2.25} />
            Generate Flats
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
            >
              <span
                className={`absolute inset-y-0 left-0 w-[3px] ${card.accent}`}
              />

              <div className="flex items-start justify-between pl-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-700">
                    {card.title}
                  </p>
                  <p className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none tracking-tight text-slate-900">
                    {card.isValueLoading ? (
                      <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-100 align-middle" />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
                >
                  <Icon size={17} strokeWidth={2} />
                </div>
              </div>

              <p className="mt-2.5 pl-2 text-xs font-medium text-slate-600">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      <div
        role="tablist"
        className="flex items-center gap-6 border-b border-slate-200"
      >
        {(["blocks", "flats"] as PropertyTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => onTabChange(tab)}
            className={`relative -mb-px pb-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#0F5F45]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
