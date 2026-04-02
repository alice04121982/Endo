"use client";

/**
 * CDSS data store — React Context backed by localStorage.
 * Manages patient clinical histories and biomarker values.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  BiomarkerSource,
  BiomarkerValue,
  BiomarkerType,
  LabNotification,
  PatientHistory,
  RiskStratification,
  SymptomLog,
} from "@/lib/types/cdss";
import { BIOMARKER_META } from "@/lib/types/cdss";
import { assessRisk, flagBiomarker } from "@/lib/engine/risk-engine";
import { DEMO_PATIENTS, DEMO_BIOMARKERS, DEMO_SYMPTOM_LOGS } from "@/lib/demo-seed";

const PATIENTS_KEY = "cdss_patients";
const BIOMARKERS_KEY = "cdss_biomarkers";
const SYMPTOM_LOGS_KEY = "cdss_symptom_logs";
const NOTIFICATIONS_KEY = "cdss_notifications";

interface CdssContextValue {
  patients: PatientHistory[];
  currentPatient: PatientHistory | null;
  setCurrentPatientId: (id: string | null) => void;
  addPatient: (patient: Omit<PatientHistory, "id" | "created_at">) => PatientHistory;
  updatePatient: (id: string, updates: Partial<PatientHistory>) => void;
  removePatient: (id: string) => void;
  biomarkers: BiomarkerValue[];
  addBiomarker: (
    patientId: string,
    marker: BiomarkerType,
    value: number,
    dateCollected: string,
    provenance?: { source?: BiomarkerSource; ordered_by?: string; cycle_day?: number | null }
  ) => BiomarkerValue;
  removeBiomarker: (id: string) => void;
  getPatientBiomarkers: (patientId: string) => BiomarkerValue[];
  getRiskAssessment: (patientId: string) => RiskStratification | null;
  symptomLogs: SymptomLog[];
  addSymptomLog: (patientId: string, log: Omit<SymptomLog, "id" | "patient_id" | "logged_at"> & { logged_at?: string }) => SymptomLog;
  getPatientSymptomLogs: (patientId: string) => SymptomLog[];
  notifications: LabNotification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const CdssContext = createContext<CdssContextValue | null>(null);

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
  } catch {
    /* storage full */
  }
}

function seedDemoNotifications(
  demoPatients: PatientHistory[],
  demoBiomarkers: BiomarkerValue[]
): LabNotification[] {
  // Pick the 10 most recent concerning results across all patients
  const concerning = demoBiomarkers
    .filter((b) => b.flag !== "normal")
    .sort((a, b) => b.date_collected.localeCompare(a.date_collected))
    .slice(0, 10);

  return concerning.map((b) => {
    const patient = demoPatients.find((p) => p.id === b.patient_id);
    const meta = BIOMARKER_META[b.marker];
    return {
      id: `demo-notif-${b.id}`,
      patient_id: b.patient_id,
      patient_name: patient?.name ?? "Unknown",
      marker: b.marker,
      marker_label: meta.label,
      value: b.value,
      unit: meta.unit,
      flag: b.flag as LabNotification["flag"],
      date_collected: b.date_collected,
      read: false,
      created_at: b.date_collected + "T09:00:00.000Z",
    } satisfies LabNotification;
  });
}

