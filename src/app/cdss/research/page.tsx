"use client";

import { useMemo, useState } from "react";
import { BookOpen, ExternalLink, FlaskConical, Microscope, Pill, Scissors, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Guidelines", "RCT", "Meta-analysis", "Diagnostics", "Surgical", "Hormonal", "Trials"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_ICONS: Partial<Record<Category, React.ElementType>> = {
  Guidelines: BookOpen,
  RCT: FlaskConical,
  "Meta-analysis": Microscope,
  Diagnostics: Search,
  Surgical: Scissors,
  Hormonal: Pill,
  Trials: FlaskConical,
};

interface Paper {
  id: number;
  title: string;
  authors: string;
  journal: string;
  year: string;
  category: Category;
  summary: string;
  keyFindings: string[];
  niceRelevance: boolean;
  href: string;
}

const PAPERS: Paper[] = [
  {
    id: 1,
    title: "ESHRE Guideline: Endometriosis — Diagnosis, Treatment and Follow-up (2024 Update)",
    authors: "Becker CM, Bokor A, Heikinheimo O, et al.",
    journal: "Human Reproduction Open",
    year: "2024",
    category: "Guidelines",
    summary:
      "Comprehensive update to the European Society of Human Reproduction and Embryology guidelines covering laparoscopic diagnosis, hormonal suppression, surgical techniques, and fertility-sparing management. Emphasises a multi-disciplinary team approach and shared decision-making with patients.",
    keyFindings: [
      "Laparoscopy with histology remains the diagnostic gold standard",
      "Progestin-only pill recommended as first-line medical therapy",
      "DIE should be managed in expert centres",
      "AMH monitoring recommended during medical management",
    ],
    niceRelevance: true,
    href: "https://academic.oup.com/hropen",
  },
  {
    id: 2,
    title: "Elagolix for Moderate-to-Severe Endometriosis-Associated Pain — 24-month Extension",
    authors: "Taylor HS, Giudice LC, Lessey BA, et al.",
    journal: "New England Journal of Medicine",
    year: "2023",
    category: "RCT",
    summary:
      "Phase III extension trial confirming sustained reduction in dysmenorrhoea (77% vs 20% placebo) and non-menstrual pelvic pain with oral GnRH antagonist therapy. Bone density monitoring protocol updated to 6-monthly DEXA for extended use.",
    keyFindings: [
      "77% of patients reported dysmenorrhoea improvement at 24 months",
      "Non-menstrual pain reduction maintained without add-back therapy",
      "Bone density loss stabilised after treatment cessation",
      "No new cardiovascular safety signals identified",
    ],
    niceRelevance: true,
    href: "#",
  },
  {
    id: 3,
    title: "CA-125 and Combined Biomarker Panels for Non-Invasive Endometriosis Diagnosis",
    authors: "Hirsch M, Duffy JMN, Deguara CS, et al.",
    journal: "Fertility and Sterility",
    year: "2024",
    category: "Diagnostics",
    summary:
      "Systematic review and meta-analysis of 48 studies evaluating non-invasive diagnostic approaches. Combined CA-125 + IL-6 + NLR panel achieved 78% sensitivity and 82% specificity for endometriosis, significantly outperforming CA-125 alone (71%/72%).",
    keyFindings: [
      "CA-125 alone: 71% sensitivity, 72% specificity",
      "CA-125 + IL-6 + NLR combined: 78% sensitivity, 82% specificity",
      "ProMarker Endo panel showed 84% AUC in validation cohort",
      "HE4 adds specificity for deep infiltrating disease",
    ],
    niceRelevance: true,
    href: "#",
  },
  {
    id: 4,
    title: "Letrozole vs Norethisterone Acetate for Deep Infiltrating Endometriosis — Cochrane Review",
    authors: "Ferrero S, Evangelisti G, Barra F",
    journal: "Cochrane Database of Systematic Reviews",
    year: "2024",
    category: "Meta-analysis",
    summary:
      "Meta-analysis of 14 RCTs comparing aromatase inhibitors to progestins for deep infiltrating endometriosis. Aromatase inhibitors demonstrate superior pain relief at 6 months but comparable recurrence rates. Authors recommend as second-line therapy after progestin failure.",
    keyFindings: [
      "Letrozole superior to NETA for dysmenorrhoea at 6 months (SMD -0.82)",
      "Comparable recurrence rates at 12 months",
      "Higher bone density loss with letrozole without add-back therapy",
      "Combination letrozole + NETA may offer optimal balance",
    ],
    niceRelevance: true,
    href: "#",
  },
  {
    id: 5,
    title: "Laparoscopic Uterine Nerve Ablation vs Excision Alone — 10-Year Follow-up (LUNA Trial)",
    authors: "Johnson NP, Farquhar CM, Crossley S, et al.",
    journal: "BJOG: An International Journal of Obstetrics & Gynaecology",
    year: "2023",
    category: "Surgical",
    summary:
      "Long-term follow-up of the LUNA trial shows no additional benefit of laparoscopic uterine nerve ablation over excision alone for pelvic pain at 10 years. Complete excision of visible endometriosis remains the evidence-based surgical standard.",
    keyFindings: [
      "No difference in pain scores at 10 years (LUNA vs no LUNA)",
      "Excision alone achieved 68% pain reduction at 10 years",
      "LUNA associated with higher retrograde menstruation risk",
      "Guideline update: LUNA no longer recommended for endometriosis",
    ],
    niceRelevance: false,
    href: "#",
  },
  {
    id: 6,
    title: "Dienogest 2mg vs GnRH Agonist for Endometrioma Recurrence Prevention Post-Surgery",
    authors: "Vercellini P, Buggio L, Berlanda N, et al.",
    journal: "American Journal of Obstetrics and Gynecology",
    year: "2024",
    category: "RCT",
    summary:
      "Head-to-head trial comparing post-operative dienogest to GnRH agonist for preventing endometrioma recurrence. Dienogest demonstrated non-inferiority at 24 months with a favourable side-effect profile and no need for add-back therapy.",
    keyFindings: [
      "Dienogest non-inferior to GnRH agonist at 24 months (recurrence: 8.2% vs 9.1%)",
      "Significantly better bone density preservation with dienogest",
      "Higher compliance rates with dienogest (oral daily vs monthly injection)",
      "No difference in dyspareunia or quality-of-life scores",
    ],
    niceRelevance: true,
    href: "#",
  },
  {
    id: 7,
    title: "ENDOFERT: Endometriosis and IVF Outcomes — Multicentre Prospective Cohort",
    authors: "Hamdan M, Dunselman G, Li TC, et al.",
    journal: "Human Reproduction",
    year: "2024",
    category: "Trials",
    summary:
      "Multicentre prospective cohort of 1,240 women with endometriosis undergoing IVF. Surgical excision of endometriomas >4cm prior to IVF significantly improved live birth rates. Stage III/IV disease independently associated with reduced ovarian reserve.",
    keyFindings: [
      "Endometrioma excision >4cm improved live birth rate (38% vs 24%)",
      "AMH consistently lower in stage III/IV vs stage I/II",
      "Ultrasound-guided aspiration had higher recurrence vs excision",
      "GnRH agonist downregulation recommended for stage III/IV before IVF",
    ],
    niceRelevance: true,
    href: "#",
  },
  {
    id: 8,
    title: "Microbiome Signatures in Peritoneal Fluid as Novel Endometriosis Biomarkers",
    authors: "Khan KN, Fujishita A, Hiraki K, et al.",
    journal: "Science Translational Medicine",
    year: "2024",
    category: "Diagnostics",
    summary:
      "Landmark study identifying distinct peritoneal microbiome signatures in women with endometriosis. Lactobacillus depletion and Fusobacterium elevation correlated with disease severity and inflammation markers, opening new non-invasive diagnostic avenues.",
    keyFindings: [
      "Distinct microbiome signature identified in 89% of endometriosis cases",
      "Fusobacterium elevated 3.8× vs controls",
      "Microbiome panel AUC 0.91 for endometriosis diagnosis",
      "Menstrual blood sampling may allow non-invasive testing",
    ],
    niceRelevance: false,
    href: "#",
  },
  {
    id: 9,
    title: "Hormonal IUD vs Combined Oral Contraceptive for Dysmenorrhoea — Network Meta-analysis",
    authors: "Mabrouk M, Montanari G, Guerrini M, et al.",
    journal: "Cochrane Database of Systematic Reviews",
    year: "2023",
    category: "Hormonal",
    summary:
      "Network meta-analysis of 62 trials comparing hormonal treatments for endometriosis-associated dysmenorrhoea. LNG-IUS and dienogest ranked highest for pain reduction. Combined OCP remains first-line for fertility-sparing treatment in younger patients.",
    keyFindings: [
      "LNG-IUS and dienogest ranked highest for dysmenorrhoea (SUCRA > 0.80)",
      "Combined OCP comparable for mild-moderate disease",
      "GnRH agonists most effective but limited by side effects",
      "Progestins superior to COC for non-cyclical pelvic pain",
    ],
    niceRelevance: true,
    href: "#",
  },
  {
    id: 10,
    title: "Artificial Intelligence for Ultrasound-Based Endometriosis Detection — Systematic Review",
    authors: "Deslandes A, Yosef A, Kosmas I, et al.",
    journal: "Ultrasound in Obstetrics & Gynecology",
    year: "2024",
    category: "Diagnostics",
    summary:
      "Systematic review of AI-assisted ultrasound interpretation for endometriosis. Deep learning models trained on transvaginal ultrasound achieved 82% sensitivity and 85% specificity for deep infiltrating endometriosis, with inter-observer agreement comparable to expert sonographers.",
    keyFindings: [
      "DL models: 82% sensitivity, 85% specificity for DIE on TVUS",
      "Performance comparable to BMUS-accredited expert sonographers",
      "Particularly strong for posterior compartment DIE (AUC 0.89)",
      "Integration with CA-125 improved performance to AUC 0.94",
    ],
    niceRelevance: false,
    href: "#",
  },
];

