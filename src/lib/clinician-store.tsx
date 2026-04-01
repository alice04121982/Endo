"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ClinicianRole =
  | "consultant_gynaecologist"
  | "registrar"
  | "sho"
  | "clinical_nurse_specialist"
  | "gp"
  | "other";

export const ROLE_LABELS: Record<ClinicianRole, string> = {
  consultant_gynaecologist: "Consultant Gynaecologist",
  registrar:                "Registrar",
  sho:                      "Senior House Officer (SHO)",
  clinical_nurse_specialist:"Clinical Nurse Specialist",
  gp:                       "GP / Primary Care",
  other:                    "Other",
};

export interface Clinician {
  id: string;
  name: string;
  role: ClinicianRole;
  hospital: string;
  created_at: string;
}

interface ClinicianContextValue {
  clinicians: Clinician[];
  activeClinician: Clinician | null;
  addClinician: (data: Omit<Clinician, "id" | "created_at">) => Clinician;
  switchClinician: (id: string) => void;
  removeClinician: (id: string) => void;
}

const ClinicianContext = createContext<ClinicianContextValue | null>(null);

const CLINICIANS_KEY = "cdss_clinicians";
const ACTIVE_CLINICIAN_KEY = "cdss_active_clinician";

function loadJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function saveJson<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* storage full */ }
}

export function ClinicianProvider({ children }: { children: ReactNode }) {
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadJson<Clinician>(CLINICIANS_KEY);
    const storedActive = localStorage.getItem(ACTIVE_CLINICIAN_KEY);
    setClinicians(stored);
    if (storedActive && stored.find((c) => c.id === storedActive)) {
      setActiveId(storedActive);
    } else if (stored.length > 0) {
      setActiveId(stored[0].id);
      localStorage.setItem(ACTIVE_CLINICIAN_KEY, stored[0].id);
    }
    setHydrated(true);
  }, []);

  const activeClinician = clinicians.find((c) => c.id === activeId) ?? null;

  const addClinician = useCallback(
    (data: Omit<Clinician, "id" | "created_at">): Clinician => {
      const clinician: Clinician = {
        ...data,
        id: `cl-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setClinicians((prev) => {
        const next = [...prev, clinician];
        saveJson(CLINICIANS_KEY, next);
        return next;
      });
      setActiveId(clinician.id);
      localStorage.setItem(ACTIVE_CLINICIAN_KEY, clinician.id);
      return clinician;
    },
    []
  );

  const switchClinician = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_CLINICIAN_KEY, id);
  }, []);

  const removeClinician = useCallback((id: string) => {
    setClinicians((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveJson(CLINICIANS_KEY, next);
      return next;
    });
    setActiveId((prev) => {
      if (prev !== id) return prev;
      const remaining = clinicians.filter((c) => c.id !== id);
      const next = remaining[0]?.id ?? null;
      if (next) localStorage.setItem(ACTIVE_CLINICIAN_KEY, next);
      else localStorage.removeItem(ACTIVE_CLINICIAN_KEY);
      return next;
    });
  }, [clinicians]);

  // Don't render children until hydrated to avoid mismatch
  if (!hydrated) return null;

  return (
    <ClinicianContext.Provider
      value={{ clinicians, activeClinician, addClinician, switchClinician, removeClinician }}
    >
      {children}
    </ClinicianContext.Provider>
  );
}

export function useClinician() {
  const ctx = useContext(ClinicianContext);
  if (!ctx) throw new Error("useClinician must be used inside ClinicianProvider");
  return ctx;
}
