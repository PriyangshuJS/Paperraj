"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      };
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const onInstalled = () => {
      setInstallEvent(null);
      setHidden(true);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent || hidden) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex justify-center sm:inset-x-auto sm:right-5 sm:bottom-5">
      <div className="paper paper-lined flex items-center gap-3 px-4 py-3 shadow-[var(--shadow-lift)] animate-rise">
        <span aria-hidden className="text-xl">📚</span>
        <p className="text-sm text-ink-2">
          Keep the archive in your pocket —{" "}
          <strong className="font-semibold text-ink">install PaperRaj</strong>.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={async () => {
            await installEvent.prompt();
            await installEvent.userChoice;
            setInstallEvent(null);
          }}
        >
          Install
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-label="Dismiss install prompt"
          onClick={() => setHidden(true)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
