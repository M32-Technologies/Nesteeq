import type { Metadata } from "next";
import { ResidentParkingPage } from "@/features/dashboard/resident/components/resident-parking-page";

export const metadata: Metadata = {
  title: "Parking & Amenities | Nesteeq Resident Portal",
  description: "Manage parking bays, RFID boom-barrier passes, and amenities.",
};

export default function Page() {
  return <ResidentParkingPage />;
}
