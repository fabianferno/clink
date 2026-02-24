"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Copy, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";

function generateCheckinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CheckinPage() {
  const params = useParams();
  const [code, setCode] = useState("");
  const [attendeeCode, setAttendeeCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"organizer" | "attendee">("organizer");

  const entityKey = params.id as string;

  useEffect(() => {
    setCode(generateCheckinCode());
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        <div className="mb-8 flex gap-2">
          <Button
            variant={mode === "organizer" ? "default" : "outline"}
            onClick={() => setMode("organizer")}
          >
            Organizer
          </Button>
          <Button
            variant={mode === "attendee" ? "default" : "outline"}
            onClick={() => setMode("attendee")}
          >
            Attendee
          </Button>
        </div>

        {mode === "organizer" ? (
          <Card>
            <CardHeader>
              <h1 className="font-malinton text-2xl font-bold">Check-in code</h1>
              <p className="text-muted-foreground">
                Share this code with attendees. They enter it to check in.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center gap-4 rounded-xl bg-muted/50 p-8">
                <QrCode className="h-16 w-16 text-muted-foreground" />
                <span className="font-mono text-4xl font-bold tracking-widest">{code}</span>
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={copyCode}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h1 className="font-malinton text-2xl font-bold">Enter check-in code</h1>
              <p className="text-muted-foreground">
                Enter the 6-character code from the organizer to check in.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                placeholder="e.g. ABC123"
                value={attendeeCode}
                onChange={(e) => setAttendeeCode(e.target.value.toUpperCase().slice(0, 6))}
                className="text-center font-mono text-2xl tracking-widest"
                maxLength={6}
              />
              <Button className="w-full" disabled={attendeeCode.length !== 6}>
                Check in
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                TODO: Verify code and update RSVP entity via Arkiv
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
