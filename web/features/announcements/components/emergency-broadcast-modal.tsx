"use client";

import React, { useState } from "react";
import {
  X,
  Flame,
  AlertTriangle,
  HeartPulse,
  ShieldAlert,
  CloudLightning,
  ZapOff,
  Droplets,
  Radio,
  Building,
  Check,
  Loader2,
  PhoneCall,
  AlertOctagon,
  ArrowLeft,
  Users,
} from "lucide-react";
import type {
  EmergencyAlertCategory,
  EmergencyBroadcastFormData,
} from "../types";
import { useActiveBlocksQuery } from "../hooks/use-announcements-query";

interface EmergencyBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmergencyBroadcastFormData) => Promise<void>;
  isSubmitting?: boolean;
}

interface CrisisTemplate {
  category: EmergencyAlertCategory;
  label: string;
  shortDesc: string;
  defaultTitle: string;
  defaultMessage: string;
  defaultInstructions: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  borderActive: string;
  badgeBg: string;
}

const CRISIS_TEMPLATES: CrisisTemplate[] = [
  {
    category: "FIRE",
    label: "Fire & Evacuation",
    shortDesc: "Active blaze, smoke hazard, or fire drill",
    defaultTitle: "Fire Alert: Evacuate Immediately",
    defaultMessage:
      "A fire emergency has been reported within the society. Please evacuate your flat calmly using the emergency stairwells. DO NOT use elevators.",
    defaultInstructions:
      "1. Check doors for heat before opening.\n2. Do NOT use elevators.\n3. Gather at the designated Central Ground assembly point.\n4. Do not return to flats until cleared by fire marshals.",
    icon: Flame,
    color: "text-rose-600 bg-rose-50",
    borderActive: "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40",
    badgeBg: "bg-rose-100 text-rose-800",
  },
  {
    category: "GAS_LEAK",
    label: "Gas Leakage",
    shortDesc: "Piped gas or LPG cylinder leak alert",
    defaultTitle: "Urgent: Gas Leakage Detected",
    defaultMessage:
      "A gas leak has been detected in the building. Immediate caution is required to prevent fire or explosion risks.",
    defaultInstructions:
      "1. Do NOT touch any electrical switches or appliances.\n2. Do NOT light matches or lighters.\n3. Open all balcony windows for ventilation.\n4. Turn off main cylinder / pipeline valves if safe to do so.",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50",
    borderActive: "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40",
    badgeBg: "bg-amber-100 text-amber-800",
  },
  {
    category: "MEDICAL",
    label: "Medical Crisis",
    shortDesc: "Ambulance en route & priority corridor",
    defaultTitle: "Emergency Medical Access Required",
    defaultMessage:
      "An emergency medical crew has been dispatched. All residents and vehicle owners must keep primary internal roadways clear.",
    defaultInstructions:
      "1. Keep the building lobby and main entry ramps completely unobstructed.\n2. Security has reserved Elevator 1 for stretcher transport.\n3. Yield right-of-way to medical responders at the main gate.",
    icon: HeartPulse,
    color: "text-pink-600 bg-pink-50",
    borderActive: "border-pink-500 ring-2 ring-pink-500/20 bg-pink-50/40",
    badgeBg: "bg-pink-100 text-pink-800",
  },
  {
    category: "SECURITY",
    label: "Security & Intrusion",
    shortDesc: "Lockdown, perimeter breach, or unrest",
    defaultTitle: "Security Notice: Stay Indoors",
    defaultMessage:
      "A security breach has been reported within the society perimeter. Security staff and law enforcement are actively inspecting the premises.",
    defaultInstructions:
      "1. Secure all entrance doors and balcony latch locks.\n2. Keep children and domestic staff inside flats.\n3. Report any unidentified individuals immediately to the Main Gate intercom.",
    icon: ShieldAlert,
    color: "text-indigo-600 bg-indigo-50",
    borderActive: "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40",
    badgeBg: "bg-indigo-100 text-indigo-800",
  },
  {
    category: "WEATHER",
    label: "Severe Storm & Flood",
    shortDesc: "High cyclone winds, flood, or flash rain",
    defaultTitle: "Severe Weather Warning: Secure Premises",
    defaultMessage:
      "Extreme storm/cyclone advisory issued by local meteorological authorities. High wind gusts and localized basement flooding expected.",
    defaultInstructions:
      "1. Remove all loose plants, drying racks, and objects from balconies.\n2. Relocate vehicles from lowest basement level if drainage overflows.\n3. Stay away from unanchored glass panes and balcony railings.",
    icon: CloudLightning,
    color: "text-sky-600 bg-sky-50",
    borderActive: "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/40",
    badgeBg: "bg-sky-100 text-sky-800",
  },
  {
    category: "INFRASTRUCTURE",
    label: "Lift & Power Grid",
    shortDesc: "Elevator entrapment or substation failure",
    defaultTitle: "Critical Infrastructure Breakdown",
    defaultMessage:
      "Major electrical transformer or elevator malfunction reported. Facility engineers are on site conducting repairs.",
    defaultInstructions:
      "1. If anyone is inside an elevator, use the in-cabin alarm button; rescue teams are deployed.\n2. Standby generator supplies essential corridor lighting only.\n3. Refrain from operating high-load appliances until grid stabilizes.",
    icon: ZapOff,
    color: "text-purple-600 bg-purple-50",
    borderActive: "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/40",
    badgeBg: "bg-purple-100 text-purple-800",
  },
  {
    category: "WATER_CONTAMINATION",
    label: "Water Supply Crisis",
    shortDesc: "Reservoir contamination or line rupture",
    defaultTitle: "Urgent: Water Supply Contamination",
    defaultMessage:
      "A potential water contamination issue has been detected in the central overhead tank. Maintenance is flushing the line.",
    defaultInstructions:
      "1. Do NOT consume or cook with tap water until clearance tests return.\n2. Emergency drinking water tanker is stationed near Clubhouse.\n3. Boiler and RO systems should remain switched off temporarily.",
    icon: Droplets,
    color: "text-teal-600 bg-teal-50",
    borderActive: "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/40",
    badgeBg: "bg-teal-100 text-teal-800",
  },
  {
    category: "OTHER",
    label: "General Society Alert",
    shortDesc: "Custom high-priority community emergency",
    defaultTitle: "Urgent Life-Safety Notice",
    defaultMessage:
      "An urgent society-wide situation requires immediate attention from all residents. Please follow instructions closely.",
    defaultInstructions:
      "1. Read this notice thoroughly and alert elderly neighbors.\n2. Keep mobile phones charged and monitor community updates.\n3. Contact society emergency desk for immediate assistance.",
    icon: Radio,
    color: "text-slate-700 bg-slate-100",
    borderActive: "border-slate-500 ring-2 ring-slate-500/20 bg-slate-50",
    badgeBg: "bg-slate-200 text-slate-800",
  },
];

