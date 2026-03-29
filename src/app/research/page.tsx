import {
  Heart,
  ExternalLink,
  Users,
  BookOpen,
  Sparkles,
  MessageCircle,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SUPPORT_RESOURCES = [
  {
    name: "Endometriosis UK",
    description: "Support groups, helpline, and information across the UK",
    type: "Support",
    color: "gradient-card-lavender",
  },
  {
    name: "Endometriosis Association",
    description: "Education, support, and research advocacy worldwide",
    type: "Community",
    color: "gradient-card-pink",
  },
  {
    name: "Nancy's Nook",
    description: "Evidence-based endometriosis education and excision resources",
    type: "Education",
    color: "gradient-card-sage",
  },
  {
    name: "The Endo Co.",
    description: "Peer support, wellness resources, and empowerment programs",
    type: "Wellness",
    color: "gradient-card-lemon",
  },
];

const EVIDENCE_TOPICS = [
  {
    title: "Why does it hurt?",
    summary: "Endometriosis lesions can grow their own nerve supply and blood vessels, making them uniquely painful. New treatments target these specific pathways.",
    tag: "Pain Science",
    color: "gradient-card-lavender",
  },
  {
    title: "Beyond hormones",
    summary: "Exciting non-hormonal treatments are being studied, including nerve-targeted pain relief and metabolic therapies that could change the game.",
    tag: "New Treatments",
    color: "gradient-card-pink",
  },
  {
    title: "The gut connection",
    summary: "Research shows your gut bacteria may influence endometriosis through estrogen recycling. Dietary changes and probiotics are being studied.",
    tag: "Gut Health",
    color: "gradient-card-sage",
  },
  {
    title: "Fatigue is real",
    summary: "That bone-deep exhaustion isn't in your head. Inflammatory chemicals from endometriosis enter your bloodstream and affect your whole body.",
    tag: "Validation",
    color: "gradient-card-coral",
  },
  {
    title: "Getting diagnosed faster",
    summary: "New biomarker research aims to reduce the 7-10 year average diagnosis time. Blood tests and imaging advances are in clinical trials now.",
    tag: "Diagnosis",
    color: "gradient-card-lemon",
  },
  {
    title: "Your pain matters",
    summary: "Studies show that patients who track and share their symptoms systematically get faster referrals and more targeted treatment plans.",
    tag: "Advocacy",
    color: "gradient-card-lavender",
  },
];

export default function ResearchPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Learn & Connect
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-xl">
          Evidence-based information in plain language, plus communities who
          understand what you&apos;re going through.
        </p>
      </div>

      {/* Support communities */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-endo-lavender" />
          Support Communities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUPPORT_RESOURCES.map((resource) => (
            <Card key={resource.name} className={`border-0 card-soft rounded-3xl ${resource.color}`}>
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{resource.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] rounded-full shrink-0">
                    {resource.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Evidence-based topics */}
      <div>
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-endo-pink" />
          Understanding Endometriosis
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          What the latest research means for you, explained simply.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EVIDENCE_TOPICS.map((topic) => (
            <Card key={topic.title} className={`border-0 card-soft rounded-3xl ${topic.color}`}>
              <CardContent className="pt-5 pb-5 px-5">
                <Badge variant="secondary" className="text-[10px] rounded-full mb-3">
                  {topic.tag}
                </Badge>
                <h3 className="font-bold text-base">{topic.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {topic.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Empowerment CTA */}
      <Card className="border-0 rounded-3xl bg-primary/5 card-soft">
        <CardContent className="pt-6 pb-6 px-6 text-center">
          <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-bold text-base">Knowledge is power</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
            The more you understand about your condition, the better you can
            advocate for the care you deserve. Every symptom you track is a step
            toward answers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
