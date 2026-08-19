"use client";

import { Pause, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSetAcceptingOrders } from "@/hooks/use-vendor";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { RestaurantAdminDto } from "@/types/restaurant";

/**
 * The kitchen's own on/off switch.
 *
 * Distinct from opening hours and from approval: a restaurant can be approved
 * and inside its hours and still stop taking orders because the kitchen is
 * swamped. `canOrderNow` is the API's read on all three together, so it is what
 * the status line reports rather than this flag alone.
 */
export function AcceptingOrdersToggle({ restaurant }: { restaurant: RestaurantAdminDto }) {
  const setAccepting = useSetAcceptingOrders(restaurant.id);
  const accepting = restaurant.isAcceptingOrders;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        variant={accepting ? "outline" : "success"}
        loading={setAccepting.isPending}
        onClick={() =>
          setAccepting.mutate(!accepting, {
            onSuccess: () =>
              toast.success(accepting ? "Paused new orders" : "Taking orders again"),
            onError: (error) =>
              toast.error(
                error instanceof ApiError ? error.message : "We couldn't change that.",
              ),
          })
        }
      >
        {accepting ? <Pause className="size-4" /> : <Play className="size-4" />}
        {accepting ? "Pause orders" : "Start taking orders"}
      </Button>

      <p className="flex items-center gap-1.5 text-xs text-muted">
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            restaurant.canOrderNow ? "bg-success" : "bg-muted",
          )}
        />
        {restaurant.canOrderNow
          ? "Open and taking orders"
          : !accepting
            ? "Paused by you"
            : restaurant.isOpenNow
              ? "Not taking orders"
              : restaurant.opensInMinutes === null
                ? "Closed"
                : `Closed · opens in ${restaurant.opensInMinutes} min`}
      </p>
    </div>
  );
}