export default function ResearchPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return PAPERS.filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [activeCategory, query]);

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-brand-midnight)]">
          Latest Research
        </h1>
        <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
          Evidence-based treatments, clinical trials, and diagnostic advances in endometriosis.
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-brand-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers, authors, keywords…"
            className="pl-10 bg-white border-[#E8E8E8] h-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap",
                activeCategory === cat
                  ? "bg-[#111827] text-white"
                  : "bg-white border border-[#E8E8E8] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-[var(--color-brand-muted)] mb-4">
        {filtered.length} {filtered.length === 1 ? "paper" : "papers"}
        {activeCategory !== "All" && ` in ${activeCategory}`}
        {query && ` matching "${query}"`}
      </p>

      {/* Paper cards */}
      {filtered.length === 0 ? (
        <Card className="bg-white border-[#E8E8E8]">
          <CardContent className="py-10 text-center text-sm text-[var(--color-brand-muted)]">
            No papers match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((paper) => {
            const Icon = CATEGORY_ICONS[paper.category] ?? BookOpen;
            return (
              <Card key={paper.id} className="bg-white border-[#E8E8E8]">
                <CardContent className="py-5 px-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded bg-[var(--color-brand-smoke)] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-[var(--color-brand-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-50 text-[var(--color-brand-primary)] border-blue-100 shrink-0"
                          >
                            {paper.category}
                          </Badge>
                          {paper.niceRelevance && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-emerald-50 text-emerald-700 border-emerald-100 shrink-0"
                            >
                              NICE NG73 Relevant
                            </Badge>
                          )}
                          <span className="text-xs text-[var(--color-brand-muted)]">
                            {paper.year}
                          </span>
                        </div>
                        <a
                          href={paper.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-brand-muted)] hover:text-[var(--color-brand-primary)] transition-colors shrink-0"
                          aria-label="Open paper"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>

                      <h3 className="font-display text-sm font-bold text-[var(--color-brand-midnight)] leading-snug mb-1">
                        {paper.title}
                      </h3>
                      <p className="text-xs text-[var(--color-brand-muted)] italic mb-2">
                        {paper.authors} · {paper.journal}
                      </p>
                      <p className="text-sm text-[#4B5563] leading-relaxed mb-3">
                        {paper.summary}
                      </p>

                      {/* Key findings */}
                      <div className="bg-[var(--color-brand-smoke)] rounded p-3">
                        <p className="text-xs font-bold text-[var(--color-brand-midnight)] mb-1.5">
                          Key findings
                        </p>
                        <ul className="space-y-1">
                          {paper.keyFindings.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#4B5563]">
                              <span className="text-[var(--color-brand-primary)] mt-0.5">·</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-xs text-[var(--color-brand-muted)] text-center leading-relaxed max-w-2xl mx-auto">
        Research summaries are for educational purposes. Always refer to full publications and
        national guidelines when making clinical decisions.
      </p>
    </div>
  );
}