export function EmergencyBroadcastModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: EmergencyBroadcastModalProps) {
  if (!isOpen) return null;

  return (
    <EmergencyBroadcastForm
      onClose={onClose}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  );
}

function EmergencyBroadcastForm({
  onClose,
  onSubmit,
  isSubmitting,
}: Omit<EmergencyBroadcastModalProps, "isOpen">) {
  const { data: activeBlocks = [], isLoading: isBlocksLoading } =
    useActiveBlocksQuery();

  const [step, setStep] = useState<"compose" | "confirm">("compose");
  const [category, setCategory] = useState<EmergencyAlertCategory>("FIRE");
  const [title, setTitle] = useState(CRISIS_TEMPLATES[0].defaultTitle);
  const [message, setMessage] = useState(CRISIS_TEMPLATES[0].defaultMessage);
  const [actionInstructions, setActionInstructions] = useState(
    CRISIS_TEMPLATES[0].defaultInstructions
  );
  const [contactPhone, setContactPhone] = useState("");
  const [targetType, setTargetType] = useState<"ALL_RESIDENTS" | "BLOCK">(
    "ALL_RESIDENTS"
  );
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedTemplate =
    CRISIS_TEMPLATES.find((t) => t.category === category) || CRISIS_TEMPLATES[0];

  const handleSelectCategory = (cat: EmergencyAlertCategory) => {
    setCategory(cat);
    const template = CRISIS_TEMPLATES.find((t) => t.category === cat);
    if (template) {
      setTitle(template.defaultTitle);
      setMessage(template.defaultMessage);
      setActionInstructions(template.defaultInstructions);
    }
  };

  const toggleBlock = (blockId: string) => {
    if (targetIds.includes(blockId)) {
      setTargetIds(targetIds.filter((id) => id !== blockId));
    } else {
      setTargetIds([...targetIds, blockId]);
    }
  };

  const handleProceedToConfirm = () => {
    setValidationError(null);

    if (!title.trim() || title.trim().length < 3) {
      setValidationError("Please enter an emergency alert title (min 3 characters).");
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setValidationError("Please provide detailed emergency guidance (min 10 characters).");
      return;
    }

    if (targetType === "BLOCK" && targetIds.length === 0) {
      setValidationError("Please select at least one block to target.");
      return;
    }

    setStep("confirm");
  };

  const handleFinalBroadcast = async () => {
    try {
      await onSubmit({
        category,
        title: title.trim(),
        message: message.trim(),
        targetType,
        targetIds: targetType === "BLOCK" ? targetIds : [],
        actionInstructions: actionInstructions.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to broadcast emergency alert";
      setValidationError(msg);
      setStep("compose");
    }
  };

  const targetedBlockNames = activeBlocks
    .filter((b) => targetIds.includes(b.id))
    .map((b) => b.blockname || b.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl rounded-none sm:rounded-2xl bg-white sm:border sm:border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-rose-600 text-white flex items-center justify-between shrink-0 border-b border-rose-700/40">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <AlertOctagon size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white leading-tight">
                Emergency broadcast
              </h2>
              <p className="text-xs text-rose-100 leading-tight mt-0.5">
                Publish an urgent notice directly to residents
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close emergency broadcast modal"
            className="size-8 rounded-lg text-rose-100 hover:text-white hover:bg-white/15 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {step === "compose" ? (
            <>
              {/* Emergency Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800">
                  Emergency type
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CRISIS_TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    const isSelected = category === tmpl.category;
                    return (
                      <button
                        key={tmpl.category}
                        type="button"
                        onClick={() => handleSelectCategory(tmpl.category)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] sm:min-h-[76px] ${
                          isSelected
                            ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${tmpl.color}`}
                          >
                            <Icon size={14} />
                          </div>
                          {isSelected && (
                            <span className="size-4 rounded-full bg-rose-600 text-white flex items-center justify-center">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <p
                            className={`text-xs leading-snug ${
                              isSelected
                                ? "font-semibold text-rose-950"
                                : "font-medium text-slate-800"
                            }`}
                          >
                            {tmpl.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-800">
                  Target audience
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType("ALL_RESIDENTS");
                      setTargetIds([]);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      targetType === "ALL_RESIDENTS"
                        ? "border-[#0F5F45] bg-[#E7F4EE]/40 ring-2 ring-[#0F5F45]/15"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-lg bg-[#E7F4EE] text-[#0F5F45] flex items-center justify-center shrink-0">
                        <Users size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900">
                          Entire society
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          All towers, flats & residents
                        </p>
                      </div>
                    </div>
                    {targetType === "ALL_RESIDENTS" && (
                      <Check size={16} className="text-[#0F5F45] shrink-0" strokeWidth={2.5} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType("BLOCK")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      targetType === "BLOCK"
                        ? "border-[#0F5F45] bg-[#E7F4EE]/40 ring-2 ring-[#0F5F45]/15"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Building size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900">
                          Specific blocks
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Select affected wings or towers
                        </p>
                      </div>
                    </div>
                    {targetType === "BLOCK" && (
                      <Check size={16} className="text-[#0F5F45] shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                </div>

                {targetType === "BLOCK" && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 mt-2">
                    <p className="text-xs font-medium text-slate-700">
                      Select affected blocks:
                    </p>
                    {isBlocksLoading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Loading active blocks...</span>
                      </div>
                    ) : activeBlocks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No active blocks found.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {activeBlocks.map((block) => {
                          const isSelected = targetIds.includes(block.id);
                          return (
                            <button
                              key={block.id}
                              type="button"
                              onClick={() => toggleBlock(block.id)}
                              className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? "border-[#0F5F45] bg-white text-[#0F5F45] shadow-xs font-semibold"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <span className="truncate">
                                {block.blockname} ({block.code})
                              </span>
                              {isSelected && (
                                <Check size={14} className="text-[#0F5F45] shrink-0 ml-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Alert title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fire Alert: Evacuate Block B Immediately"
                    className="h-11 sm:h-10 w-full rounded-lg border border-slate-200 px-3.5 text-base sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Emergency message
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explain what has occurred and initial guidance..."
                    className="w-full rounded-lg border border-slate-200 p-3 sm:p-3.5 text-base sm:text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 resize-none leading-relaxed min-h-[90px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Immediate action checklist
                  </label>
                  <textarea
                    rows={5}
                    value={actionInstructions}
                    onChange={(e) => setActionInstructions(e.target.value)}
                    placeholder="Step-by-step actions for residents..."
                    className="w-full rounded-lg border border-slate-200 p-3 sm:p-3.5 text-base sm:text-sm font-normal text-slate-800 bg-slate-50/50 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 resize-none leading-relaxed min-h-[130px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Emergency control phone (optional)
                  </label>
                  <div className="relative">
                    <PhoneCall
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210 (Main Gate Security Desk)"
                      className="h-11 sm:h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3.5 text-base sm:text-sm text-slate-800 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Confirm Step (Fail-Safe Verification) */
            <div className="space-y-4 py-1">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertOctagon size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-rose-900">
                    Review before broadcasting
                  </h4>
                  <p className="text-xs sm:text-sm text-rose-700 mt-1 leading-relaxed">
                    This will immediately publish a live emergency notice visible to
                    residents across the society.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-slate-500 font-medium">Emergency type</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedTemplate.badgeBg}`}
                  >
                    {selectedTemplate.label}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-slate-500 font-medium">Target audience</span>
                  <span className="font-semibold text-slate-800">
                    {targetType === "ALL_RESIDENTS"
                      ? "Entire Society (All Residents)"
                      : `Specific Blocks: ${targetedBlockNames.join(", ")}`}
                  </span>
                </div>

                <div className="border-b border-slate-200/80 pb-2.5">
                  <span className="text-slate-500 font-medium block mb-1">
                    Headline
                  </span>
                  <p className="font-semibold text-slate-900 text-sm sm:text-base">{title}</p>
                </div>

                <div className="border-b border-slate-200/80 pb-2.5">
                  <span className="text-slate-500 font-medium block mb-1">
                    Emergency message
                  </span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {message}
                  </p>
                </div>

                {actionInstructions && (
                  <div className="border-b border-slate-200/80 pb-2.5">
                    <span className="text-slate-500 font-medium block mb-1">
                      Action checklist
                    </span>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {actionInstructions}
                    </p>
                  </div>
                )}

                {contactPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">
                      Control phone
                    </span>
                    <span className="font-semibold text-slate-800">
                      {contactPhone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 shrink-0">
          {step === "compose" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedToConfirm}
                className="h-10 px-5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                Review broadcast
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("compose")}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to edit</span>
              </button>

              <button
                type="button"
                onClick={handleFinalBroadcast}
                disabled={isSubmitting}
                className="h-10 px-5 sm:px-6 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon size={15} />
                    <span>Broadcast now</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
