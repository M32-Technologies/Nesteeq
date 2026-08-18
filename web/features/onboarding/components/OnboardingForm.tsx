"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ApartmentDetailsStep from "./ApartmentDetailsStep";
import BasicDetailsStep from "./BasicDetailsStep";
import ContactDetailsStep from "./ContactDetailsStep";
import {
  INITIAL_ONBOARDING_FORM_DATA,
  stepFields,
} from "../constraints/onboarding.constants";
import { validateOnboardingField } from "../schema/onboarding.schema";
import type {
  ApiErrorResponse,
  ApartmentCreateResponse,
  FieldName,
  FormData,
  FormErrors,
} from "../types/onboarding.types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || ""
).replace(/\/$/, "");

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
    return `Backend unreachable while trying to ${action}. Make sure the API is running at ${API_BASE_URL}.`;
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

const EMAIL_STORAGE_KEYS = [
  "nesteeqRegisteredEmail",
  "nesteeqRegistrationEmail",
  "nesteeqUserEmail",
  "nesteeqEmail",
  "registeredEmail",
  "registrationEmail",
  "userEmail",
  "email",
];

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const findEmailInValue = (
  value: unknown
): string => {
  if (typeof value === "string") {
    const trimmedValue = value.trim();

    return EMAIL_PATTERN.test(trimmedValue)
      ? trimmedValue
      : "";
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const record = value as Record<string, unknown>;

    if (record.email) {
      const email = findEmailInValue(record.email);

      if (email) {
        return email;
      }
    }

    for (const nestedValue of Object.values(record)) {
      const email = findEmailInValue(nestedValue);

      if (email) {
        return email;
      }
    }
  }

  return "";
};

const readEmailFromStorageValue = (
  value: string | null
) => {
  if (!value) {
    return "";
  }

  const directEmail = findEmailInValue(value);

  if (directEmail) {
    return directEmail;
  }

  try {
    return findEmailInValue(JSON.parse(value));
  } catch {
    return "";
  }
};

const readRegisteredEmail = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const storages = [
    window.sessionStorage,
    window.localStorage,
  ];

  for (const storage of storages) {
    for (const key of EMAIL_STORAGE_KEYS) {
      const email = readEmailFromStorageValue(
        storage.getItem(key)
      );

      if (email) {
        return email;
      }
    }

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);

      if (!key || !/(email|user|auth|register|signup)/i.test(key)) {
        continue;
      }

      const email = readEmailFromStorageValue(
        storage.getItem(key)
      );

      if (email) {
        return email;
      }
    }
  }

  return "";
};

const createApartment = async ({
  formData,
  setupRequestId,
}: {
  formData: FormData;
  setupRequestId: string;
}) => {
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

  return result;
};

export default function OnboardingForm() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [completedStep, setCompletedStep] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_ONBOARDING_FORM_DATA,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] =
    useState("");
  const createApartmentMutation = useMutation({
    mutationFn: createApartment,
  });
  const isSubmitting =
    createApartmentMutation.isPending;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const registeredEmail = readRegisteredEmail();

      if (!registeredEmail) {
        return;
      }

      setFormData((prev) =>
        prev.email
          ? prev
          : {
              ...prev,
              email: registeredEmail,
            }
      );
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

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
      const newError = validateOnboardingField(field, value);

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
      const error = validateOnboardingField(
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
    const error = validateOnboardingField(
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

    setSubmitError("");

    try {
      const setupRequestId = createSetupRequestId();

      sessionStorage.setItem(
        "nesteeqOnboardingSetupRequestId",
        setupRequestId
      );

      const result =
        await createApartmentMutation.mutateAsync({
          formData,
          setupRequestId,
        });

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

      setCompletedStep(3);

      sessionStorage.removeItem(
        "nesteeqOnboarding"
      );

      sessionStorage.setItem(
        "nesteeqApartmentId",
        apartmentId
      );

      router.push(`/payment?apartmentId=${apartmentId}`);
    } catch (error) {
      setSubmitError(
        getNetworkErrorMessage(
          error,
          "save apartment"
        )
      );
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

            <div className="min-h-[76px] shrink-0 border-b border-[#E7ECE9] px-8 py-4 lg:px-12 xl:px-16">
              <div className="mx-auto flex h-full max-w-[860px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[12px] font-medium leading-none text-[#8A9490]">
                    Setup progress
                  </p>

                  <p className="text-[15px] font-bold leading-none text-[#293730]">
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
              <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7 lg:px-12 xl:px-16">
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

                  <div className="min-h-[430px]">

                    {step === 1 && (
                      <BasicDetailsStep
                        formData={formData}
                        errors={errors}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        errorClass={errorClass}
                        setFieldValue={setFieldValue}
                        handleTextChange={handleTextChange}
                        handleBlur={handleBlur}
                      />
                    )}


                    {step === 2 && (
                      <ApartmentDetailsStep
                        formData={formData}
                        errors={errors}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        errorClass={errorClass}
                        handleNumberChange={handleNumberChange}
                        handleBlur={handleBlur}
                      />
                    )}


                    {step === 3 && (
                      <ContactDetailsStep
                        formData={formData}
                        errors={errors}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        errorClass={errorClass}
                        handleNumberChange={handleNumberChange}
                        handlePhoneChange={handlePhoneChange}
                        handleBlur={handleBlur}
                      />
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
