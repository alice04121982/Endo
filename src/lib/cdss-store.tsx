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
  BiomarkerValue,
  BiomarkerType,
  PatientHistory,
  RiskStratification,
  SymptomLog,
} from "@/lib/types/cdss";
import { BIOMARKER_META } from "@/lib/types/cdss";
import { assessRisk, flagBiomarker } from "@/lib/engine/risk-engine";

const PATIENTS_KEY = "cdss_patients";
const BIOMARKERS_KEY = "cdss_biomarkers";
const SYMPTOM_LOGS_KEY = "cdss_symptom_logs";

interface CdssContextValue {
  patients: PatientHistory[];
  currentPatient: PatientHistory | null;
  setCurrentPatientId: (id: string | null) => void;
  addPatient: (patient: Omit<PatientHistory, "id" | "created_at">) => PatientHistory;
  updatePatient: (id: string, updates: Partial<PatientHistory>) => void;
  removePatient: (id: string) => void;
  biomarkers: BiomarkerValue[];
  addBiomarker: (patientId: string, marker: BiomarkerType, value: number, dateCollected: string) => BiomarkerValue;
  removeBiomarker: (id: string) => void;
  getPatientBiomarkers: (patientId: string) => BiomarkerValue[];
  getRiskAssessment: (patientId: string) => RiskStratification | null;
  symptomLogs: SymptomLog[];
  addSymptomLog: (patientId: string, log: Omit<SymptomLog, "id" | "patient_id" | "logged_at">) => SymptomLog;
  getPatientSymptomLogs: (patientId: string) => SymptomLog[];
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

export function CdssProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<PatientHistory[]>([]);
  const [biomarkers, setBiomarkers] = useState<BiomarkerValue[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);

  useEffect(() => {
    setPatients(loadJson<PatientHistory>(PATIENTS_KEY));
    setBiomarkers(loadJson<BiomarkerValue>(BIOMARKERS_KEY));
    setSymptomLogs(loadJson<SymptomLog>(SYMPTOM_LOGS_KEY));
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
      dateCollected: string
    ): BiomarkerValue => {
      const meta = BIOMARKER_META[marker];
      const entry: BiomarkerValue = {
        id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        patient_id: patientId,
        marker,
        value,
        date_collected: dateCollected,
        flag: flagBiomarker(marker, value, meta),
      };
      setBiomarkers((prev) => {
        const next = [entry, ...prev];
        saveJson(BIOMARKERS_KEY, next);
        return next;
      });
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
    (patientId: string, log: Omit<SymptomLog, "id" | "patient_id" | "logged_at">): SymptomLog => {
      const entry: SymptomLog = {
        ...log,
        id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        patient_id: patientId,
        logged_at: new Date().toISOString(),
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
