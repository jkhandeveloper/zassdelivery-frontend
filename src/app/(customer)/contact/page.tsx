import {
  Bike,
  Building2,
  Clock,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Store,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/status-pill";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = {
  title: "Contact us",
  description: "Every way to reach the ZassDelivery team — support, partnerships and press.",
};

/**
 * The public handles, in one place because they are rendered verbatim in
 * several spots on this page.
 *
 * The numbers and inboxes are deliberately unmistakable placeholders rather
 * than plausible-looking ones: a fake-but-believable support line is the kind
 * of thing that ships. Replace them with the live details before launch.
 */
const CHANNELS = {
  whatsapp: { display: "+92 300 000 0000", href: "https://wa.me/920000000000" },
  phone: { display: "+92 300 000 0000", href: "tel:+920000000000" },
  supportEmail: "support@example.invalid",
  partnersEmail: "partners@example.invalid",
  pressEmail: "press@example.invalid",
  hours: "Every day, 9:00 – 23:00 PKT",
  office: "Lahore, Pakistan",
} as const;

/** Where a given kind of question is actually answered. */
const ROUTES: readonly {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: string;
}[] = [
  {
    icon: <Package className="size-5" />,
    title: "Something's wrong with a live order",
    description:
      "Open the order to see where it is, what the kitchen has done so far, and the rider's number once one is assigned. Cancelling is on the same screen while the restaurant has not started cooking.",
    href: "/orders",
    cta: "Track your order",
    tone: "bg-brand-soft text-brand",
  },
  {
    icon: <LifeBuoy className="size-5" />,
    title: "A refund, a charge, or your account",
    description:
      "Raise a ticket and the thread stays on your account, so whoever picks it up can already see the order it belongs to. You get a reply in the same place.",
    href: "/support",
    cta: "Open a ticket",
    tone: "bg-accent-violet-soft text-accent-violet",
  },
  {
    icon: <Store className="size-5" />,
    title: "You run a restaurant or shop",
    description:
      "Tell us about the kitchen and our onboarding team takes it from there — menu, hours, payouts and the tablet that receives your orders.",
    href: "/vendor/onboarding",
    cta: "Add your restaurant",
    tone: "bg-accent-warm-soft text-accent-warm",
  },
  {
    icon: <Bike className="size-5" />,
    title: "You want to ride with Zass",
    description:
      "Sign up with your bike and licence details, and we'll get you through vetting and onto the road in your own zone.",
    href: "/rider/onboarding",
    cta: "Become a rider",
    tone: "bg-success-soft text-success",
  },
];

/** Answered elsewhere, and better — no point retyping a policy here. */
const POLICY_LINKS: readonly { href: string; label: string; hint: string }[] = [
  { href: "/refunds", label: "Refund policy", hint: "When money comes back, and how long it takes" },
  { href: "/terms", label: "Terms of service", hint: "The rules the service runs on" },
  { href: "/privacy", label: "Privacy policy", hint: "What we store, and what we never sell" },
  { href: "/careers", label: "Careers", hint: "Open roles across ops, engineering and support" },
];

function ChannelCard({
  icon,
  label,
  value,
  href,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  note?: string;
}) {
  return (
    <RevealItem>
      <Card className="flex h-full flex-col gap-3 p-5 sm:p-6">
        <span
          aria-hidden
          className="grid size-10 place-items-center rounded-xl bg-surface-muted text-secondary"
        >
          {icon}
        </span>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-secondary">{label}</p>
          {href === undefined ? (
            <p className="font-display text-base font-extrabold text-primary">{value}</p>
          ) : (
            <a
              href={href}
              className="font-display text-base font-extrabold text-primary transition-colors hover:text-brand"
            >
              {value}
            </a>
          )}
          {note !== undefined && <p className="text-sm text-muted">{note}</p>}
        </div>
      </Card>
    </RevealItem>
  );
}

