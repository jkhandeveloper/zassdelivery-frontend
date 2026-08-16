"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

/**
 * Entrance motion for content, built on the same curve as the button lift and
 * the overlay springs (§2) so a page settling into place feels like one system
 * rather than a bolt-on. Everything here collapses to a plain <div> under
 * prefers-reduced-motion — the content is never gated behind an animation.
 */

// Matches --ease-out-soft in globals.css.
const EASE = [0.22, 1, 0.36, 1] as const;
const DISTANCE = 16;

type Trigger = "mount" | "in-view";

/** Shared child variant, so a group and a lone element rise by the same amount. */
const itemVariants = {
  hidden: { opacity: 0, y: DISTANCE },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** A single element that fades and rises into place. */
export function Reveal({
  trigger = "in-view",
  delay = 0,
  y = DISTANCE,
  ...props
}: HTMLMotionProps<"div"> & { trigger?: Trigger; delay?: number; y?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <motion.div {...props} />;

  const from = { opacity: 0, y };
  const to = { opacity: 1, y: 0 };
  const transition = { duration: 0.55, ease: EASE, delay };

  return trigger === "mount" ? (
    <motion.div initial={from} animate={to} transition={transition} {...props} />
  ) : (
    <motion.div
      initial={from}
      whileInView={to}
      viewport={{ once: true, amount: 0.2 }}
      transition={transition}
      {...props}
    />
  );
}

/**
 * A container whose <RevealItem> children arrive one after another. The stagger
 * is what turns four separate fades into a single considered entrance.
 */
export function RevealGroup({
  trigger = "in-view",
  stagger = 0.09,
  delayChildren = 0,
  ...props
}: HTMLMotionProps<"div"> & {
  trigger?: Trigger;
  stagger?: number;
  delayChildren?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <motion.div {...props} />;

  const controls =
    trigger === "mount"
      ? { initial: "hidden" as const, animate: "show" as const }
      : {
          initial: "hidden" as const,
          whileInView: "show" as const,
          viewport: { once: true, amount: 0.2 },
        };

  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren } } }}
      {...controls}
      {...props}
    />
  );
}

/** One child of a <RevealGroup>; inherits the group's trigger and stagger. */
export function RevealItem(props: HTMLMotionProps<"div">) {
  const reduced = useReducedMotion();
  if (reduced) return <motion.div {...props} />;
  return <motion.div variants={itemVariants} {...props} />;
}