export function CdssProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<PatientHistory[]>([]);
  const [biomarkers, setBiomarkers] = useState<BiomarkerValue[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [notifications, setNotifications] = useState<LabNotification[]>([]);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);

  useEffect(() => {
    const patients = loadJson<PatientHistory>(PATIENTS_KEY);
    const biomarkers = loadJson<BiomarkerValue>(BIOMARKERS_KEY);
    const symptomLogs = loadJson<SymptomLog>(SYMPTOM_LOGS_KEY);
    const notifications = loadJson<LabNotification>(NOTIFICATIONS_KEY);

    // Seed demo data on first launch
    if (patients.length === 0) {
      saveJson(PATIENTS_KEY, DEMO_PATIENTS);
      saveJson(BIOMARKERS_KEY, DEMO_BIOMARKERS);
      saveJson(SYMPTOM_LOGS_KEY, DEMO_SYMPTOM_LOGS);
      setPatients(DEMO_PATIENTS);
      setBiomarkers(DEMO_BIOMARKERS);
      setSymptomLogs(DEMO_SYMPTOM_LOGS);

      // Seed notifications from recent concerning demo results
      const demoNotifications = seedDemoNotifications(DEMO_PATIENTS, DEMO_BIOMARKERS);
      saveJson(NOTIFICATIONS_KEY, demoNotifications);
      setNotifications(demoNotifications);
    } else {
      setPatients(patients);
      setBiomarkers(biomarkers);
      setSymptomLogs(symptomLogs);

      // Backfill notifications for existing installs
      if (notifications.length === 0) {
        const demoNotifications = seedDemoNotifications(patients, biomarkers);
        saveJson(NOTIFICATIONS_KEY, demoNotifications);
        setNotifications(demoNotifications);
      } else {
        setNotifications(notifications);
      }
    }
  }, []);

  const currentPatient = useMemo(
    () => patients.find((p) => p.id === currentPatientId) ?? null,
    [patients, currentPatientId]
  );

  const addPatient = useCallback(
    (data: Omit<PatientHistory, "id" | "created_at">): PatientHistory => {
      const patient: PatientHistory = {
        ...data,
        id: `pt-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setPatients((prev) => {
        const next = [patient, ...prev];
        saveJson(PATIENTS_KEY, next);
        return next;
      });
      setCurrentPatientId(patient.id);
      return patient;
    },
    []
  );

  const updatePatient = useCallback(
    (id: string, updates: Partial<PatientHistory>) => {
      setPatients((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
        saveJson(PATIENTS_KEY, next);
        return next;
      });
    },
    []
  );

  const removePatient = useCallback((id: string) => {
    setPatients((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveJson(PATIENTS_KEY, next);
      return next;
    });
    setBiomarkers((prev) => {
      const next = prev.filter((b) => b.patient_id !== id);
      saveJson(BIOMARKERS_KEY, next);
      return next;
    });
  }, []);

  const addBiomarker = useCallback(
    (
      patientId: string,
      marker: BiomarkerType,
      value: number,
      dateCollected: string,
      provenance?: { source?: BiomarkerSource; ordered_by?: string; cycle_day?: number | null }
    ): BiomarkerValue => {
      const meta = BIOMARKER_META[marker];
      const flag = flagBiomarker(marker, value, meta);
      const entry: BiomarkerValue = {
        id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        patient_id: patientId,
        marker,
        value,
        date_collected: dateCollected,
        flag,
        ...(provenance ?? {}),
      };
      setBiomarkers((prev) => {
        const next = [entry, ...prev];
        saveJson(BIOMARKERS_KEY, next);
        return next;
      });

      // Fire notification for any non-normal result
      if (flag !== "normal") {
        setPatients((prevPatients) => {
          const patient = prevPatients.find((p) => p.id === patientId);
          if (!patient) return prevPatients;
          const notification: LabNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            patient_id: patientId,
            patient_name: patient.name,
            marker,
            marker_label: meta.label,
            value,
            unit: meta.unit,
            flag: flag as LabNotification["flag"],
            date_collected: dateCollected,
            read: false,
            created_at: new Date().toISOString(),
          };
          setNotifications((prev) => {
            const next = [notification, ...prev];
            saveJson(NOTIFICATIONS_KEY, next);
            return next;
          });
          return prevPatients;
        });
      }

      return entry;
    },
    []
  );

  const removeBiomarker = useCallback((id: string) => {
    setBiomarkers((prev) => {
      const next = prev.filter((b) => b.id !== id);
      saveJson(BIOMARKERS_KEY, next);
      return next;
    });
  }, []);

  const getPatientBiomarkers = useCallback(
    (patientId: string) => biomarkers.filter((b) => b.patient_id === patientId),
    [biomarkers]
  );

  const addSymptomLog = useCallback(
    (patientId: string, log: Omit<SymptomLog, "id" | "patient_id" | "logged_at"> & { logged_at?: string }): SymptomLog => {
      const entry: SymptomLog = {
        ...log,
        id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        patient_id: patientId,
        logged_at: log.logged_at ?? new Date().toISOString(),
      };
      setSymptomLogs((prev) => {
        const next = [entry, ...prev];
        saveJson(SYMPTOM_LOGS_KEY, next);
        return next;
      });
      return entry;
    },
    []
  );

  const getPatientSymptomLogs = useCallback(
    (patientId: string) => symptomLogs.filter((s) => s.patient_id === patientId),
    [symptomLogs]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveJson(NOTIFICATIONS_KEY, next);
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveJson(NOTIFICATIONS_KEY, next);
      return next;
    });
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const getRiskAssessment = useCallback(
    (patientId: string): RiskStratification | null => {
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) return null;
      const patientBiomarkers = biomarkers.filter((b) => b.patient_id === patientId);
      return assessRisk(patient, patientBiomarkers);
    },
    [patients, biomarkers]
  );

  return (
    <CdssContext.Provider
      value={{
        patients,
        currentPatient,
        setCurrentPatientId,
        addPatient,
        updatePatient,
        removePatient,
        biomarkers,
        addBiomarker,
        removeBiomarker,
        getPatientBiomarkers,
        getRiskAssessment,
        symptomLogs,
        addSymptomLog,
        getPatientSymptomLogs,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </CdssContext.Provider>
  );
}

export function useCdss() {
  const ctx = useContext(CdssContext);
  if (!ctx) throw new Error("useCdss must be used inside CdssProvider");
  return ctx;
}
