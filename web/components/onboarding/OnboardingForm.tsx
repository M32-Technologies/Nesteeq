"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  name: string;
  state: string;
  city: string;
  address: string;
  totalUnits: string;
  totalFloors: string;
  totalBlocks: string;
  parkingSlots: string;
  contactNumber: string;
  emergencyNumber: string;
};

type FieldName = keyof FormData;
type FormErrors = Partial<Record<FieldName, string>>;

type SavedApartment = {
  _id?: string;
  id?: string;
  name?: string;
  state?: string;
  city?: string;
  address?: string;
  totalUnits?: number | string;
  totalFloors?: number | string;
  totalBlocks?: number | string;
  parkingSlots?: number | string;
  contactNumber?: string;
  emergencyNumber?: string;
};

type ApartmentCreateResponse = {
  success: boolean;
  message?: string;
  data?: SavedApartment;
  apartment?: SavedApartment;
};

type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  details?: Array<{
    path?: string;
    message?: string;
  }>;
};

const stepFields: Record<number, FieldName[]> = {
  1: ["name", "state", "city", "address"],
  2: ["totalUnits", "totalFloors", "totalBlocks"],
  3: ["parkingSlots", "contactNumber", "emergencyNumber"],
};

const BACKEND_API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:6000"
).replace(/\/$/, "");

const USE_API_PROXY = (() => {
  try {
    return (
      new URL(BACKEND_API_BASE_URL).port ===
      "6000"
    );
  } catch {
    return false;
  }
})();

const API_BASE_URL = USE_API_PROXY
  ? ""
  : BACKEND_API_BASE_URL;

const buildApiErrorMessage = (
  result: ApiErrorResponse,
  fallback: string
) => {
  const details =
    Array.isArray(result.details) &&
    result.details.length > 0
      ? result.details
          .map((detail) =>
            detail.path && detail.message
              ? `${detail.path}: ${detail.message}`
              : detail.message
          )
          .filter(Boolean)
          .join("; ")
      : "";

  if (result.message && details) {
    return `${result.message}: ${details}`;
  }

  return result.message || details || fallback;
};

const readApiJson = async <T,>(
  response: Response,
  fallback: string
) => {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(fallback);
  }
};

const getNetworkErrorMessage = (
  error: unknown,
  action: string
) => {
  if (error instanceof TypeError) {
    return `Backend unreachable while trying to ${action}. Make sure the API is running at ${BACKEND_API_BASE_URL}.`;
  }

  return error instanceof Error
    ? error.message
    : `Unable to ${action}`;
};

