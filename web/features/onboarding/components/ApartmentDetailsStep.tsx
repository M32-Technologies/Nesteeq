import type {
  FieldName,
  FormData,
  FormErrors,
} from "../types/onboarding.types";

type ApartmentDetailsStepProps = {
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
  handleBlur: (field: FieldName) => void;
};

export default function ApartmentDetailsStep({
  formData,
  errors,
  inputClass,
  labelClass,
  errorClass,
  handleNumberChange,
  handleBlur,
}: ApartmentDetailsStepProps) {
  return (
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
  );
}
