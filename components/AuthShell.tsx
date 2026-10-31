"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import WisprBadge from "@/components/WisprBadge";
import { activateUser, loadState, saveState, State } from "@/lib/store";
import { authenticatedFetch, getSupabaseBrowserClient, isSupabaseAuthConfigured } from "@/lib/supabase-browser";
import { LearnerGreetingContext } from "@/lib/learner-greeting";
import type { Session } from "@supabase/supabase-js";

function isPublicPath(pathname: string) {
  return pathname === "/" || pathname === "/account" || pathname.startsWith("/teacher");
}

async function restoreLearner(session: Session) {
  activateUser(session.user.id);
  const local = loadState();
  const response = await authenticatedFetch("/api/learners", { cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Could not load your saved learner profile (${response.status}).`);
  }
  const remote = await response.json() as {
    profile: State["profile"];
    mastery: State["mastery"];
    attempts: State["attempts"];
    mockTestReports?: State["mockTestReports"];
    persisted: boolean;
  };
  if (remote.profile) {
    const reportsById = new Map(
      [...(local.mockTestReports ?? []), ...(remote.mockTestReports ?? [])].map((report) => [report.id, report]),
    );
    saveState({
      ...local,
      userId: session.user.id,
      profile: remote.profile,
      mastery: remote.mastery,
      attempts: remote.attempts,
      mockTestReports: [...reportsById.values()],
    });
    return;
  }

  if (local.profile) {
    const migration = await authenticatedFetch("/api/learners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        ...local.profile,
        mastery: local.mastery,
        attempts: local.attempts,
        mockTestReports: local.mockTestReports,
      }),
    });
    if (!migration.ok) {
      const body = await migration.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? "Could not move your existing progress to your account.");
    }
  }
}

export default function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [learnerName, setLearnerName] = useState<string | null>(null);
  const [ready, setReady] = useState(!isSupabaseAuthConfigured());
  const [authError, setAuthError] = useState("");

  const handleSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setAuthError("");
    if (nextSession) {
      activateUser(nextSession.user.id);
      const metadataName = nextSession.user.user_metadata.full_name ?? nextSession.user.user_metadata.name;
      const fallbackName = typeof metadataName === "string" && metadataName.trim()
        ? metadataName.trim()
        : nextSession.user.email?.split("@")[0] ?? null;
      setLearnerName(loadState().profile?.name || fallbackName);
      try {
        await restoreLearner(nextSession);
        setLearnerName(loadState().profile?.name || fallbackName);
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Could not restore account data.");
      }
    } else {
      activateUser(null);
      setLearnerName(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (isSupabaseAuthConfigured()) return;
    setLearnerName(loadState().profile?.name ?? null);
  }, []);

  useEffect(() => {
    if (!isSupabaseAuthConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let activeUserId: string | null = null;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAuthError(`Could not restore sign-in: ${error.message}`);
        setReady(true);
        return;
      }
      activeUserId = data.session?.user.id ?? null;
      void handleSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user.id ?? null;
      setSession(nextSession);
      if (nextUserId !== activeUserId) {
        activeUserId = nextUserId;
        void handleSession(nextSession);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [handleSession]);

  useEffect(() => {
    if (!isSupabaseAuthConfigured() || !ready || isPublicPath(pathname) || session) return;
    router.replace(`/account?next=${encodeURIComponent(pathname)}`);
  }, [pathname, ready, router, session]);

  const protectedRoute = isSupabaseAuthConfigured() && !isPublicPath(pathname);
  const awaitingAccount = protectedRoute && (!ready || !session);

  return (
    <>
      <Nav />
      <LearnerGreetingContext.Provider value={learnerName}>
        <main className="mx-auto max-w-6xl px-5 pb-24 pt-6">
          {authError && session && (
            <div role="alert" className="mx-auto mb-4 max-w-3xl rounded-lg border border-rust/40 bg-rust/10 p-3 text-sm text-rust">
              {authError}
            </div>
          )}
          {awaitingAccount ? (
            <p className="pt-16 text-center text-graphite">
              {ready ? "Redirecting to sign in…" : "Restoring your account…"}
            </p>
          ) : children}
        </main>
      </LearnerGreetingContext.Provider>
      <SiteFooter />
      <WisprBadge />
    </>
  );
}
