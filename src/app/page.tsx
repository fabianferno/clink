import { Header } from "@/components/header";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Header />
      <Hero />
    </main>
  );
}
