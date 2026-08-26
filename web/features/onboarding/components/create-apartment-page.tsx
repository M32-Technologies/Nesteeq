"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Layers3,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type FieldError } from "react-hook-form";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import {
  createApartmentFields,
  createApartmentFormSchema,
  type CreateApartmentFormValues,
  type CreateApartmentInput,
} from "../schemas/create-apartment";
import { useCreateApartment } from "../hooks/use-create-apartment";

const steps = [
  {
    key: "account",
    eyebrow: "Step 1 of 4",
    title: "Start with the community",
    fields: createApartmentFields.account,
  },
  {
    key: "location",
    eyebrow: "Step 2 of 4",
    title: "Where is it located?",
    fields: createApartmentFields.location,
  },
  {
    key: "structure",
    eyebrow: "Step 3 of 4",
    title: "Add building details",
    fields: createApartmentFields.structure,
  },
  {
    key: "contacts",
    eyebrow: "Step 4 of 4",
    title: "Who should residents call?",
    fields: createApartmentFields.contacts,
  },
] as const;

const fieldClassName =
  "h-[50px] w-full rounded-[13px] border border-[var(--border)] bg-white px-4 text-[14px] text-[var(--ink)] outline-none transition placeholder:text-[var(--text-muted)] hover:border-[var(--green-sage)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--green-soft)] disabled:bg-[var(--surface)] disabled:text-[var(--text-muted)]";

function getErrorMessage(error?: FieldError) {
  return error?.message;
}

