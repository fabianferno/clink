"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Link2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Header } from "@/components/header";

export default function AttendeesPage() {
  const params = useParams();
  const entityKey = params.id as string;

  return (
    <div className="min-h-screen">
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl px-4 pt-24 pb-16"
      >
        <Link
          href={`/events/${entityKey}`}
          className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to event
        </Link>

        <Card>
          <CardHeader>
            <h1 className="font-malinton text-2xl font-bold">Attendees</h1>
            <p className="text-muted-foreground">
              Connect with people who checked in. Send a &quot;Clink&quot; to stay in touch.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 py-16">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-center text-muted-foreground">
                No checked-in attendees yet.
              </p>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                After the event, checked-in attendees will appear here. You can send them a Clink to connect.
              </p>
              <Button variant="outline" className="gap-2" disabled>
                <Link2 className="h-4 w-4" />
                Clink (coming soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
