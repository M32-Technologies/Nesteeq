import type {
  FieldName,
  FormData,
} from "../types/onboarding.types";

export const stepFields: Record<number, FieldName[]> = {
  1: ["name", "email", "state", "city", "address"],
  2: ["totalUnits", "totalFloors", "totalBlocks"],
  3: ["parkingSlots", "contactNumber", "emergencyNumber"],
};

export const INITIAL_ONBOARDING_FORM_DATA: FormData = {
  name: "",
  email: "",
  state: "",
  city: "",
  address: "",
  totalUnits: "",
  totalFloors: "",
  totalBlocks: "",
  parkingSlots: "",
  contactNumber: "",
  emergencyNumber: "",
};

export const indianStates = [
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

export const unionTerritories = [
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];