export default function CreateApartmentPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const createApartmentMutation = useCreateApartment();
  const [stepIndex, setStepIndex] = useState(0);
  const [createdName, setCreatedName] = useState("");

  const userEmail = session?.user?.email ?? "";
  const userPhone = session?.user?.phone ?? "";
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const isComplete = createApartmentMutation.isSuccess;

  const defaultValues = useMemo<CreateApartmentFormValues>(
    () => ({
      managerEmail: userEmail,
      name: "",
      state: "",
      city: "",
      address: "",
      totalUnits: "",
      totalFloors: "",
      totalBlocks: "",
      parkingSlots: "",
      contactNumber: userPhone,
      emergencyContact: "",
    }),
    [userEmail, userPhone],
  );

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CreateApartmentFormValues>({
    resolver: zodResolver(createApartmentFormSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    if (userEmail) {
      setValue("managerEmail", userEmail, {
        shouldValidate: false,
      });
    }
  }, [setValue, userEmail]);

  useEffect(() => {
    if (userPhone) {
      setValue("contactNumber", userPhone, {
        shouldValidate: false,
      });
    }
  }, [setValue, userPhone]);

  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      toast.error("Please sign in to create your apartment.");
      router.push("/login");
    }
  }, [isSessionPending, router, session?.user]);

  const goNext = async () => {
    const isValid = await trigger(currentStep.fields, {
      shouldFocus: true,
    });

    if (!isValid) return;

    setStepIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  const goBack = () => {
    setStepIndex((value) => Math.max(value - 1, 0));
  };

  const submitApartment = async (values: CreateApartmentFormValues) => {
    const isValid = await trigger(currentStep.fields, {
      shouldFocus: true,
    });

    if (!isValid) return;

    const input: CreateApartmentInput = {
      name: values.name,
      state: values.state,
      city: values.city,
      address: values.address,
      totalUnits: values.totalUnits,
      totalFloors: values.totalFloors,
      totalBlocks: values.totalBlocks,
      parkingSlots: values.parkingSlots,
      contactNumber: values.contactNumber,
      emergencyContact: values.emergencyContact,
    };

    try {
      const apartment = await createApartmentMutation.mutateAsync(input);
      setCreatedName(apartment.name);
      toast.success("Apartment registration created.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create apartment.",
      );
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-10 text-[var(--ink)] sm:px-6">
      <section className="w-full max-w-[500px]">
        <div className="mx-auto mb-7 flex w-fit items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--brand)] text-sm font-bold text-white">
            N
          </span>

          <span className="text-[22px] font-semibold tracking-[-0.03em]">
            Nesteeq
          </span>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <span
              key={step.key}
              className={`h-1 rounded-full transition-all duration-300 ${
                index <= stepIndex
                  ? "w-10 bg-[var(--brand)]"
                  : "w-5 bg-[var(--green-soft)]"
              }`}
            />
          ))}
        </div>

        <div className="min-h-[560px]">
          <AnimatePresence mode="wait" initial={false}>
            {isComplete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-[520px] flex-col items-center justify-center text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green-soft)] text-[var(--brand)]">
                  <Check className="h-6 w-6" />
                </div>

                <h1 className="mt-6 text-[30px] font-semibold leading-tight tracking-[-0.04em]">
                  Apartment created
                </h1>

                <p className="mt-3 max-w-[340px] text-sm leading-6 text-[var(--text)]">
                  {createdName || "Your apartment"} is ready for the next
                  setup step.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/property-manager")}
                  className="mt-8 flex h-[50px] items-center justify-center gap-2 rounded-[13px] bg-[var(--brand)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <motion.form
                key={currentStep.key}
                onSubmit={handleSubmit(submitApartment)}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-[520px] flex-col"
              >
                <div className="mb-8 text-center">
                  <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em]">
                    {currentStep.title}
                  </h1>
                </div>

                <div className="space-y-4">
                  {currentStep.key === "account" && (
                    <>
                      <FormField
                        label="Manager email"
                        error={getErrorMessage(errors.managerEmail)}
                        icon={<Mail className="field-icon" />}
                      >
                        <input
                          type="email"
                          autoComplete="email"
                          readOnly
                          {...register("managerEmail")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>

                      <FormField
                        label="Apartment name"
                        error={getErrorMessage(errors.name)}
                        icon={<Building2 className="field-icon" />}
                      >
                        <input
                          type="text"
                          autoComplete="organization"
                          placeholder="Green Heights"
                          {...register("name")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>
                    </>
                  )}

                  {currentStep.key === "location" && (
                    <>
                      <FormField
                        label="State"
                        error={getErrorMessage(errors.state)}
                        icon={<MapPin className="field-icon" />}
                      >
                        <input
                          type="text"
                          autoComplete="address-level1"
                          placeholder="Kerala"
                          {...register("state")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>

                      <FormField
                        label="City"
                        error={getErrorMessage(errors.city)}
                        icon={<MapPin className="field-icon" />}
                      >
                        <input
                          type="text"
                          autoComplete="address-level2"
                          placeholder="Kochi"
                          {...register("city")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>

                      <FormField
                        label="Address"
                        error={getErrorMessage(errors.address)}
                        icon={<MapPin className="field-icon" />}
                      >
                        <textarea
                          rows={3}
                          autoComplete="street-address"
                          placeholder="Building name, street, area"
                          {...register("address")}
                          className="min-h-[96px] w-full resize-none rounded-[13px] border border-[var(--border)] bg-white py-3 pl-11 pr-4 text-[14px] leading-6 text-[var(--ink)] outline-none transition placeholder:text-[var(--text-muted)] hover:border-[var(--green-sage)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--green-soft)]"
                        />
                      </FormField>
                    </>
                  )}

                  {currentStep.key === "structure" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        label="Total units"
                        error={getErrorMessage(errors.totalUnits)}
                        icon={<Layers3 className="field-icon" />}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="120"
                          {...register("totalUnits")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>

                      <FormField
                        label="Total floors"
                        error={getErrorMessage(errors.totalFloors)}
                        icon={<Layers3 className="field-icon" />}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="12"
                          {...register("totalFloors")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>

                      <FormField
                        label="Total blocks"
                        error={getErrorMessage(errors.totalBlocks)}
                        icon={<Layers3 className="field-icon" />}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="4"
                          {...register("totalBlocks")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>

                      <FormField
                        label="Parking slots"
                        error={getErrorMessage(errors.parkingSlots)}
                        icon={<Layers3 className="field-icon" />}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="80"
                          {...register("parkingSlots")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>
                    </div>
                  )}

                  {currentStep.key === "contacts" && (
                    <>
                      <FormField
                        label="Contact number"
                        error={getErrorMessage(errors.contactNumber)}
                        icon={<Phone className="field-icon" />}
                      >
                        <input
                          type="tel"
                          autoComplete="tel"
                          placeholder="+91 98765 43210"
                          {...register("contactNumber")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>

                      <FormField
                        label="Emergency contact (optional)"
                        error={getErrorMessage(errors.emergencyContact)}
                        icon={<Phone className="field-icon" />}
                      >
                        <input
                          type="tel"
                          autoComplete="tel"
                          aria-label="Emergency contact optional"
                          placeholder="+91 98765 43211"
                          {...register("emergencyContact")}
                          className={`${fieldClassName} pl-11`}
                        />
                      </FormField>
                    </>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-3 pt-8">
                  {stepIndex > 0 && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex h-[50px] w-[52px] shrink-0 items-center justify-center rounded-[13px] border border-[var(--border)] text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                      aria-label="Back"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  )}

                  {isLastStep ? (
                    <button
                      type="submit"
                      disabled={createApartmentMutation.isPending}
                      className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[13px] bg-[var(--brand)] text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {createApartmentMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Create apartment
                          <Check className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void goNext()}
                      className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[13px] bg-[var(--brand)] text-[14px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}

type FormFieldProps = {
  label: string;
  error?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

function FormField({
  label,
  error,
  icon,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold text-[var(--ink)]">
        {label}
      </label>

      <div
        className="
          group relative
          [&_.field-icon]:pointer-events-none
          [&_.field-icon]:absolute
          [&_.field-icon]:left-4
          [&_.field-icon]:top-[25px]
          [&_.field-icon]:h-[18px]
          [&_.field-icon]:w-[18px]
          [&_.field-icon]:-translate-y-1/2
          [&_.field-icon]:text-[var(--text-muted)]
          [&_.field-icon]:transition-colors
          [&:focus-within_.field-icon]:text-[var(--brand)]
        "
      >
        {icon}
        {children}
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-[var(--rose)]">
          {error}
        </p>
      )}
    </div>
  );
}
