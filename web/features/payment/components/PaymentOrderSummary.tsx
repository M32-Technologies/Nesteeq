import { formatCurrency } from "../constraints/payment.constants";
import type { SelectedPlan } from "../types/payment.types";

type PaymentOrderSummaryProps = {
  plan: SelectedPlan;
  subtotal: number;
  cgst: number;
  sgst: number;
  paymentMessage: string;
  paymentError: string;
  isPaying: boolean;
  onConfirmPayment: () => void;
};

export default function PaymentOrderSummary({
  plan,
  subtotal,
  cgst,
  sgst,
  paymentMessage,
  paymentError,
  isPaying,
  onConfirmPayment,
}: PaymentOrderSummaryProps) {
  return (
    <aside>
      <div className="sticky top-6 rounded-3xl border border-[#D9E2DE] bg-white p-6 shadow-[0_18px_55px_rgba(18,63,53,0.10)]">
        <div className="border-b border-[#E8EDEB] pb-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#426457]">
            Order Summary
          </p>

          <h3 className="mt-2 text-xl font-black text-[#111A17]">
            {plan.name}
          </h3>

          <p className="mt-1 text-xs font-bold text-[#5F6D67]">
            {plan.duration}
          </p>
        </div>

        <div className="space-y-4 py-6">
          <PriceRow
            label="Subscription value"
            value={formatCurrency(
              subtotal
            )}
          />

          <PriceRow
            label="CGST (9%)"
            value={formatCurrency(
              cgst
            )}
          />

          <PriceRow
            label="SGST (9%)"
            value={formatCurrency(
              sgst
            )}
          />

          <div className="border-t border-dashed border-[#C5D0CB] pt-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[#111A17]">
                  Total Amount
                </p>

                <p className="mt-1 text-xs font-bold text-[#64716C]">
                  Inclusive of all taxes
                </p>
              </div>

              <p className="text-[29px] font-black tracking-tight text-[#123F35]">
                {formatCurrency(
                  plan.amount
                )}
              </p>
            </div>
          </div>
        </div>


        {paymentMessage && (
          <div className="mb-4 rounded-xl border border-[#CFE2D9] bg-[#EFF7F3] px-4 py-3">
            <p className="text-[12px] font-bold text-[#28604E]">
              {paymentMessage}
            </p>
          </div>
        )}


        {paymentError && (
          <div className="mb-4 rounded-xl border border-[#F0CCCC] bg-[#FFF5F5] px-4 py-3">
            <p className="text-[12px] font-bold text-[#B64242]">
              {paymentError}
            </p>
          </div>
        )}


        <button
          type="button"
          onClick={
            onConfirmPayment
          }
          disabled={isPaying}
          className="group flex h-[54px] w-full items-center justify-center rounded-xl bg-[#123F35] px-4 text-[15px] font-black text-white shadow-[0_8px_24px_rgba(18,63,53,0.20)] transition hover:-translate-y-0.5 hover:bg-[#0D342C] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isPaying
            ? "Please wait..."
            : `Confirm & Pay ${formatCurrency(
                plan.amount
              )}`}

          {!isPaying && (
            <span className="ml-2 transition-transform group-hover:translate-x-1">
             
            </span>
          )}
        </button>


        <div className="mt-5 flex items-center justify-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF4F1] text-xs font-black text-[#315D50]">
            âœ“
          </div>

          <p className="text-xs font-bold text-[#5D6965]">
            Secure payment powered by
            Razorpay
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] font-semibold leading-5 text-[#69756F]">
          By confirming payment you
          agree to the subscription
          billing terms.
        </p>
      </div>
    </aside>
  );
}

function PriceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-bold text-[#4E5C57]">
        {label}
      </p>

      <p className="text-sm font-black text-[#18251F]">
        {value}
      </p>
    </div>
  );
}
