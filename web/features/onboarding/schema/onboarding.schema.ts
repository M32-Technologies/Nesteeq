import { z } from "zod";

import {
  indianStates,
  unionTerritories,
} from "../constraints/onboarding.constants";
import type { FieldName } from "../types/onboarding.types";

const requiredString = z.string().trim().min(1, "Required");

const wholeNumberGreaterThanZero = requiredString.refine(
  (value) => {
    const numberValue = Number(value);

    return Number.isInteger(numberValue) && numberValue > 0;
  },
  {
    message: "Enter a whole number greater than 0",
  }
);

const onboardingFieldSchemas: Record<
  FieldName,
  z.ZodType<string>
> = {
  name: requiredString
    .min(3, "Enter a valid apartment name")
    .regex(/^[A-Za-z][A-Za-z\s.'&-]*$/, {
      message: "Numbers are not allowed",
    }),

  email: requiredString.email("Enter a valid email address"),

  state: requiredString.refine(
    (value) =>
      indianStates.includes(value) ||
      unionTerritories.includes(value),
    {
      message: "Select a valid state",
    }
  ),

  city: requiredString
    .min(2, "Enter a valid city")
    .regex(/^[A-Za-z][A-Za-z\s.'-]*$/, {
      message: "Numbers are not allowed",
    }),

  address: requiredString.min(
    10,
    "Enter a complete apartment address"
  ),

  totalUnits: wholeNumberGreaterThanZero,

  totalFloors: wholeNumberGreaterThanZero,

  totalBlocks: wholeNumberGreaterThanZero,

  parkingSlots: requiredString.refine(
    (value) => {
      const numberValue = Number(value);

      return Number.isInteger(numberValue) && numberValue >= 0;
    },
    {
      message: "Enter a valid parking slot count",
    }
  ),

  contactNumber: requiredString.refine(
    (value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, "")),
    {
      message: "Enter a valid 10-digit Indian mobile number",
    }
  ),

  emergencyNumber: requiredString.refine(
    (value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, "")),
    {
      message: "Enter a valid 10-digit Indian mobile number",
    }
  ),
};

export const validateOnboardingField = (
  name: FieldName,
  value: string
): string => {
  const result = onboardingFieldSchemas[name].safeParse(value);

  return result.success
    ? ""
    : result.error.issues[0]?.message || "";
};
