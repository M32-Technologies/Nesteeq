import {
  indianStates,
  unionTerritories,
} from "../constraints/onboarding.constants";
import type {
  FieldName,
  FormData,
  FormErrors,
} from "../types/onboarding.types";

type BasicDetailsStepProps = {
  formData: FormData;
  errors: FormErrors;
  inputClass: (field: FieldName) => string;
  labelClass: string;
  errorClass: string;
  setFieldValue: (field: FieldName, value: string) => void;
  handleTextChange: (
    field: "name" | "city",
    value: string
  ) => void;
  handleBlur: (field: FieldName) => void;
};

export default function BasicDetailsStep({
  formData,
  errors,
  inputClass,
  labelClass,
  errorClass,
  setFieldValue,
  handleTextChange,
  handleBlur,
}: BasicDetailsStepProps) {
  return (
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

      <div className="md:col-span-2">
        <label
          htmlFor="email"
          className={labelClass}
        >
          Email Address
          <span className="ml-1 text-[#D65353]">
            *
          </span>
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={(e) =>
            setFieldValue(
              "email",
              e.target.value
            )
          }
          onBlur={() => handleBlur("email")}
          placeholder="Example: admin@greenvalley.com"
          className={inputClass("email")}
        />

        <div className="min-h-[21px]">
          {errors.email && (
            <p className={errorClass}>
              {errors.email}
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
  );
}
