import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

/** §10's app-level 404. */
export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6">
      <EmptyState
        icon={<span className="text-3xl">🧭</span>}
        title="This page has moved on"
        description="The link you followed doesn't lead anywhere. It may have been removed, or the address may be a little off."
        action={
          <Button asChild>
            <Link href="/">Back to ZassDelivery</Link>
          </Button>
        }
      />
    </div>
  );
}
