import { formatCurrency } from "../constraints/payment.constants";
import type {
  ApartmentData,
  SelectedPlan,
} from "../types/payment.types";

type PaymentSummaryCardsProps = {
  apartment: ApartmentData;
  plan: SelectedPlan;
  onEditApartment: () => void;
};

export default function PaymentSummaryCards({
  apartment,
  plan,
  onEditApartment,
}: PaymentSummaryCardsProps) {
  return (
    <div className="space-y-6">

      <section className="rounded-3xl border border-[#DEE5E1] bg-white p-7 shadow-[0_8px_30px_rgba(18,63,53,0.04)]">
        <div className="flex items-start justify-between border-b border-[#E9EEEB] pb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#426457]">
              Apartment Details
            </p>

            <h3 className="mt-2 text-[26px] font-black text-[#111A17]">
              {apartment.name}
            </h3>

            <p className="mt-2 text-[14px] font-semibold leading-6 text-[#4E5D57]">
              {apartment.address},{" "}
              {apartment.city},{" "}
              {apartment.state}
            </p>
          </div>

          <button
            type="button"
            onClick={onEditApartment}
            className="rounded-xl border border-[#D8E0DC] bg-white px-4 py-2 text-xs font-bold text-[#315C4E] transition hover:bg-[#F4F7F5]"
          >
            Edit
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <DetailCard
            value={
              apartment.totalUnits
            }
            label="Total Units"
          />

          <DetailCard
            value={
              apartment.totalFloors
            }
            label="Floors"
          />

          <DetailCard
            value={
              apartment.totalBlocks
            }
            label="Blocks"
          />

          <DetailCard
            value={
              apartment.parkingSlots
            }
            label="Parking Slots"
          />
        </div>

        <div className="mt-6 grid gap-4 border-t border-[#E9EEEB] pt-6 md:grid-cols-2">
          <InfoRow
            label="Apartment Contact"
            value={`+91 ${apartment.contactNumber}`}
          />

          <InfoRow
            label="Emergency Contact"
            value={`+91 ${
              apartment.emergencyNumber ||
              apartment.emergencyContact ||
              ""
            }`}
          />
        </div>
      </section>


      <section className="rounded-3xl border border-[#DEE5E1] bg-white p-7 shadow-[0_8px_30px_rgba(18,63,53,0.04)]">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#426457]">
              Selected Plan
            </p>

            <h3 className="mt-2 text-[26px] font-black text-[#111A17]">
              {plan.name}
            </h3>

            <p className="mt-2 text-sm font-bold text-[#52605B]">
              {plan.duration} subscription
            </p>
          </div>

          <div className="text-right">
            <p className="text-[30px] font-black text-[#123F35]">
              {formatCurrency(
                plan.amount
              )}
            </p>

            <p className="mt-1 text-xs font-bold text-[#66736E]">
              GST inclusive
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[#F2F7F4] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCECE5] font-black text-[#145240]">
              âœ“
            </div>

            <div>
              <p className="text-sm font-black text-[#27453C]">
                Ready to activate
              </p>

              <p className="mt-1 text-xs font-semibold text-[#53645D]">
                Your subscription will
                activate after successful
                payment.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E3EAE6] bg-[#F8FAF9] px-4 py-5 text-center">
      <p className="text-[28px] font-black tracking-tight text-[#174C3F]">
        {value || "â€”"}
      </p>

      <p className="mt-1 text-xs font-bold text-[#55645E]">
        {label}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-[#65736D]">
        {label}
      </p>

      <p className="mt-1 text-[15px] font-black text-[#1E2D27]">
        {value}
      </p>
    </div>
  );
}
