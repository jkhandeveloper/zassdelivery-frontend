"use client";

import { Save, Settings as SettingsIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel, PortalHeader } from "@/components/layout/portal-page";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { ApiError } from "@/lib/api-client";
import { useAdminSettings, useUpsertSettings } from "@/hooks/use-admin";
import { formatDateTime, hasText } from "@/lib/utils";
import { SettingValueType } from "@/types/enums";
import type { SettingDto } from "@/types/admin";

/**
 * Fees, delivery rules and the values the platform runs on.
 *
 * Every group is one form, saved together: `PUT /settings` is all-or-nothing on
 * the backend because related settings are meaningless apart — a quiet-hours
 * start applied without its end is a window nobody configured — so the screen
 * mirrors that rather than offering a save button per row.
 *
 * A field's input type follows `valueType` (number, checkbox, textarea for
 * JSON) so the operator cannot type "five" into a NUMBER the pricing engine
 * will read literally.
 */
export function AdminSettingsView() {
  const settings = useAdminSettings();
  const upsert = useUpsertSettings();

  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  const groups = settings.data ?? [];

  function draftValue(setting: SettingDto): string {
    return drafts[setting.key] ?? setting.value;
  }

  function setDraft(key: string, value: string) {
    setDrafts((current) => ({ ...current, [key]: value }));
  }

  function isDirty(group: (typeof groups)[number]): boolean {
    return group.settings.some((setting) => draftValue(setting) !== setting.value);
  }

  async function saveGroup(group: (typeof groups)[number]) {
    setError(null);

    const changed = group.settings.filter((setting) => draftValue(setting) !== setting.value);

    if (changed.length === 0) {
      return;
    }

    try {
      await upsert.mutateAsync({
        settings: changed.map((setting) => ({
          key: setting.key,
          value: draftValue(setting),
          valueType: setting.valueType,
          group: setting.group,
          description: setting.description ?? undefined,
          isPublic: setting.isPublic,
        })),
      });

      setDrafts((current) => {
        const next = { ...current };
        for (const setting of changed) {
          delete next[setting.key];
        }
        return next;
      });

      toast.success(
        `${group.group} saved — ${changed.length} ${changed.length === 1 ? "value" : "values"} updated.`,
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That did not go through.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PortalHeader
        title="Platform settings"
        description="Fees, delivery rules and the values the platform runs on."
      />

      {settings.isPending ? (
        <Panel bodyClassName="p-5 sm:p-6">
          <ListSkeleton count={4} label="Loading settings" />
        </Panel>
      ) : settings.isError ? (
        <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />
      ) : groups.length === 0 ? (
        <Panel bodyClassName="p-0">
          <EmptyState
            density="inline"
            icon={<SettingsIcon className="size-6" />}
            title="No settings configured"
          />
        </Panel>
      ) : (
        groups.map((group) => (
          <Panel
            key={group.group}
            title={humaniseGroup(group.group)}
            action={
              <Button
                size="sm"
                loading={upsert.isPending}
                disabled={!isDirty(group)}
                onClick={() => void saveGroup(group)}
              >
                <Save className="size-4" />
                Save
              </Button>
            }
          >
            {error !== null && (
              <p className="mb-4 text-sm font-medium text-danger">{error}</p>
            )}

            <div className="flex flex-col gap-4">
              {group.settings.map((setting) => (
                <SettingField
                  key={setting.key}
                  setting={setting}
                  value={draftValue(setting)}
                  onChange={(value) => setDraft(setting.key, value)}
                />
              ))}
            </div>
          </Panel>
        ))
      )}
    </div>
  );
}

function humaniseGroup(group: string): string {
  const words = group.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: SettingDto;
  value: string;
  onChange: (value: string) => void;
}) {
  const hint = [
    setting.description,
    setting.isPublic ? "Visible to customer apps." : "Internal only.",
    hasText(setting.updatedAt) ? `Updated ${formatDateTime(setting.updatedAt)}.` : undefined,
  ]
    .filter(hasText)
    .join(" ");

  if (setting.valueType === SettingValueType.BOOLEAN) {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-border-subtle p-4">
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(event) => onChange(event.target.checked ? "true" : "false")}
          className="mt-0.5 size-4 accent-[var(--brand)]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="numeric text-sm font-semibold text-primary">{setting.key}</span>
          <span className="text-xs text-muted">{hint}</span>
        </span>
      </label>
    );
  }

  return (
    <Field label={setting.key} htmlFor={`setting-${setting.key}`} hint={hint}>
      <Input
        id={`setting-${setting.key}`}
        type={setting.valueType === SettingValueType.NUMBER ? "number" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="numeric"
      />
    </Field>
  );
}
