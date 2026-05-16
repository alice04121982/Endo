"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import {
  startPasskeyEnrollment,
  finishPasskeyEnrollment,
} from "./actions";

// Client-side enrolment driver. Calls the server action to fetch options,
// hands them to @simplewebauthn/browser to invoke the OS passkey UI, and
// posts the response back through finishPasskeyEnrollment.
//
// Surfaces three states to the user:
//   - idle (default)
//   - enrolling (browser passkey UI is open)
//   - error (with reason, retryable)

interface Props {
  hasExisting: boolean;
}

export function EnrollPasskeyButton({ hasExisting }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [busy, startTransition] = useTransition();

  async function enrol() {
    setError(null);
    try {
      const options = await startPasskeyEnrollment();
      const response = await startRegistration({ optionsJSON: options });
      const result = await finishPasskeyEnrollment({
        payload: response,
        deviceName: deviceName.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
      } else {
        setDeviceName("");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not enrol the passkey.";
      // The browser throws a NotAllowedError if the user dismisses the OS UI.
      if (/NotAllowedError|aborted|cancel/i.test(message)) {
        setError("Cancelled. Tap enrol again to try once more.");
      } else {
        setError(message);
      }
    }
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="device-name"
        className="block text-sm font-semibold text-[var(--color-brand-aubergine)]"
      >
        Name this device <span className="font-normal text-[var(--color-brand-stone)]">(optional)</span>
      </label>
      <input
        id="device-name"
        type="text"
        placeholder="e.g. iPhone 15 Pro"
        value={deviceName}
        onChange={(e) => setDeviceName(e.target.value)}
        className="w-full sm:max-w-sm px-3 py-2.5 rounded-[8px] border border-[var(--color-brand-sand)] bg-white text-sm focus:outline-none focus:border-[var(--color-brand-clay)]"
      />
      <div>
        <button
          type="button"
          onClick={() => startTransition(enrol)}
          disabled={busy}
          className="inline-flex items-center px-5 py-2.5 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors disabled:opacity-60"
        >
          {busy
            ? "Talking to your device…"
            : hasExisting
              ? "Add another passkey"
              : "Enrol a passkey"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="text-sm text-[var(--color-brand-red)] font-medium"
        >
          {error}
        </p>
      )}
      <p className="text-xs text-[var(--color-brand-stone)] max-w-md">
        Your device will ask for Face ID, Touch ID, Windows Hello, or
        another biometric. Endo never sees your fingerprint or face — only
        the cryptographic signature your device produces.
      </p>
    </div>
  );
}
