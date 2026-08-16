import { Card } from "@/components/ui/card";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/status-pill";

/**
 * Marks a route that exists so its shell can be reviewed, but whose content
 * belongs to a later phase.
 *
 * Deliberately says so rather than showing plausible-looking sample data —
 * §0's rule against inventing values applies to placeholder screens too, where
 * a fake chart is most likely to be mistaken for a working one.
 */
export function PhasePlaceholder({
  phase,
  title,
  description,
  endpoints,
}: {
  phase: string;
  title: string;
  description: string;
  /** The API routes this screen will be built on, once it is built. */
  endpoints?: readonly string[];
}) {
  return (
    <RevealGroup trigger="mount" className="flex flex-col gap-6">
      <RevealItem className="flex flex-col gap-2">
        <Badge variant="soft" className="w-fit">
          {phase}
        </Badge>
        <h1 className="text-3xl">{title}</h1>
        <p className="max-w-2xl text-secondary">{description}</p>
      </RevealItem>

      {endpoints !== undefined && endpoints.length > 0 && (
        <RevealItem>
          <Card className="max-w-2xl border-dashed bg-surface-muted shadow-none">
            <div className="p-6">
              <p className="pb-3 text-sm font-bold">Endpoints this screen will use</p>
              <ul className="flex flex-col gap-1.5">
                {endpoints.map((endpoint) => (
                  <li key={endpoint} className="numeric text-sm text-secondary">
                    <code className="text-brand">{endpoint}</code>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </RevealItem>
      )}
    </RevealGroup>
  );
}
