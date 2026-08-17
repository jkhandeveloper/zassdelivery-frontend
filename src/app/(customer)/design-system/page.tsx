"use client";

import { Filter, Heart, Phone, Search } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Rating } from "@/components/ui/rating";
import { Reveal } from "@/components/ui/reveal";
import {
  CartRowSkeleton,
  ListRowSkeleton,
  RestaurantCardSkeleton,
  StatTileSkeleton,
} from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Badge, StatusPill } from "@/components/ui/status-pill";
import { ApiError } from "@/lib/api-client";

/**
 * A live reference for §2 and §4.
 *
 * Everything the rest of the app is assembled from, on one page, in whichever
 * theme is active — so a regression in the design system is visible here before
 * it is visible across forty screens.
 */
export default function DesignSystemPage() {
  const [quantity, setQuantity] = React.useState(2);

  return (
    <div className="container-zass flex flex-col gap-16 py-14">
      <Reveal trigger="mount">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border-subtle pb-8">
          <div className="flex flex-col gap-2">
            <Badge variant="soft">Phase 1</Badge>
            <h1 className="text-4xl lg:text-5xl">Design system</h1>
            <p className="max-w-xl text-secondary">
              The Zass brand system and every base component, in both themes. Toggle the theme to
              check that each one is designed twice rather than inverted once.
            </p>
          </div>
          <ThemeToggle />
        </header>
      </Reveal>

      <Section title="Palette" description="§2's tokens, plus the semantic surfaces built on them.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {[
            { name: "Primary", className: "bg-zass-primary", hex: "#22D3EE" },
            { name: "Secondary", className: "bg-zass-secondary", hex: "#FF8A3D" },
            { name: "Accent", className: "bg-zass-accent", hex: "#FBBF24" },
            { name: "Violet", className: "bg-zass-violet", hex: "#8B5CF6" },
            { name: "Mist", className: "bg-zass-mist", hex: "#F2F8FB" },
            { name: "Dark", className: "bg-zass-dark", hex: "#0A1622" },
            { name: "Success", className: "bg-zass-success", hex: "#34D399" },
            { name: "Error", className: "bg-zass-error", hex: "#FB7185" },
          ].map((swatch) => (
            <div key={swatch.name} className="flex flex-col gap-2">
              <div
                className={`h-20 rounded-[var(--radius-card)] border border-border-subtle ${swatch.className}`}
              />
              <div className="leading-tight">
                <p className="text-sm font-bold">{swatch.name}</p>
                <p className="numeric text-xs text-muted">{swatch.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-4">
          <h1 className="text-6xl lg:text-7xl">Your cravings, delivered</h1>
          <h2 className="text-4xl">Section heading</h2>
          <h3 className="text-2xl">Card heading</h3>
          <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-secondary">
            Body copy runs at 15–16px with a 1.6 line height, which is what keeps a long menu
            description readable rather than merely present.
          </p>
          <p className="numeric text-2xl font-extrabold">
            Rs 1,450 · Rs 980 · Rs 12,300 — tabular figures, so columns of prices line up.
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="gradient">Gradient</Button>
          <Button variant="neon">Neon</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Favourite">
            <Heart className="size-5" />
          </Button>
          <Button loading>Placing order</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Phone number" required htmlFor="ds-phone" hint="03XXXXXXXXX or +923XXXXXXXXX">
            <Input id="ds-phone" placeholder="0300 1234567" leadingIcon={<Phone className="size-4" />} />
          </Field>
          <Field label="Search" htmlFor="ds-search">
            <Input id="ds-search" type="search" placeholder="Karahi, biryani…" leadingIcon={<Search className="size-4" />} />
          </Field>
          <Field label="Password" htmlFor="ds-pass" error="Password must contain at least one letter and one number">
            <Input id="ds-pass" type="password" defaultValue="password" invalid />
          </Field>
          <Field label="City" htmlFor="ds-city">
            <NativeSelect id="ds-city" defaultValue="">
              <option value="" disabled>
                Choose a city
              </option>
              <option>Peshawar</option>
              <option>Lahore</option>
              <option>Karachi</option>
            </NativeSelect>
          </Field>
          <Field label="Delivery note" htmlFor="ds-note" className="sm:col-span-2">
            <Textarea id="ds-note" placeholder="Ring the bell twice, the gate is open." />
          </Field>
        </div>
      </Section>

      <Section title="Status pills" description="One component and one colour map for every lifecycle in the product.">
        <div className="flex flex-wrap gap-2">
          {[
            "PLACED",
            "PREPARING",
            "ON_THE_WAY",
            "DELIVERED",
            "CANCELLED",
            "PENDING_PAYMENT",
            "PAID",
            "REFUNDED",
            "PENDING_APPROVAL",
            "ACTIVE",
            "SUSPENDED",
            "REJECTED",
            "OUT_OF_STOCK",
            "URGENT",
            "WAITING_ON_CUSTOMER",
          ].map((status) => (
            <StatusPill key={status} status={status} withDot />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="solid">30% off</Badge>
          <Badge variant="soft">Free delivery</Badge>
          <Badge variant="gold">Popular</Badge>
          <Badge variant="warm">Street food</Badge>
          <Badge variant="violet">Late night</Badge>
          <Badge variant="outline">Halal</Badge>
          <Badge variant="dark">New</Badge>
        </div>
      </Section>

      <Section title="Rating & quantity">
        <div className="flex flex-wrap items-center gap-8">
          <Rating value={4.6} count={128} />
          <Rating value={3.2} size="lg" />
          <Rating value={4.8} count={54} compact />
          <QuantitySelector value={quantity} onChange={setQuantity} itemLabel="Chicken karahi" />
          <QuantitySelector
            value={1}
            onChange={() => {}}
            removeAtMin
            onRemove={() => toast("Removed from cart")}
            itemLabel="Mutton biryani"
          />
        </div>
      </Section>

      <Section title="Overlays & feedback">
        <div className="flex flex-wrap items-center gap-3">
          <Modal>
            <ModalTrigger asChild>
              <Button variant="outline">Open modal</Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Customise your order</ModalTitle>
              </ModalHeader>
              <ModalBody>
                <p className="text-secondary">
                  Variants and add-on groups render here in Phase 3, enforcing each group&apos;s
                  minSelect and maxSelect before the submit button unlocks.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost">Cancel</Button>
                <Button>Add to cart</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">
                <Filter className="size-4" />
                Open drawer
              </Button>
            </DrawerTrigger>
            <DrawerContent title="Filters" description="The same panel backs cart, filters and notifications.">
              <div className="p-5 text-secondary">Filter controls land with the listing page.</div>
              <DrawerFooter>
                <Button block>Apply</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <Button variant="outline" onClick={() => toast.success("Added to your cart")}>
            Success toast
          </Button>
          <Button variant="outline" onClick={() => toast.error("That restaurant is closed right now")}>
            Error toast
          </Button>
        </div>
      </Section>

      <Section title="Loading skeletons" description="§10: skeletons only — never a spinner, never the string “Loading…”.">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RestaurantCardSkeleton />
          <div className="flex flex-col gap-3">
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
          <div className="flex flex-col gap-3">
            <StatTileSkeleton />
            <CartRowSkeleton />
          </div>
        </div>
      </Section>

      <Section title="Empty & error states">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <EmptyState
              density="inline"
              title="Your cart is hungry"
              description="Nothing in here yet. Find something worth the wait."
              action={<Button size="sm">Browse restaurants</Button>}
            />
          </Card>
          <Card>
            <ErrorState
              density="inline"
              error={
                new ApiError({
                  message: "We couldn't reach ZassDelivery.",
                  status: 0,
                  code: "NETWORK_ERROR",
                })
              }
              onRetry={() => toast("Retrying…")}
            />
          </Card>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["Interactive", "Static", "Interactive"].map((label, index) => (
            <Card key={index} interactive={label === "Interactive"}>
              <CardHeader>
                <CardTitle>{label} card</CardTitle>
                <CardDescription>
                  Hover an interactive card to see the 4px lift and deeper warm shadow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Rating value={4.4} count={92} compact />
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl">{title}</h2>
          {description !== undefined && <p className="text-secondary">{description}</p>}
        </div>
        <div className="flex flex-col gap-5">{children}</div>
      </section>
    </Reveal>
  );
}
