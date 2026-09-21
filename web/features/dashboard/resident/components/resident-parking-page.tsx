"use client";

import React, { useState, useMemo } from "react";
import {
  Car,
  Bike,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  Info,
  Layers,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useResidentDashboard } from "../hooks/use-resident-dashboard";
import {
  fetchResidentParkingInfo,
  registerResidentVehicle,
  deleteResidentVehicle,
  type ResidentVehicle,
  type RegisterVehiclePayload,
} from "../api/resident-dashboard.api";

const VEHICLE_TYPES = [
  { value: "CAR", label: "4-Wheeler (Car / SUV / Sedan)", icon: Car },
  { value: "BIKE", label: "2-Wheeler (Motorcycle / Scooter)", icon: Bike },
  { value: "EV", label: "Electric Vehicle (EV)", icon: Zap },
  { value: "BICYCLE", label: "Bicycle / Non-Motorized", icon: Bike },
  { value: "OTHER", label: "Other Commercial / Utility", icon: Car },
] as const;

export function ResidentParkingPage() {
  const queryClient = useQueryClient();
  const { apartmentName, flatUnitName, residentProfile } = useResidentDashboard();

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<ResidentVehicle | null>(null);

  // Register Vehicle Form State
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [makeModel, setMakeModel] = useState("");
  const [color, setColor] = useState("");
  const [rfidTag, setRfidTag] = useState("");
  const [evChargingRequired, setEvChargingRequired] = useState(false);
  const [notes, setNotes] = useState("");

  // 1. Fetch Parking and Vehicles Data
  const { data: parkingData, isLoading } = useQuery({
    queryKey: ["resident", "parking-info"],
    queryFn: fetchResidentParkingInfo,
    staleTime: 30 * 1000,
  });

  const vehicles = parkingData?.vehicles || [];
  const assignedSlots = parkingData?.assignedSlots || [];

  const availableSlots = useMemo(
    () =>
      parkingData?.availableSlots ??
      assignedSlots.filter((s) => !s.vehicleNumber),
    [parkingData?.availableSlots, assignedSlots]
  );

  const totalAssigned = assignedSlots.length;
  const isSlotLimitReached =
    parkingData?.isSlotLimitReached ??
    (totalAssigned > 0 && availableSlots.length === 0);
  const hasNoSlotsAssigned = totalAssigned === 0;

  const activeSlot =
    availableSlots.find((s) => s._id === selectedSlotId) ||
    availableSlots[0] ||
    null;

  // 2. Register Vehicle Mutation
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterVehiclePayload) => registerResidentVehicle(payload),
    onSuccess: (data) => {
      toast.success(
        data.message || `Vehicle ${data.data?.vehicleNumber || ""} registered! RFID gate barrier active.`
      );
      setIsRegisterModalOpen(false);
      resetRegisterForm();
      queryClient.invalidateQueries({ queryKey: ["resident", "parking-info"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to register vehicle."
      );
    },
  });

  // 3. Delete Vehicle Mutation
  const deleteMutation = useMutation({
    mutationFn: (vehicleId: string) => deleteResidentVehicle(vehicleId),
    onSuccess: (data) => {
      toast.success(data.message || "Vehicle unregistered successfully.");
      setVehicleToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["resident", "parking-info"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to unregister vehicle."
      );
    },
  });



  const resetRegisterForm = () => {
    setVehicleNumber("");
    setSelectedSlotId("");
    setMakeModel("");
    setColor("");
    setRfidTag("");
    setEvChargingRequired(false);
    setNotes("");
  };

  const handleOpenRegisterModal = () => {
    if (hasNoSlotsAssigned) {
      toast.error(
        "No parking bays have been assigned to your unit by the property manager. Please contact management."
      );
      return;
    }
    if (isSlotLimitReached) {
      toast.error(
        `All your assigned parking bays (${totalAssigned}) already have a vehicle registered. If you need an additional bay, please contact the property manager.`
      );
      return;
    }
    if (availableSlots.length > 0) {
      setSelectedSlotId(availableSlots[0]._id);
    }
    setIsRegisterModalOpen(true);
  };



  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlot) {
      toast.error("No available parking slot assigned. Please contact the property manager.");
      return;
    }
    const cleanPlate = vehicleNumber.trim().toUpperCase().replace(/\s+/g, " ");
    if (!cleanPlate || cleanPlate.length < 3) {
      toast.error("Please enter a valid vehicle license plate number.");
      return;
    }

    registerMutation.mutate({
      slotId: activeSlot._id,
      vehicleNumber: cleanPlate,
      makeModel: makeModel.trim() || undefined,
      color: color.trim() || undefined,
      rfidTag: rfidTag.trim() || undefined,
      evChargingRequired,
      notes: notes.trim() || undefined,
    });
  };



  return (
    <div className="w-full space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#DDE3DF] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
              Parking, Vehicles & Services
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
              RFID Clearance Active
            </span>
          </div>
          <p className="mt-1 text-sm text-[#637083]">
            Manage assigned parking bays, RFID boom-barrier passes, EV chargers, and guest parking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleOpenRegisterModal}
            disabled={hasNoSlotsAssigned || isSlotLimitReached}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs sm:text-sm font-medium shadow-xs transition-colors ${
              hasNoSlotsAssigned || isSlotLimitReached
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-[#07584F] text-white hover:bg-[#064C44] cursor-pointer active:scale-95"
            }`}
          >
            <Plus className="size-4" />
            <span>
              {hasNoSlotsAssigned
                ? "No Bay Assigned"
                : isSlotLimitReached
                ? `Slot Limit Reached (${vehicles.length}/${totalAssigned})`
                : availableSlots.length > 0
                ? `Register Vehicle (${availableSlots.length} bay available)`
                : "Register Vehicle"}
            </span>
          </button>
        </div>
      </div>

      {/* Assigned Parking Bay Summary */}
      <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#07584F]/10 text-[#07584F] font-bold text-lg">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#111111]">
                  Parking & Bay Status: {parkingData?.flatUnitName || flatUnitName}
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Allocated Unit
                </span>
              </div>
              <p className="text-xs text-[#637083]">
                {apartmentName} • Automated Gate Barrier Clearance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50/60 px-3 py-1.5 rounded-lg border border-emerald-200/60">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>RFID Boom Barrier Clearance Active</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          {/* Assigned Bay */}
          <div className="rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#637083] flex items-center gap-1.5">
                  <Layers className="size-3.5 text-[#07584F]" />
                  Assigned Bay{assignedSlots.length > 1 ? "s" : ""}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    hasNoSlotsAssigned
                      ? "bg-amber-100 text-amber-800"
                      : isSlotLimitReached
                      ? "bg-slate-200 text-slate-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {hasNoSlotsAssigned
                    ? "0 Allocated"
                    : `${vehicles.length} / ${totalAssigned} Registered`}
                </span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-[#111111] mt-1.5">
                {assignedSlots.length > 0
                  ? assignedSlots
                      .map((s) => `${s.slotNumber} (${s.vehicleType})`)
                      .join(", ")
                  : "No bay allocated by manager"}
              </p>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-2 flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>
                {assignedSlots.length > 0 && assignedSlots[0].level
                  ? `Level: ${assignedSlots[0].level} • Pre-allocated by Manager`
                  : "Contact property manager for bay allocation"}
              </span>
            </p>
          </div>

          {/* EV Charging Station */}
          <div className="rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#637083] flex items-center gap-1.5">
                <Zap className="size-3.5 text-[#07584F]" />
                EV Charging Station
              </span>
              <p className="text-lg font-semibold text-[#111111] mt-1">Available on Request</p>
            </div>
            <p className="text-[11px] text-[#637083] font-medium mt-2 flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Smart AC Fast Charger (Type 2 / 7.4 kW)</span>
            </p>
          </div>

          {/* Visitor Parking Note */}
          <div className="rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-[#637083] flex items-center gap-1.5">
                <Car className="size-3.5 text-[#07584F]" />
                Visitor Parking
              </span>
              <p className="text-base font-semibold text-[#111111] mt-1">Managed by Security</p>
            </div>
            <p className="text-[11px] text-[#637083] font-medium mt-2">
              Guest bays are assigned directly by gate security at entry
            </p>
          </div>
        </div>
      </div>

      {/* Quota & Capacity Banners */}
      {hasNoSlotsAssigned && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-800">
          <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-900">No Parking Bay Assigned</p>
            <p className="mt-0.5 text-amber-700 leading-relaxed">
              Your unit does not currently have any parking bays assigned by the property manager. Residents can only register vehicles into an assigned bay.
            </p>
          </div>
        </div>
      )}

      {isSlotLimitReached && (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
          <Info className="size-5 shrink-0 text-slate-500 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-slate-800">
              All Assigned Bays Registered ({vehicles.length} of {totalAssigned})
            </p>
            <p className="mt-0.5 text-slate-600 leading-relaxed">
              You have registered vehicles for all parking bays allocated to your unit. A resident cannot register another vehicle without an additional bay allocated by the property manager.
            </p>
          </div>
        </div>
      )}

      {/* Linked Vehicles Section */}
      <div className="rounded-xl border border-[#DDE3DF] bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-[#111111]">
              Registered Vehicles
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {vehicles.length}
            </span>
          </div>

          {hasNoSlotsAssigned ? (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              No Bay Allocated
            </span>
          ) : isSlotLimitReached ? (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Slot Limit Reached ({vehicles.length}/{totalAssigned})
            </span>
          ) : (
            <button
              type="button"
              onClick={handleOpenRegisterModal}
              className="text-xs font-semibold text-[#07584F] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="size-3.5" />
              <span>Register Vehicle ({availableSlots.length} bay available)</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-[#EEF1F4] bg-[#F7F8F5] p-8 text-center text-xs text-slate-500">
            Loading vehicle and parking records...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#DDE3DF] bg-[#F7F8F5] p-10 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white shadow-2xs">
              <Car className="size-6 text-[#7C8782]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">
                {hasNoSlotsAssigned ? "No Parking Bays Allocated" : "No Vehicles Registered Yet"}
              </p>
              <p className="text-xs text-[#637083] max-w-sm mx-auto mt-1">
                {hasNoSlotsAssigned
                  ? "Contact your society property manager to assign a parking bay to your flat. Once assigned, you can register your vehicle here."
                  : "Register your vehicle to lock your assigned bay and enable automatic RFID boom-barrier opening at the main gate."}
              </p>
            </div>
            {!hasNoSlotsAssigned && (
              <button
                type="button"
                onClick={handleOpenRegisterModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Register Your Vehicle</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => {
              const TypeIcon =
                v.vehicleType === "BIKE" || v.vehicleType === "BICYCLE"
                  ? Bike
                  : v.vehicleType === "EV"
                  ? Zap
                  : Car;

              return (
                <div
                  key={v._id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* IND License Plate Representation */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="inline-flex items-center rounded-md border-2 border-slate-800 bg-white px-2.5 py-1 text-sm font-extrabold tracking-wider text-slate-900 shadow-2xs">
                        <span className="flex flex-col items-center justify-center border-r border-slate-300 pr-1.5 mr-1.5 leading-none">
                          <span className="text-[8px] font-bold text-blue-700">IND</span>
                          <span className="size-1.5 rounded-full bg-blue-700 my-0.5" />
                        </span>
                        <span>{v.vehicleNumber}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setVehicleToDelete(v)}
                        title="Unregister Vehicle"
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Make / Model & Type */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="size-4 text-[#07584F]" />
                        <span className="text-sm font-semibold text-slate-900">
                          {v.makeModel || "Standard Vehicle"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {v.parkingSlotId && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#E7F4EE] px-2 py-0.5 text-[11px] font-bold text-[#0F5F45] border border-[#0F5F45]/20">
                            <Layers className="size-3" />
                            Bay: {assignedSlots.find((s) => s._id === v.parkingSlotId)?.slotNumber || "Allocated"}
                          </span>
                        )}

                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {v.vehicleType}
                        </span>

                        {v.color && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            <span
                              className="size-2 rounded-full border border-slate-300"
                              style={{
                                backgroundColor:
                                  v.color.toLowerCase() === "white"
                                    ? "#ffffff"
                                    : v.color.toLowerCase() === "black"
                                    ? "#000000"
                                    : v.color.toLowerCase() === "silver" || v.color.toLowerCase() === "grey"
                                    ? "#94a3b8"
                                    : v.color.toLowerCase() === "red"
                                    ? "#ef4444"
                                    : v.color.toLowerCase() === "blue"
                                    ? "#3b82f6"
                                    : "#64748b",
                              }}
                            />
                            {v.color}
                          </span>
                        )}

                        {v.evChargingRequired && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <Zap className="size-3" />
                            EV Charging
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RFID & Gate Status Bar */}
                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">RFID Boom Barrier:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        Clearance Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Tag ID:</span>
                      <span className="font-mono text-slate-700 font-medium">
                        {v.rfidTag}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Register Vehicle Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#07584F]/10 text-[#07584F]">
                  <Car className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Register New Vehicle
                  </h3>
                  <p className="text-xs text-slate-500">
                    Auto-enables RFID boom-barrier gate entry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-4">
              {/* Assigned Parking Bay */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Parking Bay <span className="text-red-500">*</span>
                </label>
                {availableSlots.length > 1 ? (
                  <select
                    value={activeSlot?._id || ""}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none transition focus:border-[#07584F] focus:ring-1 focus:ring-[#07584F]"
                  >
                    {availableSlots.map((s) => (
                      <option key={s._id} value={s._id}>
                        Slot {s.slotNumber} ({s.level || "Ground"}) • Pre-assigned: {s.vehicleType}
                      </option>
                    ))}
                  </select>
                ) : activeSlot ? (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 items-center rounded-md bg-[#E7F4EE] px-2 font-mono text-xs font-bold text-[#0F5F45] border border-[#0F5F45]/20">
                        {activeSlot.slotNumber}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        Level: {activeSlot.level || "Covered Parking"}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Bay Available
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Pre-Assigned Vehicle Type (Read-only, Assigned by Property Manager) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Type <span className="text-slate-400 font-normal">(Assigned by Property Manager)</span>
                </label>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const vType = activeSlot?.vehicleType || "CAR";
                      const matchedType =
                        VEHICLE_TYPES.find((t) => t.value === vType) || VEHICLE_TYPES[0];
                      const TypeIcon = matchedType.icon;
                      return (
                        <>
                          <div className="flex size-7 items-center justify-center rounded-md bg-[#07584F]/10 text-[#07584F]">
                            <TypeIcon className="size-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {matchedType.label}
                            </span>
                            <span className="text-[10.5px] text-slate-500">
                              Configured by property manager for this parking bay
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <span className="inline-flex items-center rounded-md bg-slate-200/80 px-2 py-0.5 text-[10.5px] font-semibold text-slate-700">
                    Locked
                  </span>
                </div>
              </div>

              {/* License Plate */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle License Plate Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KL 01 CA 1234 or DL 8C AB 9999"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono tracking-wider font-semibold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 outline-none transition focus:border-[#07584F] focus:ring-1 focus:ring-[#07584F]"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Enter your official RTO vehicle registration number.
                </p>
              </div>

              {/* Make & Model + Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Make & Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Nexon EV"
                    value={makeModel}
                    onChange={(e) => setMakeModel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#07584F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dark Grey"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#07584F]"
                  />
                </div>
              </div>

              {/* Custom RFID / Fastag */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RFID Tag / Fastag Sticker ID <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Leave blank for automatic assignment"
                  value={rfidTag}
                  onChange={(e) => setRfidTag(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#07584F]"
                />
              </div>

              {/* EV Charging Checkbox */}
              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={evChargingRequired}
                  onChange={(e) => setEvChargingRequired(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#07584F] focus:ring-[#07584F]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">
                    EV Charging Station Access
                  </span>
                  <span className="text-slate-500">
                    Enable access to society shared AC fast charging bays.
                  </span>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="rounded-lg bg-[#07584F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#064C44] transition cursor-pointer disabled:opacity-50"
                >
                  {registerMutation.isPending ? "Registering..." : "Register Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Delete / Unregister Confirmation Dialog */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Unregister Vehicle
                </h3>
                <p className="text-xs text-slate-500">
                  Remove automatic gate barrier clearance
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to unregister <strong>{vehicleToDelete.vehicleNumber}</strong> ({vehicleToDelete.makeModel})? Its RFID gate clearance will be revoked immediately.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Vehicle
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(vehicleToDelete._id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Removing..." : "Yes, Unregister"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
