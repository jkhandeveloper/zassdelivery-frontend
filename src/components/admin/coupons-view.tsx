"use client";

import { Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  CellStack,
  DataTable,
  Pagination,
  RowActions,
  type Column,
} from "@/components/admin/data-table";
import { FilterBar, humaniseEnum, SearchInput, SelectFilter } from "@/components/admin/filter-bar";
import { ConfirmDialog } from "@/components/admin/reason-dialog";
import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Badge } from "@/components/ui/status-pill";
import {
  useAdminCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useSetCouponActive,
  useUpdateCoupon,
} from "@/hooks/use-admin";
import { useValueChanged } from "@/hooks/use-value-changed";
import { ApiError } from "@/lib/api-client";
import { formatCount, formatDate, formatPrice, hasText } from "@/lib/utils";
import { CouponType } from "@/types/enums";
import type { CouponDto } from "@/types/admin";

/**
 * Discount codes.
 *
 * The status column shows `isLive` rather than `isActive`, because they are
 * different facts and only one of them answers "can a customer use this right
 * now": a coupon can be active and still unusable because it has expired or run
 * out of redemptions. The toggle edits `isActive`; the badge reports the truth.
 */
export function AdminCouponsView() {
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<CouponType | "">("");
  const [liveOnly, setLiveOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);

  if (useValueChanged(`${search}|${type}|${liveOnly}`) && page !== 1) {
    setPage(1);
  }

  const coupons = useAdminCoupons({
    page,
    limit: 20,
    search: search === "" ? undefined : search,
    type: type === "" ? undefined : type,
    liveOnly: liveOnly ? true : undefined,
  });

  const setActive = useSetCouponActive();
  const deleteCoupon = useDeleteCoupon();

  const [editing, setEditing] = React.useState<CouponDto | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<CouponDto | null>(null);

  const filtered = search !== "" || type !== "" || liveOnly;

  const columns: readonly Column<CouponDto>[] = [
    {
      key: "code",
      header: "Code",
      cell: (row) => (
        <CellStack
          primary={<span className="numeric">{row.code}</span>}
          secondary={hasText(row.description) ? row.description : describeCoupon(row)}
        />
      ),
    },
    {
      key: "value",
      header: "Discount",
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="numeric font-semibold text-primary">{couponValue(row)}</span>
          {row.minOrderAmount > 0 && (
            <span className="text-xs text-muted">
              over {formatPrice(row.minOrderAmount)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "window",
      header: "Runs",
      hideBelow: "lg",
      cell: (row) => (
        <span className="numeric text-xs text-secondary">
          {formatDate(row.startsAt)} → {formatDate(row.expiresAt)}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Redeemed",
      align: "right",
      hideBelow: "md",
      cell: (row) => (
        <div className="flex flex-col items-end gap-0.5">
          <span className="numeric text-secondary">
            {formatCount(row.usageCount)}
            {row.usageLimit !== null && ` / ${formatCount(row.usageLimit)}`}
          </span>
          {row.remainingUses === 0 && (
            <span className="text-xs text-warning">Exhausted</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={row.isLive ? "soft" : "outline"} size="sm">
            {row.isLive ? "Live" : row.isActive ? "Not in window" : "Off"}
          </Badge>
          {row.firstOrderOnly && <span className="text-xs text-muted">First order only</span>}
        </div>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "1%",
      cell: (row) => (
        <RowActions>
          <Button
            size="sm"
            variant="outline"
            loading={setActive.isPending}
            onClick={() => setActive.mutate({ id: row.id, isActive: !row.isActive })}
          >
            {row.isActive ? "Turn off" : "Turn on"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(row)}>
            <Pencil className="size-4" />
            <span className="sr-only">Edit {row.code}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>
            <Trash2 className="size-4 text-danger" />
            <span className="sr-only">Delete {row.code}</span>
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Coupons"
        description="Create and manage discount codes."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New coupon
          </Button>
        }
      />

      <Panel bodyClassName="p-0">
        <div className="border-b border-border-subtle p-5 sm:p-6">
          <FilterBar
            onClear={
              filtered
                ? () => {
                    setSearch("");
                    setType("");
                    setLiveOnly(false);
                  }
                : undefined
            }
          >
            <SearchInput value={search} onChange={setSearch} placeholder="Code or description" />
            <SelectFilter
              label="Type"
              value={type}
              onChange={setType}
              allLabel="Any type"
              options={Object.values(CouponType).map((value) => ({
                value,
                label: humaniseEnum(value),
              }))}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary">
              <input
                type="checkbox"
                checked={liveOnly}
                onChange={(event) => setLiveOnly(event.target.checked)}
                className="size-4 accent-[var(--brand)]"
              />
              Redeemable right now
            </label>
          </FilterBar>
        </div>

        <DataTable
          caption="Discount codes, with their windows and redemption counts"
          columns={columns}
          rows={coupons.data?.items}
          rowKey={(row) => row.id}
          isPending={coupons.isPending}
          isError={coupons.isError}
          error={coupons.error}
          onRetry={() => void coupons.refetch()}
          empty={{
            icon: <Ticket className="size-6" />,
            title: filtered ? "No coupons match those filters" : "No coupons yet",
            description: filtered
              ? "Try a wider search, or clear the filters."
              : "Create one and it will be redeemable at checkout straight away.",
          }}
          footer={<Pagination meta={coupons.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <CouponForm
        open={creating || editing !== null}
        coupon={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.code ?? ""}?`}
        description="Turning a coupon off is usually the better move — deleting removes it entirely, and past redemptions stay on the orders that used it."
        confirmLabel="Delete coupon"
        variant="danger"
        pending={deleteCoupon.isPending}
        successMessage="Coupon deleted."
        onConfirm={() => deleteCoupon.mutateAsync(deleting?.id ?? "")}
      />
    </div>
  );
}

function couponValue(coupon: CouponDto): string {
  if (coupon.type === CouponType.FREE_DELIVERY) {
    return "Free delivery";
  }

  if (coupon.type === CouponType.PERCENTAGE) {
    return coupon.maxDiscountAmount === null
      ? `${coupon.value}%`
      : `${coupon.value}% up to ${formatPrice(coupon.maxDiscountAmount)}`;
  }

  return formatPrice(coupon.value);
}

function describeCoupon(coupon: CouponDto): string {
  const parts = [humaniseEnum(coupon.type)];

  if (coupon.perUserLimit !== null) {
    parts.push(`${coupon.perUserLimit} per customer`);
  }

  return parts.join(" · ");
}

/** An API instant as the value a `datetime-local` input wants. */
function toLocalInput(iso: string | null): string {
  if (iso === null) {
    return "";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number): string => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Creating and editing a coupon share one form.
 *
 * The percentage cap is required by the API for PERCENTAGE coupons and
 * meaningless for the others, so the field appears and disappears with the type
 * rather than sitting there greyed out — an uncapped percentage coupon is how a
 * Rs. 12,000 catering order goes out at 20% off.
 */
function CouponForm({
  open,
  coupon,
  onClose,
}: {
  open: boolean;
  coupon: CouponDto | null;
  onClose: () => void;
}) {
  const create = useCreateCoupon();
  const update = useUpdateCoupon();

  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<CouponType>(CouponType.PERCENTAGE);
  const [value, setValue] = React.useState("");
  const [maxDiscount, setMaxDiscount] = React.useState("");
  const [minOrder, setMinOrder] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [usageLimit, setUsageLimit] = React.useState("");
  const [perUserLimit, setPerUserLimit] = React.useState("");
  const [firstOrderOnly, setFirstOrderOnly] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (useValueChanged(open) && open) {
    setCode(coupon?.code ?? "");
    setType(coupon?.type ?? CouponType.PERCENTAGE);
    setValue(coupon === null ? "" : String(coupon.value));
    setMaxDiscount(coupon?.maxDiscountAmount === null || coupon === null ? "" : String(coupon.maxDiscountAmount));
    setMinOrder(coupon === null ? "" : String(coupon.minOrderAmount));
    setDescription(coupon?.description ?? "");
    setStartsAt(toLocalInput(coupon?.startsAt ?? null));
    setExpiresAt(toLocalInput(coupon?.expiresAt ?? null));
    setUsageLimit(coupon?.usageLimit === null || coupon === null ? "" : String(coupon.usageLimit));
    setPerUserLimit(coupon?.perUserLimit === null || coupon === null ? "" : String(coupon.perUserLimit));
    setFirstOrderOnly(coupon?.firstOrderOnly ?? false);
    setError(null);
  }

  const numberOrUndefined = (text: string): number | undefined =>
    text.trim() === "" ? undefined : Number(text);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      maxDiscountAmount:
        type === CouponType.PERCENTAGE ? numberOrUndefined(maxDiscount) : undefined,
      minOrderAmount: numberOrUndefined(minOrder),
      description: hasText(description) ? description.trim() : undefined,
      startsAt: new Date(startsAt).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      usageLimit: numberOrUndefined(usageLimit),
      perUserLimit: numberOrUndefined(perUserLimit),
      firstOrderOnly,
    };

    try {
      if (coupon === null) {
        await create.mutateAsync(payload);
        toast.success(`${payload.code} is ready to use.`);
      } else {
        await update.mutateAsync({ id: coupon.id, data: payload });
        toast.success(`${payload.code} updated.`);
      }

      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That did not go through.");
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="md">
        <form onSubmit={submit}>
          <ModalHeader>
            <ModalTitle>{coupon === null ? "New coupon" : `Edit ${coupon.code}`}</ModalTitle>
            <ModalDescription>
              {coupon === null
                ? "It becomes redeemable as soon as its window opens."
                : "The code cannot be changed once it has been redeemed."}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Code" htmlFor="coupon-code" required className="sm:col-span-2">
              <Input
                id="coupon-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="ZASS100"
                required
                className="numeric"
              />
            </Field>

            <Field label="Type" htmlFor="coupon-type" required>
              <NativeSelect
                id="coupon-type"
                value={type}
                onChange={(event) => setType(event.target.value as CouponType)}
              >
                {Object.values(CouponType).map((option) => (
                  <option key={option} value={option}>
                    {humaniseEnum(option)}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label={type === CouponType.PERCENTAGE ? "Percentage off" : "Amount off"}
              htmlFor="coupon-value"
              required
              hint={type === CouponType.FREE_DELIVERY ? "Ignored for free delivery." : undefined}
            >
              <Input
                id="coupon-value"
                type="number"
                min={0}
                step="0.01"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                required
              />
            </Field>

            {type === CouponType.PERCENTAGE && (
              <Field
                label="Cap the discount at"
                htmlFor="coupon-cap"
                required
                hint="Without a cap, one large order can spend the whole budget."
              >
                <Input
                  id="coupon-cap"
                  type="number"
                  min={1}
                  step="0.01"
                  value={maxDiscount}
                  onChange={(event) => setMaxDiscount(event.target.value)}
                  placeholder="200"
                  required
                />
              </Field>
            )}

            <Field label="Minimum order" htmlFor="coupon-min" hint="Blank for no minimum.">
              <Input
                id="coupon-min"
                type="number"
                min={0}
                step="0.01"
                value={minOrder}
                onChange={(event) => setMinOrder(event.target.value)}
                placeholder="500"
              />
            </Field>

            <Field label="Starts" htmlFor="coupon-starts" required>
              <Input
                id="coupon-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                required
              />
            </Field>

            <Field label="Expires" htmlFor="coupon-expires" required>
              <Input
                id="coupon-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                required
              />
            </Field>

            <Field label="Total redemptions" htmlFor="coupon-limit" hint="Blank for unlimited.">
              <Input
                id="coupon-limit"
                type="number"
                min={1}
                value={usageLimit}
                onChange={(event) => setUsageLimit(event.target.value)}
                placeholder="1000"
              />
            </Field>

            <Field label="Per customer" htmlFor="coupon-per-user" hint="Blank for unlimited.">
              <Input
                id="coupon-per-user"
                type="number"
                min={1}
                value={perUserLimit}
                onChange={(event) => setPerUserLimit(event.target.value)}
                placeholder="1"
              />
            </Field>

            <Field
              label="Description"
              htmlFor="coupon-description"
              className="sm:col-span-2"
              hint="Shown to customers on the offers page."
              error={error ?? undefined}
            >
              <Textarea
                id="coupon-description"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="20% off your first order"
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary sm:col-span-2">
              <input
                type="checkbox"
                checked={firstOrderOnly}
                onChange={(event) => setFirstOrderOnly(event.target.checked)}
                className="size-4 accent-[var(--brand)]"
              />
              Only on a customer&rsquo;s first order
            </label>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {coupon === null ? "Create coupon" : "Save changes"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