const createSetupRequestId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const unionTerritories = [
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function OnboardingForm() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [completedStep, setCompletedStep] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    state: "",
    city: "",
    address: "",
    totalUnits: "",
    totalFloors: "",
    totalBlocks: "",
    parkingSlots: "",
    contactNumber: "",
    emergencyNumber: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [submitError, setSubmitError] =
    useState("");

  const validateField = (
    name: FieldName,
    value: string
  ): string => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "Required";
    }

    if (name === "name") {
      if (trimmedValue.length < 3) {
        return "Enter a valid apartment name";
      }

      if (!/^[A-Za-z][A-Za-z\s.'&-]*$/.test(trimmedValue)) {
        return "Numbers are not allowed";
      }
    }

    if (name === "state") {
      const validState =
        indianStates.includes(trimmedValue) ||
        unionTerritories.includes(trimmedValue);

      if (!validState) {
        return "Select a valid state";
      }
    }

    if (name === "city") {
      if (trimmedValue.length < 2) {
        return "Enter a valid city";
      }

      if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(trimmedValue)) {
        return "Numbers are not allowed";
      }
    }

    if (name === "address") {
      if (trimmedValue.length < 10) {
        return "Enter a complete apartment address";
      }
    }

    if (
      name === "totalUnits" ||
      name === "totalFloors" ||
      name === "totalBlocks"
    ) {
      const numberValue = Number(value);

      if (!Number.isInteger(numberValue) || numberValue <= 0) {
        return "Enter a whole number greater than 0";
      }
    }

    if (name === "parkingSlots") {
      const numberValue = Number(value);

      if (!Number.isInteger(numberValue) || numberValue < 0) {
        return "Enter a valid parking slot count";
      }
    }

    if (
      name === "contactNumber" ||
      name === "emergencyNumber"
    ) {
      const digits = value.replace(/\D/g, "");

      if (!/^[6-9]\d{9}$/.test(digits)) {
        return "Enter a valid 10-digit Indian mobile number";
      }
    }

    return "";
  };

  const setFieldValue = (
    field: FieldName,
    value: string
  ) => {
    if (submitError) {
      setSubmitError("");
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      const newError = validateField(field, value);

      setErrors((prev) => ({
        ...prev,
        [field]: newError || undefined,
      }));
    }
  };

  const validateStep = (currentStep: number) => {
    const fields = stepFields[currentStep];

    const newErrors: FormErrors = {};

    fields.forEach((field) => {
      const error = validateField(
        field,
        formData[field]
      );

      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleTextChange = (
    field: "name" | "city",
    value: string
  ) => {
    if (!/^[A-Za-z\s.'&-]*$/.test(value)) {
      return;
    }

    setFieldValue(field, value);
  };

  const handleNumberChange = (
    field:
      | "totalUnits"
      | "totalFloors"
      | "totalBlocks"
      | "parkingSlots",
    value: string
  ) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setFieldValue(field, value);
  };

  const handlePhoneChange = (
    field: "contactNumber" | "emergencyNumber",
    value: string
  ) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    if (value.length > 10) {
      return;
    }

    setFieldValue(field, value);
  };

  const handleBlur = (field: FieldName) => {
    const error = validateField(
      field,
      formData[field]
    );

    setErrors((prev) => ({
      ...prev,
      [field]: error || undefined,
    }));
  };

  const nextStep = () => {
    const valid = validateStep(step);

    if (!valid) {
      return;
    }

    setCompletedStep((prev) =>
      Math.max(prev, step)
    );

    setErrors({});

    if (step < 3) {
      setStep(step + 1);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setErrors({});
      setStep(step - 1);
    }
  };

  const goToStep = (targetStep: number) => {
    if (targetStep > completedStep + 1) {
      return;
    }

    setErrors({});
    setStep(targetStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const valid = validateStep(3);

    if (!valid) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      let setupRequestId =
        sessionStorage.getItem(
          "nesteeqOnboardingSetupRequestId"
        );

      if (!setupRequestId) {
        setupRequestId =
          createSetupRequestId();

        sessionStorage.setItem(
          "nesteeqOnboardingSetupRequestId",
          setupRequestId
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/api/apartments`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            ...formData,
            setupRequestId,
          }),
        }
      );

      const result =
        await readApiJson<
          | ApartmentCreateResponse
          | ApiErrorResponse
        >(
          response,
          "Backend returned an invalid apartment response"
        );

      if (!response.ok) {
        throw new Error(
          buildApiErrorMessage(
            result,
            "Unable to save apartment"
          )
        );
      }

      const apartment =
        "data" in result && result.data
          ? result.data
          : "apartment" in result
            ? result.apartment
            : null;

      const apartmentId =
        apartment?._id || apartment?.id;

      if (!apartmentId) {
        throw new Error(
          "Apartment was saved, but the backend did not return an apartment id"
        );
      }

      const storedApartment = {
        ...formData,
        ...apartment,
        _id: apartmentId,
        apartmentId,
        totalUnits: String(
          apartment?.totalUnits ??
            formData.totalUnits
        ),
        totalFloors: String(
          apartment?.totalFloors ??
            formData.totalFloors
        ),
        totalBlocks: String(
          apartment?.totalBlocks ??
            formData.totalBlocks
        ),
        parkingSlots: String(
          apartment?.parkingSlots ??
            formData.parkingSlots
        ),
        contactNumber:
          apartment?.contactNumber ||
          formData.contactNumber,
        emergencyNumber:
          apartment?.emergencyNumber ||
          formData.emergencyNumber,
      };

      setCompletedStep(3);

      sessionStorage.setItem(
        "nesteeqOnboarding",
        JSON.stringify(storedApartment)
      );

      sessionStorage.setItem(
        "nesteeqApartmentId",
        apartmentId
      );

      router.push("/payment");
    } catch (error) {
      setSubmitError(
        getNetworkErrorMessage(
          error,
          "save apartment"
        )
      );

      setIsSubmitting(false);
    }
  };

  const inputClass = (
    field: FieldName
  ) => `
    h-[55px]
    w-full
    rounded-xl
    border
    px-4
    text-[16px]
    font-medium
    text-[#17211E]
    outline-none
    transition-all
    duration-200
    placeholder:font-normal
    placeholder:text-[#A0A9A5]
    ${
      errors[field]
        ? "border-[#DC5C5C] bg-[#FFF9F9] focus:border-[#DC5C5C] focus:ring-4 focus:ring-red-500/10"
        : "border-[#D7DEDA] bg-[#FBFCFB] hover:border-[#A9B6B0] focus:border-[#124E41] focus:bg-white focus:ring-4 focus:ring-[#124E41]/10"
    }
  `;

  const labelClass =
    "mb-2 block text-[16px] font-semibold text-[#25332E]";

  const errorClass =
    "mt-1.5 text-[12px] font-semibold text-[#D65353]";

  return (
    <main className="h-screen overflow-hidden bg-[#F4F6F5]">
      <div className="flex h-full flex-col">

        <header className="h-[72px] shrink-0 border-b border-[#E3E8E5] bg-white">
          <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-7 lg:px-12">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#103D34] text-[18px] font-bold text-white shadow-sm">
                N
              </div>

              <div>
                <h1 className="text-[22px] font-bold leading-none tracking-[-0.04em] text-[#103D34]">
                  Nesteeq
                </h1>

                <p className="mt-1 text-[11px] font-medium text-[#89938F]">
                  Apartment Management
                </p>
              </div>
            </div>


            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full bg-[#EEF5F2] px-3.5 py-2 sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#398A70]" />

                <span className="text-[12px] font-semibold text-[#386354]">
                  Setup in progress
                </span>
              </div>

              <p className="text-[14px] font-semibold text-[#52605B]">
                Apartment Setup
              </p>
            </div>
          </div>
        </header>


        <div className="flex min-h-0 flex-1">

          <aside className="relative hidden w-[37%] shrink-0 overflow-hidden bg-[#0C392F] md:flex md:flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-[#082C25] via-[#0D3C32] to-[#175548]" />

            <div className="pointer-events-none absolute -right-[150px] -top-[160px] h-[420px] w-[420px] rounded-full border border-white/[0.06]" />

            <div className="pointer-events-none absolute -right-[60px] -top-[70px] h-[270px] w-[270px] rounded-full border border-white/[0.06]" />

            <div className="pointer-events-none absolute -left-[100px] top-[300px] h-[330px] w-[330px] rounded-full bg-[#65A98F]/10 blur-[90px]" />

            <div className="pointer-events-none absolute bottom-[-140px] right-[-70px] h-[350px] w-[350px] rounded-full bg-[#70AF98]/10 blur-[80px]" />

            <div className="relative z-10 px-10 pt-11 xl:px-14 xl:pt-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-[#A5D7C5]" />

                <span className="text-[11px] font-semibold uppercase tracking-[0.17em] text-white/70">
                  Apartment Setup
                </span>
              </div>

              <h2 className="mt-7 max-w-[450px] text-[36px] font-semibold leading-[1.12] tracking-[-0.04em] text-white xl:text-[43px]">
                Everything starts with the right setup.
              </h2>

              <p className="mt-5 max-w-[420px] text-[16px] leading-7 text-white/60">
                Add your apartment information once and
                continue building a better connected
                community with Nesteeq.
              </p>
            </div>


            <div className="relative z-10 flex flex-1 items-end justify-center pb-9">
              <div className="absolute bottom-12 h-[230px] w-[320px] rounded-full bg-white/[0.05] blur-3xl" />

              <div className="relative flex items-end justify-center gap-3">
                <div className="w-[78px] rounded-t-[18px] border border-white/10 bg-white/[0.08] px-3 pb-4 pt-5 backdrop-blur">
                  <div className="grid grid-cols-2 gap-2.5">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[15px] rounded-[4px] bg-white/[0.20]"
                      />
                    ))}
                  </div>
                </div>

                <div className="w-[112px] rounded-t-[24px] border border-white/10 bg-white/[0.12] px-4 pb-4 pt-6 shadow-[0_30px_60px_rgba(0,0,0,0.15)] backdrop-blur">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="h-2 w-8 rounded-full bg-[#9DD0BD]/70" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 14 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[16px] rounded-[4px] bg-white/[0.28]"
                      />
                    ))}
                  </div>

                  <div className="mx-auto mt-4 h-[30px] w-[28px] rounded-t-lg bg-white/[0.20]" />
                </div>

                <div className="w-[82px] rounded-t-[18px] border border-white/10 bg-white/[0.08] px-3 pb-4 pt-5 backdrop-blur">
                  <div className="grid grid-cols-2 gap-2.5">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[15px] rounded-[4px] bg-white/[0.20]"
                      />
                    ))}
                  </div>
                </div>

                <div className="absolute -bottom-[8px] left-1/2 h-[8px] w-[330px] -translate-x-1/2 rounded-full bg-white/[0.07]" />
              </div>
            </div>

            <div className="relative z-10 mx-9 mb-8 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-md xl:mx-12">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#A5D7C5]" />
                </div>

                <div>
                  <p className="text-[14px] font-semibold text-white">
                    Quick and simple setup
                  </p>

                  <p className="mt-1 text-[12px] text-white/50">
                    You can update these details later.
                  </p>
                </div>
              </div>
            </div>
          </aside>


          <section className="flex min-w-0 flex-1 flex-col bg-white">

            <div className="h-[69px] shrink-0 border-b border-[#E7ECE9] px-8 lg:px-12 xl:px-16">
              <div className="mx-auto flex h-full max-w-[860px] items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-[#8A9490]">
                    Setup progress
                  </p>

                  <p className="mt-0.5 text-[15px] font-bold text-[#293730]">
                    Step {step} of 3
                  </p>
                </div>

                <div className="flex items-center">
                  {[1, 2, 3].map((item) => {
                    const active = step === item;
                    const completed = completedStep >= item;
                    const unlocked = item <= completedStep + 1;

                    return (
                      <div
                        key={item}
                        className="flex items-center"
                      >
                        <button
                          type="button"
                          disabled={!unlocked}
                          onClick={() => goToStep(item)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-300 ${
                            active
                              ? "scale-110 bg-[#123F35] text-white shadow-[0_6px_18px_rgba(18,63,53,0.20)]"
                              : completed
                                ? "bg-[#DCEBE5] text-[#145240]"
                                : unlocked
                                  ? "bg-[#EDF2EF] text-[#687770]"
                                  : "cursor-not-allowed bg-[#F1F3F2] text-[#A7AFAB]"
                          }`}
                        >
                          {completed && !active ? "✓" : item}
                        </button>

                        {item < 3 && (
                          <div className="relative mx-2 h-[3px] w-10 overflow-hidden rounded-full bg-[#E2E7E4] xl:w-12">
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full bg-[#6D9E8D] transition-all duration-500 ${
                                completed ? "w-full" : "w-0"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>


            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex min-h-0 flex-1 items-center px-8 lg:px-12 xl:px-16">
                <div className="mx-auto w-full max-w-[860px]">
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="h-[3px] w-8 rounded-full bg-[#327461]" />

                      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#397361]">
                        {step === 1 && "Getting Started"}
                        {step === 2 && "Apartment Size"}
                        {step === 3 && "Final Information"}
                      </p>
                    </div>

                    <h2 className="text-[31px] font-bold tracking-[-0.04em] text-[#17221E] xl:text-[35px]">
                      {step === 1 &&
                        "Tell us about your apartment"}
                      {step === 2 &&
                        "How large is your community?"}
                      {step === 3 &&
                        "Complete your apartment details"}
                    </h2>

                    <p className="mt-2 max-w-[670px] text-[15px] leading-6 text-[#6E7C77]">
                      {step === 1 &&
                        "Enter accurate basic information and the location of your apartment."}

                      {step === 2 &&
                        "Enter the actual number of units, floors and blocks."}

                      {step === 3 &&
                        "Add parking availability and valid contact information."}
                    </p>
                  </div>

                  <div className="h-[355px]">

                    {step === 1 && (
                      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label
                            htmlFor="name"
                            className={labelClass}
                          >
                            Apartment Name
                            <span className="ml-1 text-[#D65353]">
                              *
                            </span>
                          </label>

                          <input
                            id="name"
                            type="text"
                            autoComplete="off"
                            value={formData.name}
                            onChange={(e) =>
                              handleTextChange(
                                "name",
                                e.target.value
                              )
                            }
                            onBlur={() => handleBlur("name")}
                            placeholder="Example: Green Valley Apartments"
                            className={inputClass("name")}
                          />

                          <div className="min-h-[21px]">
                            {errors.name && (
                              <p className={errorClass}>
                                {errors.name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="state"
                            className={labelClass}
                          >
                            State
                            <span className="ml-1 text-[#D65353]">
                              *
                            </span>
                          </label>

                          <select
                            id="state"
                            value={formData.state}
                            onChange={(e) =>
                              setFieldValue(
                                "state",
                                e.target.value
                              )
                            }
                            onBlur={() => handleBlur("state")}
                            className={`${inputClass(
                              "state"
                            )} cursor-pointer`}
                          >
                            <option value="">
                              Select state
                            </option>

                            <optgroup label="States">
                              {indianStates.map((state) => (
                                <option
                                  key={state}
                                  value={state}
                                >
                                  {state}
                                </option>
                              ))}
                            </optgroup>

                            <optgroup label="Union Territories">
                              {unionTerritories.map(
                                (territory) => (
                                  <option
                                    key={territory}
                                    value={territory}
                                  >
                                    {territory}
                                  </option>
                                )
                              )}
                            </optgroup>
                          </select>

                          <div className="min-h-[21px]">
                            {errors.state && (
                              <p className={errorClass}>
                                {errors.state}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="city"
                            className={labelClass}
                          >
                            City
                            <span className="ml-1 text-[#D65353]">
                              *
                            </span>
                          </label>

                          <input
                            id="city"
                            type="text"
                            autoComplete="off"
                            value={formData.city}
                            onChange={(e) =>
                              handleTextChange(
                                "city",
                                e.target.value
                              )
                            }
                            onBlur={() => handleBlur("city")}
                            placeholder="Example: Kochi"
                            className={inputClass("city")}
                          />

                          <div className="min-h-[21px]">
                            {errors.city && (
                              <p className={errorClass}>
                                {errors.city}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label
                            htmlFor="address"
                            className={labelClass}
                          >
                            Apartment Address
                            <span className="ml-1 text-[#D65353]">
                              *
                            </span>
                          </label>

                          <textarea
                            id="address"
                            rows={3}
                            value={formData.address}
                            onChange={(e) =>
                              setFieldValue(
                                "address",
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handleBlur("address")
                            }
                            placeholder="Enter building name, street, area and complete address"
                            className={`w-full resize-none rounded-xl border px-4 py-3 text-[16px] font-medium leading-6 text-[#17211E] outline-none transition-all placeholder:font-normal placeholder:text-[#A0A9A5] ${
                              errors.address
                                ? "border-[#DC5C5C] bg-[#FFF9F9] focus:ring-4 focus:ring-red-500/10"
                                : "border-[#D7DEDA] bg-[#FBFCFB] hover:border-[#A9B6B0] focus:border-[#124E41] focus:bg-white focus:ring-4 focus:ring-[#124E41]/10"
                            }`}
                          />

                          <div className="min-h-[21px]">
                            {errors.address && (
                              <p className={errorClass}>
                                {errors.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}


                    {step === 2 && (
                      <div>
                        <div className="grid gap-6 md:grid-cols-3">
                          <div>
                            <label
                              htmlFor="totalUnits"
                              className={labelClass}
                            >
                              Total Units
                              <span className="ml-1 text-[#D65353]">
                                *
                              </span>
                            </label>

                            <input
                              id="totalUnits"
                              type="text"
                              inputMode="numeric"
                              value={formData.totalUnits}
                              onChange={(e) =>
                                handleNumberChange(
                                  "totalUnits",
                                  e.target.value
                                )
                              }
                              onBlur={() =>
                                handleBlur("totalUnits")
                              }
                              placeholder="120"
                              className={inputClass(
                                "totalUnits"
                              )}
                            />

                            <div className="min-h-[21px]">
                              {errors.totalUnits && (
                                <p className={errorClass}>
                                  {errors.totalUnits}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="totalFloors"
                              className={labelClass}
                            >
                              Total Floors
                              <span className="ml-1 text-[#D65353]">
                                *
                              </span>
                            </label>

                            <input
                              id="totalFloors"
                              type="text"
                              inputMode="numeric"
                              value={formData.totalFloors}
                              onChange={(e) =>
                                handleNumberChange(
                                  "totalFloors",
                                  e.target.value
                                )
                              }
                              onBlur={() =>
                                handleBlur("totalFloors")
                              }
                              placeholder="10"
                              className={inputClass(
                                "totalFloors"
                              )}
                            />

                            <div className="min-h-[21px]">
                              {errors.totalFloors && (
                                <p className={errorClass}>
                                  {errors.totalFloors}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="totalBlocks"
                              className={labelClass}
                            >
                              Total Blocks
                              <span className="ml-1 text-[#D65353]">
                                *
                              </span>
                            </label>

                            <input
                              id="totalBlocks"
                              type="text"
                              inputMode="numeric"
                              value={formData.totalBlocks}
                              onChange={(e) =>
                                handleNumberChange(
                                  "totalBlocks",
                                  e.target.value
                                )
                              }
                              onBlur={() =>
                                handleBlur("totalBlocks")
                              }
                              placeholder="3"
                              className={inputClass(
                                "totalBlocks"
                              )}
                            />

                            <div className="min-h-[21px]">
                              {errors.totalBlocks && (
                                <p className={errorClass}>
                                  {errors.totalBlocks}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-7 overflow-hidden rounded-2xl border border-[#DDE7E2] bg-[#F4F8F6]">
                          <div className="grid grid-cols-3 divide-x divide-[#DDE5E1]">
                            <div className="px-5 py-6 text-center">
                              <p className="text-[29px] font-bold tracking-tight text-[#154C3E]">
                                {formData.totalUnits || "—"}
                              </p>

                              <p className="mt-1 text-[13px] font-semibold text-[#798681]">
                                Units
                              </p>
                            </div>

                            <div className="px-5 py-6 text-center">
                              <p className="text-[29px] font-bold tracking-tight text-[#154C3E]">
                                {formData.totalFloors || "—"}
                              </p>

                              <p className="mt-1 text-[13px] font-semibold text-[#798681]">
                                Floors
                              </p>
                            </div>

                            <div className="px-5 py-6 text-center">
                              <p className="text-[29px] font-bold tracking-tight text-[#154C3E]">
                                {formData.totalBlocks || "—"}
                              </p>

                              <p className="mt-1 text-[13px] font-semibold text-[#798681]">
                                Blocks
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="mt-5 text-[13px] leading-6 text-[#7A8782]">
                          Detailed blocks, floors and flat
                          numbers can be configured after
                          apartment registration.
                        </p>
                      </div>
                    )}


                    {step === 3 && (
                      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label
                            htmlFor="parkingSlots"
                            className={labelClass}
                          >
                            Parking Slots
                            <span className="ml-1 text-[#D65353]">
                              *
                            </span>
                          </label>

                          <input
                            id="parkingSlots"
                            type="text"
                            inputMode="numeric"
                            value={formData.parkingSlots}
                            onChange={(e) =>
                              handleNumberChange(
                                "parkingSlots",
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handleBlur("parkingSlots")
                            }
                            placeholder="Enter available parking slots"
                            className={inputClass(
                              "parkingSlots"
                            )}
                          />

                          <div className="min-h-[21px]">
                            {errors.parkingSlots && (
                              <p className={errorClass}>
                                {errors.parkingSlots}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="contactNumber"
                            className={labelClass}
                          >
                            Apartment Contact Number
                            <span className="ml-1 text-[#D65353]">
                              *
                            </span>
                          </label>

                          <input
                            id="contactNumber"
                            type="tel"
                            inputMode="numeric"
                            value={formData.contactNumber}
                            onChange={(e) =>
                              handlePhoneChange(
                                "contactNumber",
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handleBlur("contactNumber")
                            }
                            placeholder="9876543210"
                            className={inputClass(
                              "contactNumber"
                            )}
                          />

                          <div className="min-h-[21px]">
                            {errors.contactNumber && (
                              <p className={errorClass}>
                                {errors.contactNumber}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="emergencyNumber"
                            className={labelClass}
                          >
                            Emergency Contact Number
                            <span className="ml-1 text-[#D65353]">
                              *
                            </span>
                          </label>

                          <input
                            id="emergencyNumber"
                            type="tel"
                            inputMode="numeric"
                            value={formData.emergencyNumber}
                            onChange={(e) =>
                              handlePhoneChange(
                                "emergencyNumber",
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handleBlur("emergencyNumber")
                            }
                            placeholder="9876543210"
                            className={inputClass(
                              "emergencyNumber"
                            )}
                          />

                          <div className="min-h-[21px]">
                            {errors.emergencyNumber && (
                              <p className={errorClass}>
                                {errors.emergencyNumber}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 rounded-2xl border border-[#DCE7E2] bg-[#F3F8F5] px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D8EBE3] text-[15px] font-bold text-[#174D40]">
                              ✓
                            </div>

                            <div>
                              <p className="text-[15px] font-semibold text-[#244038]">
                                Almost complete
                              </p>

                              <p className="mt-0.5 text-[13px] text-[#74807B]">
                                Enter valid details to complete
                                your apartment setup.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>


              <div className="h-[78px] shrink-0 border-t border-[#E5EAE7] bg-[#FBFCFB]">
                <div className="mx-auto flex h-full max-w-[860px] items-center justify-between px-8 lg:px-0">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={step === 1 || isSubmitting}
                    className="h-[48px] rounded-xl border border-[#D2DAD6] bg-white px-6 text-[14px] font-semibold text-[#45534E] transition hover:border-[#B6C2BC] hover:bg-[#F3F6F4] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ← Back
                  </button>

                  {submitError ? (
                    <p className="max-w-[360px] text-center text-[12px] font-semibold text-[#D65353]">
                      {submitError}
                    </p>
                  ) : (
                    <p className="hidden text-[12px] font-medium text-[#89948F] sm:block">
                      <span className="font-bold text-[#D65353]">
                        *
                      </span>{" "}
                      All fields are required
                    </p>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={isSubmitting}
                      className="group h-[48px] rounded-xl bg-[#123F35] px-7 text-[14px] font-bold text-white shadow-[0_7px_20px_rgba(18,63,53,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0D342C] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      Continue
                      <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group h-[48px] rounded-xl bg-[#123F35] px-7 text-[14px] font-bold text-white shadow-[0_7px_20px_rgba(18,63,53,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0D342C]"
                    >
                      {isSubmitting
                        ? "Saving..."
                        : "Complete Setup"}
                      <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
