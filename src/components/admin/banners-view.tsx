"use client";

import { GripVertical, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  CellStack,
  DataTable,
  Pagination,
  RowActions,
  type Column,
} from "@/components/admin/data-table";
import { FilterBar, humaniseEnum, SelectFilter } from "@/components/admin/filter-bar";
import { ConfirmDialog } from "@/components/admin/reason-dialog";
import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
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
  useAdminBanners,
  useCreateBanner,
  useDeleteBanner,
  useReorderBanners,
  useUpdateBanner,
} from "@/hooks/use-admin";
import { useValueChanged } from "@/hooks/use-value-changed";
import { ApiError } from "@/lib/api-client";
import { formatDate, hasText } from "@/lib/utils";
import { BannerPlacement } from "@/types/enums";
import type { BannerDto } from "@/types/admin";

/**
 * Promotional banners.
 *
 * Sort order is edited by dragging within a placement — the API's
 * `banner-management/order` call takes the whole ordered set for that
 * placement at once, so a drag reorders locally and posts the result, rather
 * than editing a sortOrder number by hand.
 */
export function AdminBannersView() {
  const [placement, setPlacement] = React.useState<BannerPlacement | "">("");
  const [page, setPage] = React.useState(1);

  if (useValueChanged(placement) && page !== 1) {
    setPage(1);
  }

  const banners = useAdminBanners({
    page,
    limit: 50,
    placement: placement === "" ? undefined : placement,
    sortBy: "sortOrder",
    sortOrder: "asc",
  });

  const reorder = useReorderBanners();
  const deleteBanner = useDeleteBanner();

  const [editing, setEditing] = React.useState<BannerDto | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<BannerDto | null>(null);
  const [dragId, setDragId] = React.useState<string | null>(null);

  const items = banners.data?.items ?? [];
  const canReorder = placement !== "";

  function handleDrop(targetId: string) {
    if (dragId === null || dragId === targetId || !canReorder) {
      setDragId(null);
      return;
    }

    const ordered = [...items];
    const fromIndex = ordered.findIndex((banner) => banner.id === dragId);
    const toIndex = ordered.findIndex((banner) => banner.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDragId(null);
      return;
    }

    const [moved] = ordered.splice(fromIndex, 1);
    if (moved !== undefined) {
      ordered.splice(toIndex, 0, moved);
    }

    setDragId(null);

    reorder
      .mutateAsync({
        banners: ordered.map((banner, index) => ({ id: banner.id, sortOrder: index })),
      })
      .then(() => toast.success("Order saved."))
      .catch(() => toast.error("Could not save the new order."));
  }

  const columns: readonly Column<BannerDto>[] = [
    {
      key: "drag",
      header: <span className="sr-only">Reorder</span>,
      width: "1%",
      cell: (row) =>
        canReorder ? (
          <div
            draggable
            onDragStart={() => setDragId(row.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(row.id)}
            className="cursor-grab touch-none text-muted active:cursor-grabbing"
            aria-label={`Drag to reorder ${row.title}`}
          >
            <GripVertical className="size-4" />
          </div>
        ) : null,
    },
    {
      key: "banner",
      header: "Banner",
      cell: (row) => (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.imageUrl}
            alt=""
            className="h-11 w-16 shrink-0 rounded-lg border border-border-subtle object-cover"
          />
          <CellStack
            primary={row.title}
            secondary={hasText(row.subtitle) ? row.subtitle : undefined}
          />
        </div>
      ),
    },
    {
      key: "placement",
      header: "Placement",
      hideBelow: "md",
      cell: (row) => <span className="text-secondary">{humaniseEnum(row.placement)}</span>,
    },
    {
      key: "window",
      header: "Runs",
      hideBelow: "lg",
      cell: (row) => (
        <span className="numeric text-xs text-secondary">
          {row.startsAt === null ? "Always" : formatDate(row.startsAt)}
          {row.endsAt !== null && ` → ${formatDate(row.endsAt)}`}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isLive ? "soft" : "outline"} size="sm">
          {row.isLive ? "Live" : row.isActive ? "Not in window" : "Off"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      width: "1%",
      cell: (row) => (
        <RowActions>
          <Button size="sm" variant="ghost" onClick={() => setEditing(row)}>
            <Pencil className="size-4" />
            <span className="sr-only">Edit {row.title}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>
            <Trash2 className="size-4 text-danger" />
            <span className="sr-only">Delete {row.title}</span>
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Banners"
        description="Promotional banners and where they appear."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New banner
          </Button>
        }
      />

      <Panel bodyClassName="p-0">
        <div className="border-b border-border-subtle p-5 sm:p-6">
          <FilterBar onClear={placement === "" ? undefined : () => setPlacement("")}>
            <SelectFilter
              label="Placement"
              value={placement}
              onChange={setPlacement}
              allLabel="Any placement"
              options={Object.values(BannerPlacement).map((value) => ({
                value,
                label: humaniseEnum(value),
              }))}
            />
            {!canReorder && (
              <span className="text-xs text-muted">
                Pick one placement to drag banners into order.
              </span>
            )}
          </FilterBar>
        </div>

        <DataTable
          caption="Promotional banners, grouped by placement"
          columns={columns}
          rows={items}
          rowKey={(row) => row.id}
          isPending={banners.isPending}
          isError={banners.isError}
          error={banners.error}
          onRetry={() => void banners.refetch()}
          empty={{
            icon: <ImageIcon className="size-6" />,
            title: placement === "" ? "No banners yet" : "No banners in this placement",
          }}
          footer={<Pagination meta={banners.data?.meta} onPageChange={setPage} />}
        />
      </Panel>

      <BannerForm
        open={creating || editing !== null}
        banner={editing}
        defaultPlacement={placement === "" ? BannerPlacement.HOME_TOP : placement}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.title ?? ""}?`}
        description="It comes off the storefront immediately and cannot be recovered."
        confirmLabel="Delete banner"
        variant="danger"
        pending={deleteBanner.isPending}
        successMessage="Banner deleted."
        onConfirm={() => deleteBanner.mutateAsync(deleting?.id ?? "")}
      />
    </div>
  );
}

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

function BannerForm({
  open,
  banner,
  defaultPlacement,
  onClose,
}: {
  open: boolean;
  banner: BannerDto | null;
  defaultPlacement: BannerPlacement;
  onClose: () => void;
}) {
  const create = useCreateBanner();
  const update = useUpdateBanner();

  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [placement, setPlacement] = React.useState<BannerPlacement>(defaultPlacement);
  const [linkUrl, setLinkUrl] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  if (useValueChanged(open) && open) {
    setTitle(banner?.title ?? "");
    setSubtitle(banner?.subtitle ?? "");
    setImageUrl(banner?.imageUrl ?? "");
    setPlacement(banner?.placement ?? defaultPlacement);
    setLinkUrl(banner?.linkUrl ?? "");
    setStartsAt(toLocalInput(banner?.startsAt ?? null));
    setEndsAt(toLocalInput(banner?.endsAt ?? null));
    setIsActive(banner?.isActive ?? true);
    setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      title: title.trim(),
      subtitle: hasText(subtitle) ? subtitle.trim() : undefined,
      imageUrl: imageUrl.trim(),
      placement,
      linkUrl: hasText(linkUrl) ? linkUrl.trim() : undefined,
      startsAt: startsAt === "" ? undefined : new Date(startsAt).toISOString(),
      endsAt: endsAt === "" ? undefined : new Date(endsAt).toISOString(),
      isActive,
    };

    try {
      if (banner === null) {
        await create.mutateAsync(payload);
        toast.success("Banner created.");
      } else {
        await update.mutateAsync({ id: banner.id, data: payload });
        toast.success("Banner updated.");
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
            <ModalTitle>{banner === null ? "New banner" : `Edit ${banner.title}`}</ModalTitle>
            <ModalDescription>
              {imageUrl === "" ? "Paste an absolute image URL." : null}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {hasText(imageUrl) && (
              <div className="sm:col-span-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt=""
                  className="h-32 w-full rounded-[var(--radius-card)] border border-border-subtle object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <Field label="Title" htmlFor="banner-title" required className="sm:col-span-2">
              <Input
                id="banner-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Free delivery this weekend"
                required
              />
            </Field>

            <Field label="Subtitle" htmlFor="banner-subtitle" className="sm:col-span-2">
              <Input
                id="banner-subtitle"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                placeholder="On every order over Rs. 500"
              />
            </Field>

            <Field
              label="Image URL"
              htmlFor="banner-image"
              required
              className="sm:col-span-2"
              error={error ?? undefined}
            >
              <Input
                id="banner-image"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://cdn.zassdelivery.pk/banners/weekend.jpg"
                required
              />
            </Field>

            <Field label="Placement" htmlFor="banner-placement" required>
              <NativeSelect
                id="banner-placement"
                value={placement}
                onChange={(event) => setPlacement(event.target.value as BannerPlacement)}
              >
                {Object.values(BannerPlacement).map((value) => (
                  <option key={value} value={value}>
                    {humaniseEnum(value)}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Links to" htmlFor="banner-link" hint="Optional.">
              <Input
                id="banner-link"
                type="url"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://zassdelivery.pk/offers"
              />
            </Field>

            <Field label="Starts" htmlFor="banner-starts" hint="Blank for immediately.">
              <Input
                id="banner-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </Field>

            <Field label="Ends" htmlFor="banner-ends" hint="Blank for indefinitely.">
              <Input
                id="banner-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary sm:col-span-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="size-4 accent-[var(--brand)]"
              />
              Active
            </label>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {banner === null ? "Create banner" : "Save changes"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
