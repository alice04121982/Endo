import { Shield, Flame, Lock, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Privacy</h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Your health data is deeply personal. Here&apos;s how we protect it.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 card-soft rounded-3xl gradient-card-lavender">
          <CardContent className="pt-6 pb-5 px-6">
            <div className="h-11 w-11 rounded-2xl bg-white/60 flex items-center justify-center mb-4">
              <Lock className="h-5 w-5 text-endo-lavender" />
            </div>
            <h3 className="font-bold text-base">Your data, your rules</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Every piece of health data is encrypted and only accessible by
              you. No one else can see your symptoms, not even us.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 card-soft rounded-3xl gradient-card-sage">
          <CardContent className="pt-6 pb-5 px-6">
            <div className="h-11 w-11 rounded-2xl bg-white/60 flex items-center justify-center mb-4">
              <Eye className="h-5 w-5 text-endo-sage" />
            </div>
            <h3 className="font-bold text-base">Never sold or shared</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              We will never sell your reproductive health data. Your symptom
              history stays between you and whoever you choose to share it with.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Burn to delete */}
      <Card className="border-0 card-soft rounded-3xl bg-white">
        <CardContent className="pt-6 pb-6 px-6">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base">Burn to Delete</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Permanently and irreversibly delete your symptom history for
                any date range. Once burned, the data is gone forever. A secure
                deletion log is kept so you know exactly what was removed.
              </p>
              <Button
                variant="destructive"
                size="sm"
                disabled
                className="mt-4 rounded-xl"
              >
                <Flame className="mr-2 h-3.5 w-3.5" />
                Sign in to enable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ-style section */}
      <Card className="border-0 card-soft rounded-3xl bg-white">
        <CardContent className="pt-6 pb-6 px-6 space-y-4">
          <h3 className="font-bold text-base">Common questions</h3>
          {[
            {
              q: "Can my employer or insurer access my data?",
              a: "No. Your data is encrypted at rest and in transit. Row-level security means only your authenticated session can read your records.",
            },
            {
              q: "What happens if I delete my account?",
              a: "All your data is permanently deleted from our servers. We don't keep backups of individual user data.",
            },
            {
              q: "Can I export my data?",
              a: "Yes. You can generate a full PDF report anytime, or we can provide a JSON export of all your records.",
            },
          ].map((faq) => (
            <div key={faq.q}>
              <p className="text-sm font-semibold">{faq.q}</p>
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
