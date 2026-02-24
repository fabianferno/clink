import { Header } from "@/components/header";
import { EventsFeed } from "@/components/events-feed";

export default function EventsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-24">
        <EventsFeed />
      </div>
    </main>
  );
}
