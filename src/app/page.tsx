"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * MVP: Clinician-only tool — redirect to CDSS dashboard.
 * In a future phase, this will become a role-based landing
 * (clinician → /cdss, patient → /patient-portal).
 */
export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/cdss");
  }, [router]);
  return null;
}
