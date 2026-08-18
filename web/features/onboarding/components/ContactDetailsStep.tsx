import type {
  FieldName,
  FormData,
  FormErrors,
} from "../types/onboarding.types";

type ContactDetailsStepProps = {
  formData: FormData;
  errors: FormErrors;
  inputClass: (field: FieldName) => string;
  labelClass: string;
  errorClass: string;
  handleNumberChange: (
    field:
      | "totalUnits"
      | "totalFloors"
      | "totalBlocks"
      | "parkingSlots",
    value: string
  ) => void;
  handlePhoneChange: (
    field: "contactNumber" | "emergencyNumber",
    value: string
  ) => void;
  handleBlur: (field: FieldName) => void;
};

export default function ContactDetailsStep({
  formData,
  errors,
  inputClass,
  labelClass,
  errorClass,
  handleNumberChange,
  handlePhoneChange,
  handleBlur,
}: ContactDetailsStepProps) {
  return (
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
  );
}
