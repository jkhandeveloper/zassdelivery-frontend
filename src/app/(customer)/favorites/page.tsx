import { PhasePlaceholder } from "@/components/layout/phase-placeholder";

export const metadata = { title: "Favourites" };

export default function Page() {
  return (
    <div className="container-zass py-10">
      <PhasePlaceholder
        phase="Coming soon"
        title="Favourites"
        description="The restaurants and dishes you have saved."
        endpoints={[
          "GET /me/favorites",
          "DELETE /me/favorites/restaurants/:id",
        ]}
      />
    </div>
  );
}
