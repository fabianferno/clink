import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { WhyClink } from "@/components/why-clink";
import { HowItWorks } from "@/components/how-it-works";
import { ForOrganizersAttendees } from "@/components/for-organizers-attendees";
import { EventsFeed } from "@/components/events-feed";
import { PoweredByArkiv } from "@/components/powered-by-arkiv";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <WhyClink />
      <HowItWorks />
      <ForOrganizersAttendees />
      <EventsFeed />
      <PoweredByArkiv />
    </main>
  );
}
