import Image from "next/image";
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
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=640&q=80&auto=format&fit=crop",
  },
  {
    title: "Beyond hormones",
    summary: "Exciting non-hormonal treatments are being studied, including nerve-targeted pain relief and metabolic therapies that could change the game.",
    tag: "New Treatments",
    color: "gradient-card-pink",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=640&q=80&auto=format&fit=crop",
  },
  {
    title: "The gut connection",
    summary: "Research shows your gut bacteria may influence endometriosis through estrogen recycling. Dietary changes and probiotics are being studied.",
    tag: "Gut Health",
    color: "gradient-card-sage",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=640&q=80&auto=format&fit=crop",
  },
  {
    title: "Fatigue is real",
    summary: "That bone-deep exhaustion isn't in your head. Inflammatory chemicals from endometriosis enter your bloodstream and affect your whole body.",
    tag: "Validation",
    color: "gradient-card-coral",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=640&q=80&auto=format&fit=crop",
  },
  {
    title: "Getting diagnosed faster",
    summary: "New biomarker research aims to reduce the 7-10 year average diagnosis time. Blood tests and imaging advances are in clinical trials now.",
    tag: "Diagnosis",
    color: "gradient-card-lemon",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=640&q=80&auto=format&fit=crop",
  },
  {
    title: "Your pain matters",
    summary: "Studies show that patients who track and share their symptoms systematically get faster referrals and more targeted treatment plans.",
    tag: "Advocacy",
    color: "gradient-card-lavender",
    image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=640&q=80&auto=format&fit=crop",
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
              <CardContent className="pt-5 pb-4 px-6">
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
            <Card key={topic.title} className={`border-0 card-soft rounded-[24px] ${topic.color} overflow-hidden flex flex-col`}>
              <CardContent className="pt-5 pb-4 px-5 flex-1">
                <Badge variant="secondary" className="text-[10px] rounded-full mb-3">
                  {topic.tag}
                </Badge>
                <h3 className="font-bold text-base">{topic.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {topic.summary}
                </p>
              </CardContent>
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={topic.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Anatomy illustration */}
        <div className="rounded-[24px] bg-[var(--color-brand-midnight)] p-6 lg:p-10 card-soft overflow-hidden">
          <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-brand-blue-light)] mb-2">
                Anatomy
              </p>
              <h2 className="font-display text-2xl font-bold text-white mb-3">
                Where endometriosis grows
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Endometriosis tissue grows outside the uterus — on ovaries, fallopian tubes, pelvic walls, and ligaments. These lesions <span className="text-[var(--color-brand-lavender)] font-semibold">(shown in pink)</span> respond to your menstrual cycle, causing inflammation, scarring, and chronic pain.
              </p>
              <div className="mt-5 flex flex-wrap gap-4 text-xs text-white/60">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-[var(--color-brand-lavender)]" /> Endometriosis lesion</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-[#FDE3F7]" /> Ovarian endometrioma</span>
              </div>
            </div>
            <div className="mt-8 lg:mt-0 flex items-center justify-center">
              <svg viewBox="0 0 300 230" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm">
                {/* Uterus body */}
                <path d="M112 72 C102 72 92 80 90 94 L88 122 C88 144 112 162 150 162 C188 162 212 144 212 122 L210 94 C208 80 198 72 188 72 Z" fill="#1a4d7a" stroke="#4791FF" strokeWidth="1.5"/>
                {/* Uterine cavity */}
                <path d="M130 85 L150 78 L170 85 L166 132 L150 144 L134 132 Z" fill="#0E3D68" stroke="#4791FF" strokeWidth="0.75" opacity="0.8"/>
                {/* Cervix */}
                <rect x="136" y="162" width="28" height="22" rx="6" fill="#1a4d7a" stroke="#4791FF" strokeWidth="1.5"/>
                <circle cx="150" cy="173" r="3" fill="#0E3D68" stroke="#4791FF" strokeWidth="1"/>
                {/* Left fallopian tube */}
                <path d="M112 80 C96 77 78 72 60 80 C48 86 40 98 36 114" stroke="#4791FF" strokeWidth="2" strokeLinecap="round"/>
                {/* Left fimbriae */}
                <path d="M36 114 C32 119 30 124 29 130" stroke="#4791FF" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M36 114 C34 120 34 126 36 131" stroke="#4791FF" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M36 114 C40 119 42 124 40 130" stroke="#4791FF" strokeWidth="1.5" strokeLinecap="round"/>
                {/* Right fallopian tube */}
                <path d="M188 80 C204 77 222 72 240 80 C252 86 260 98 264 114" stroke="#4791FF" strokeWidth="2" strokeLinecap="round"/>
                {/* Right fimbriae */}
                <path d="M264 114 C268 119 270 124 271 130" stroke="#4791FF" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M264 114 C266 120 266 126 264 131" stroke="#4791FF" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M264 114 C260 119 258 124 260 130" stroke="#4791FF" strokeWidth="1.5" strokeLinecap="round"/>
                {/* Left ovary */}
                <ellipse cx="32" cy="144" rx="20" ry="15" fill="#1a4d7a" stroke="#4791FF" strokeWidth="1.5"/>
                {/* Right ovary */}
                <ellipse cx="268" cy="144" rx="20" ry="15" fill="#1a4d7a" stroke="#4791FF" strokeWidth="1.5"/>
                {/* Uterosacral ligaments */}
                <path d="M120 155 C104 165 88 168 74 166" stroke="#4791FF" strokeWidth="1" strokeDasharray="4 3" strokeLinecap="round" opacity="0.5"/>
                <path d="M180 155 C196 165 212 168 226 166" stroke="#4791FF" strokeWidth="1" strokeDasharray="4 3" strokeLinecap="round" opacity="0.5"/>
                {/* === ENDOMETRIOSIS LESIONS === */}
                {/* On left ovary - endometrioma */}
                <circle cx="22" cy="138" r="6" fill="#FBBFEC" stroke="#FF6833" strokeWidth="1.5"/>
                <circle cx="40" cy="150" r="4" fill="#FBBFEC" opacity="0.85"/>
                {/* On right ovary */}
                <circle cx="278" cy="138" r="5" fill="#FBBFEC" stroke="#FF6833" strokeWidth="1.5"/>
                <circle cx="260" cy="150" r="3.5" fill="#FBBFEC" opacity="0.85"/>
                {/* On posterior uterus wall */}
                <circle cx="87" cy="114" r="4" fill="#FBBFEC" opacity="0.9"/>
                <circle cx="213" cy="120" r="3.5" fill="#FBBFEC" opacity="0.85"/>
                {/* On uterosacral ligaments */}
                <circle cx="100" cy="163" r="3" fill="#FBBFEC" opacity="0.8"/>
                <circle cx="200" cy="164" r="2.5" fill="#FBBFEC" opacity="0.8"/>
                {/* On pelvic peritoneum */}
                <circle cx="68" cy="160" r="2.5" fill="#FBBFEC" opacity="0.65"/>
                <circle cx="232" cy="157" r="2" fill="#FBBFEC" opacity="0.65"/>
              </svg>
            </div>
          </div>
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
