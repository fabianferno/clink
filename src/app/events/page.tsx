import { Header } from "@/components/header";
import { EventsFeed } from "@/components/events-feed";

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-black overflow-hidden flex flex-col">
      <Header />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-28 pb-16 relative z-10">
        <EventsFeed />
      </div>
    </main>
  );
}
