"use client";

import { Banknote, Landmark, Smartphone } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { RiderGate } from "@/components/rider/rider-gate";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import {
  useCancelWithdrawal,
  useRequestWithdrawal,
  useRiderWallet,
  useWithdrawals,
} from "@/hooks/use-riders";
import { ApiError } from "@/lib/api-client";
import { formatDateTime, formatPrice, hasText } from "@/lib/utils";
import { PayoutMethod, PayoutStatus } from "@/types/enums";
import type { RiderDto } from "@/types/rider";

const METHODS: Array<{ value: PayoutMethod; label: string; icon: typeof Landmark }> = [
  { value: PayoutMethod.BANK_TRANSFER, label: "Bank transfer", icon: Landmark },
  { value: PayoutMethod.JAZZCASH, label: "JazzCash", icon: Smartphone },
  { value: PayoutMethod.EASYPAISA, label: "Easypaisa", icon: Smartphone },
];

export default function RiderWithdrawalsPage() {
  return <RiderGate>{(rider) => <Withdrawals rider={rider} />}</RiderGate>;
}

function Withdrawals({ rider }: { rider: RiderDto }) {
  const wallet = useRiderWallet();
  const history = useWithdrawals({ limit: 25, sortOrder: "desc" });
  const request = useRequestWithdrawal();
  const cancel = useCancelWithdrawal();

  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<PayoutMethod>(PayoutMethod.BANK_TRANSFER);

  const available = wallet.data?.availableToWithdraw ?? 0;
  const locked = wallet.data?.isLocked === true;
  // The API refuses a withdrawal with no payout account on file, so the form
  // says so rather than letting the rider find out on submit.
  const hasPayoutDetails = hasText(rider.payout?.accountNumber);

  const parsed = Number(amount);
  const validAmount = Number.isFinite(parsed) && parsed >= 1 && parsed <= available;
  const canRequest = validAmount && !locked && hasPayoutDetails;

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Withdrawals"
        description="Move money out of your wallet and into your account."
      />

      <Panel
        title="Request a withdrawal"
        description={
          wallet.isSuccess
            ? `${formatPrice(available)} available right now.`
            : "Checking what's available…"
        }
      >
        {!hasPayoutDetails ? (
          <EmptyState
            density="inline"
            icon={<Landmark className="size-6" />}
            title="Add your payout account first"
            description="We need the account to transfer to before you can withdraw. Support can add it to your rider profile."
          />
        ) : locked ? (
          <p className="rounded-[var(--radius-input)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            Your wallet is frozen, so withdrawals are paused. Support can tell you more.
          </p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canRequest) return;

              request.mutate(
                { amount: parsed, method },
                {
                  onSuccess: (payout) => {
                    toast.success(`Withdrawal ${payout.reference} requested`);
                    setAmount("");
                  },
                  onError: (error) =>
                    toast.error(
                      error instanceof ApiError
                        ? error.message
                        : "We couldn't request that withdrawal.",
                    ),
                },
              );
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Amount"
                htmlFor="withdrawal-amount"
                required
                hint={`Up to ${formatPrice(available)}`}
                error={
                  amount !== "" && !validAmount
                    ? parsed > available
                      ? "That's more than you have available."
                      : "Enter an amount of at least Rs 1."
                    : undefined
                }
              >
                <Input
                  id="withdrawal-amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
                  inputMode="decimal"
                  placeholder="2500"
                  className="numeric"
                  invalid={amount !== "" && !validAmount}
                  required
                />
              </Field>

              <Field label="Send it to" htmlFor="withdrawal-method" required>
                <NativeSelect
                  id="withdrawal-method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value as PayoutMethod)}
                >
                  {METHODS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={request.isPending} disabled={!canRequest}>
                <Banknote className="size-4" />
                Request withdrawal
              </Button>
              <p className="text-xs text-muted">
                Held out of your wallet straight away, then paid once an administrator approves it.
              </p>
            </div>
          </form>
        )}
      </Panel>

      <Panel title="Your requests" bodyClassName="p-0">
        {history.isPending ? (
          <div className="p-5 sm:p-6">
            <ListSkeleton label="Loading withdrawals" count={3} />
          </div>
        ) : history.isError ? (
          <ErrorState
            density="inline"
            error={history.error}
            onRetry={() => void history.refetch()}
          />
        ) : history.data.items.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<Banknote className="size-6" />}
            title="No withdrawals yet"
            description="Requests you make will be tracked here until they're paid."
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {history.data.items.map((payout) => (
              <li key={payout.id} className="flex flex-col gap-2 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="numeric font-bold text-primary">
                      {formatPrice(payout.amount)}
                    </span>
                    <span className="numeric text-xs text-muted">
                      {payout.reference} · {formatDateTime(payout.createdAt)}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="numeric text-xs text-muted">
                      {payout.bankName ?? payout.method.replace(/_/g, " ").toLowerCase()} ·{" "}
                      {payout.accountNumber}
                    </span>
                    <StatusPill status={payout.status} size="sm" />
                    {payout.status === PayoutStatus.PENDING && (
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={cancel.isPending}
                        onClick={() =>
                          cancel.mutate(payout.id, {
                            onSuccess: () => toast.success("Withdrawal cancelled"),
                            onError: (error) =>
                              toast.error(
                                error instanceof ApiError
                                  ? error.message
                                  : "We couldn't cancel that request.",
                              ),
                          })
                        }
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {hasText(payout.rejectionReason) && (
                  <p className="rounded-[var(--radius-input)] bg-danger-soft px-3.5 py-2 text-xs font-medium text-danger">
                    {payout.rejectionReason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
