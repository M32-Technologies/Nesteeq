export type FormData = {
  name: string;
  email: string;
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

export type FieldName = keyof FormData;
export type FormErrors = Partial<Record<FieldName, string>>;

export type SavedApartment = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
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

export type ApartmentCreateResponse = {
  success: boolean;
  message?: string;
  data?: SavedApartment;
  apartment?: SavedApartment;
};

export type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  details?: Array<{
    path?: string;
    message?: string;
  }>;
};
