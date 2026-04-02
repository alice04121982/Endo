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
  | "physiotherapist"
  | "psychologist"
  | "other";

export const ROLE_LABELS: Record<ClinicianRole, string> = {
  consultant_gynaecologist:  "Consultant Gynaecologist",
  registrar:                 "Registrar",
  sho:                       "Senior House Officer (SHO)",
  clinical_nurse_specialist: "Clinical Nurse Specialist",
  gp:                        "GP / Primary Care",
  physiotherapist:           "Pelvic Health Physiotherapist",
  psychologist:              "Clinical Psychologist",
  other:                     "Other",
};

export interface Clinician {
  id: string;
  name: string;
  role: ClinicianRole;
  hospital: string;
  is_admin: boolean;
  created_at: string;
}

// Invite tokens — in a real system these would be server-side JWTs.
// For the demo, a token is a 6-character alphanumeric code stored locally.
export interface InviteToken {
  code: string;
  created_by: string; // clinician id
  created_at: string;
  used: boolean;
}

interface ClinicianContextValue {
  clinicians: Clinician[];
  activeClinician: Clinician | null;
  isAdmin: boolean;
  invites: InviteToken[];
  addClinician: (data: Omit<Clinician, "id" | "created_at">) => Clinician;
  switchClinician: (id: string) => void;
  removeClinician: (id: string) => void;
  updateClinician: (id: string, updates: Partial<Pick<Clinician, "name" | "role" | "hospital" | "is_admin">>) => void;
  generateInvite: () => InviteToken;
  validateInvite: (code: string) => boolean;
  consumeInvite: (code: string) => void;
}

const ClinicianContext = createContext<ClinicianContextValue | null>(null);

const CLINICIANS_KEY = "cdss_clinicians";
const ACTIVE_CLINICIAN_KEY = "cdss_active_clinician";
const INVITES_KEY = "cdss_invites";

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

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function ClinicianProvider({ children }: { children: ReactNode }) {
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteToken[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadJson<Clinician>(CLINICIANS_KEY);
    const storedActive = localStorage.getItem(ACTIVE_CLINICIAN_KEY);
    const storedInvites = loadJson<InviteToken>(INVITES_KEY);
    setClinicians(stored);
    setInvites(storedInvites);
    if (storedActive && stored.find((c) => c.id === storedActive)) {
      setActiveId(storedActive);
    } else if (stored.length > 0) {
      setActiveId(stored[0].id);
      localStorage.setItem(ACTIVE_CLINICIAN_KEY, stored[0].id);
    }
    setHydrated(true);
  }, []);

  const activeClinician = clinicians.find((c) => c.id === activeId) ?? null;
  const isAdmin = activeClinician?.is_admin ?? false;

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

  const updateClinician = useCallback(
    (id: string, updates: Partial<Pick<Clinician, "name" | "role" | "hospital" | "is_admin">>) => {
      setClinicians((prev) => {
        const next = prev.map((c) => c.id === id ? { ...c, ...updates } : c);
        saveJson(CLINICIANS_KEY, next);
        return next;
      });
    },
    []
  );

  const generateInvite = useCallback((): InviteToken => {
    const token: InviteToken = {
      code: generateCode(),
      created_by: activeId ?? "",
      created_at: new Date().toISOString(),
      used: false,
    };
    setInvites((prev) => {
      const next = [...prev, token];
      saveJson(INVITES_KEY, next);
      return next;
    });
    return token;
  }, [activeId]);

  const validateInvite = useCallback(
    (code: string): boolean => {
      return invites.some((t) => t.code === code.toUpperCase() && !t.used);
    },
    [invites]
  );

  const consumeInvite = useCallback((code: string) => {
    setInvites((prev) => {
      const next = prev.map((t) =>
        t.code === code.toUpperCase() ? { ...t, used: true } : t
      );
      saveJson(INVITES_KEY, next);
      return next;
    });
  }, []);

  if (!hydrated) return null;

  return (
    <ClinicianContext.Provider
      value={{
        clinicians,
        activeClinician,
        isAdmin,
        invites,
        addClinician,
        switchClinician,
        removeClinician,
        updateClinician,
        generateInvite,
        validateInvite,
        consumeInvite,
      }}
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
