import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Menu" };

export default function Page() {
  return (
    <PhasePlaceholder
      phase="Coming soon"
      title="Menu"
      description="Menus, categories, items, variants, add-ons and stock."
      endpoints={[
        "GET /menu-management/restaurants/:id/items",
        "POST /menu-management/items",
        "POST /menu-management/items/:id/stock",
      ]}
    />
  );
}
