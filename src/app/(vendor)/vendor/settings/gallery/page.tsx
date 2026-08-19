"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Images, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Media } from "@/components/ui/media";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { VendorGate } from "@/components/vendor/vendor-gate";
import { useRestaurantImages } from "@/hooks/use-restaurants";
import { useAddImage, useDeleteImage, useReorderImages } from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { hasText } from "@/lib/utils";

export default function VendorGalleryPage() {
  return (
    <VendorGate allowUnapproved>
      {(restaurant) => <Gallery restaurantId={restaurant.id} />}
    </VendorGate>
  );
}

function Gallery({ restaurantId }: { restaurantId: string }) {
  const images = useRestaurantImages(restaurantId);
  const add = useAddImage(restaurantId);
  const remove = useDeleteImage(restaurantId);
  const reorder = useReorderImages(restaurantId);

  const [url, setUrl] = React.useState("");
  const [caption, setCaption] = React.useState("");

  const list = images.data ?? [];

  const move = (index: number, direction: -1 | 1) => {
    const next = [...list];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];

    reorder.mutate(
      { imageIds: next.map((image) => image.id) },
      {
        onError: (error) =>
          toast.error(
            error instanceof ApiError ? error.message : "We couldn't reorder the gallery.",
          ),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Gallery"
        description="Photos on your storefront. The first one is what customers see at the top."
      />

      <Panel
        title="Add a photo"
        description="Paste the address of an image you've already uploaded somewhere."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!hasText(url)) return;

            add.mutate(
              {
                url: url.trim(),
                ...(caption.trim() !== "" && { caption: caption.trim() }),
              },
              {
                onSuccess: () => {
                  toast.success("Photo added");
                  setUrl("");
                  setCaption("");
                },
                onError: (error) =>
                  toast.error(
                    error instanceof ApiError ? error.message : "We couldn't add that photo.",
                  ),
              },
            );
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Image address" htmlFor="gallery-url" required>
              <Input
                id="gallery-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://…/dining-room.jpg"
                required
              />
            </Field>
            <Field label="Caption" htmlFor="gallery-caption" hint="Optional.">
              <Input
                id="gallery-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="The grill at dinner service"
              />
            </Field>
          </div>

          <Button type="submit" className="self-start" loading={add.isPending} disabled={!hasText(url)}>
            <ImagePlus className="size-4" />
            Add photo
          </Button>
        </form>
      </Panel>

      <Panel title="Your photos" description="First in the list is the cover.">
        {images.isPending ? (
          <SkeletonRegion
            label="Loading gallery"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="aspect-[4/3] rounded-[var(--radius-card)]" />
            ))}
          </SkeletonRegion>
        ) : images.isError ? (
          <ErrorState density="inline" error={images.error} onRetry={() => void images.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            density="inline"
            icon={<Images className="size-6" />}
            title="No photos yet"
            description="Listings with photos get noticeably more orders. Add a few of your food and your dining room."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((image, index) => (
              <li
                key={image.id}
                className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-muted"
              >
                <span className="relative block aspect-[4/3] overflow-hidden">
                  <Media src={image.url} alt={image.caption ?? ""} variant="food" />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-brand-contrast">
                      Cover
                    </span>
                  )}
                </span>

                <div className="flex items-center justify-between gap-2 p-3">
                  <span className="min-w-0 flex-1 truncate text-sm text-secondary">
                    {hasText(image.caption) ? image.caption : "No caption"}
                  </span>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Move earlier"
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Move later"
                      disabled={index === list.length - 1 || reorder.isPending}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Remove photo"
                      className="text-danger"
                      loading={remove.isPending}
                      onClick={() =>
                        remove.mutate(image.id, {
                          onSuccess: () => toast.success("Photo removed"),
                          onError: (error) =>
                            toast.error(
                              error instanceof ApiError
                                ? error.message
                                : "We couldn't remove that photo.",
                            ),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