export default function Page() {
  return (
    <div className="container-zass py-8 lg:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <div className="flex flex-col gap-14 lg:gap-20">
        <Reveal trigger="mount" className="mt-4 flex flex-col gap-3">
          <Badge variant="soft" className="w-fit">
            <Clock aria-hidden className="mr-1.5 inline size-3.5" />
            {CHANNELS.hours}
          </Badge>
          <h1 className="max-w-3xl text-3xl sm:text-4xl">Contact us</h1>
          <p className="max-w-2xl text-[1.0625rem] leading-relaxed text-secondary">
            Most things are settled fastest from inside your account, where we can already see the
            order you&apos;re asking about. If it doesn&apos;t fit any of those, the direct channels below
            reach the same team.
          </p>
        </Reveal>

        <section className="flex flex-col gap-6">
          <SectionHeader
            title="Start here"
            description="Pick the one that matches your question — each goes straight to the people who handle it."
          />

          <RevealGroup className="grid gap-5 md:grid-cols-2">
            {ROUTES.map((route) => (
              <RevealItem key={route.href} className="h-full">
                <Card className="flex h-full flex-col gap-4 p-6">
                  <span
                    aria-hidden
                    className={`grid size-11 place-items-center rounded-xl ${route.tone}`}
                  >
                    {route.icon}
                  </span>

                  <h3 className="font-display text-lg font-extrabold text-primary">
                    {route.title}
                  </h3>
                  <p className="text-[0.9375rem] leading-relaxed text-secondary">
                    {route.description}
                  </p>

                  <Button variant="outline" size="sm" className="mt-auto self-start" asChild>
                    <Link href={route.href}>{route.cta}</Link>
                  </Button>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader
            title="Reach us directly"
            description="Same team, slower queue — a ticket carries your order with it, a message doesn't."
          />

          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ChannelCard
              icon={<MessageCircle className="size-5" />}
              label="WhatsApp"
              value={CHANNELS.whatsapp.display}
              href={CHANNELS.whatsapp.href}
              note="Fastest for a quick question"
            />
            <ChannelCard
              icon={<Phone className="size-5" />}
              label="Phone"
              value={CHANNELS.phone.display}
              href={CHANNELS.phone.href}
              note={CHANNELS.hours}
            />
            <ChannelCard
              icon={<Mail className="size-5" />}
              label="Email"
              value={CHANNELS.supportEmail}
              href={`mailto:${CHANNELS.supportEmail}`}
              note="Attach a screenshot and your order number"
            />
            <ChannelCard
              icon={<MapPin className="size-5" />}
              label="Office"
              value={CHANNELS.office}
              note="By appointment only"
            />
          </RevealGroup>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader
            title="Business, press and partnerships"
            description="Not a support question? These reach the right desk first time."
          />

          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            <RevealItem>
              <Card className="flex h-full flex-col gap-3 p-6">
                <span
                  aria-hidden
                  className="grid size-11 place-items-center rounded-xl bg-accent-warm-soft text-accent-warm"
                >
                  <Building2 className="size-5" />
                </span>
                <h3 className="font-display text-lg font-extrabold text-primary">Partnerships</h3>
                <p className="text-[0.9375rem] leading-relaxed text-secondary">
                  Chains, franchises, corporate accounts and zone-level deals — anything bigger than
                  a single storefront signing up.
                </p>
                <a
                  href={`mailto:${CHANNELS.partnersEmail}`}
                  className="mt-auto font-display font-extrabold text-brand hover:text-brand-hover"
                >
                  {CHANNELS.partnersEmail}
                </a>
              </Card>
            </RevealItem>

            <RevealItem>
              <Card className="flex h-full flex-col gap-3 p-6">
                <span
                  aria-hidden
                  className="grid size-11 place-items-center rounded-xl bg-accent-violet-soft text-accent-violet"
                >
                  <Mail className="size-5" />
                </span>
                <h3 className="font-display text-lg font-extrabold text-primary">Press</h3>
                <p className="text-[0.9375rem] leading-relaxed text-secondary">
                  Interviews, data requests and brand assets. Tell us your deadline in the first
                  line and we&apos;ll work to it.
                </p>
                <a
                  href={`mailto:${CHANNELS.pressEmail}`}
                  className="mt-auto font-display font-extrabold text-brand hover:text-brand-hover"
                >
                  {CHANNELS.pressEmail}
                </a>
              </Card>
            </RevealItem>
          </RevealGroup>
        </section>

        <section className="flex flex-col gap-6 pb-4">
          <SectionHeader
            title="Answered already"
            description="Worth a look before you write — these cover most of what people ask."
          />

          <ul className="grid gap-3 sm:grid-cols-2">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex flex-col gap-0.5 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-brand-soft/30"
                >
                  <span className="font-display text-[0.9375rem] font-extrabold text-primary">
                    {link.label}
                  </span>
                  <span className="text-sm text-secondary">{link.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
