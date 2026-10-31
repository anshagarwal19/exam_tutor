"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { activateUser } from "@/lib/store";
import { getSupabaseBrowserClient, isSupabaseAuthConfigured } from "@/lib/supabase-browser";

function AccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();
  const configured = isSupabaseAuthConfigured();
  const requestedPath = searchParams.get("next") ?? (mode === "sign-in" ? "/" : "/onboarding");
  const nextPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/onboarding";

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setAccountEmail(data.session?.user.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccountEmail(session?.user.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase Auth is not configured. Add the public project URL and anon key to your environment.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/account` },
        });
        if (signUpError) throw signUpError;
        if (!data.session || !data.user) {
          if (data.user) activateUser(data.user.id);
          setMessage("Account created. Check your email to confirm it, then sign in here.");
          return;
        }
        activateUser(data.user.id);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        if (!data.user) throw new Error("Supabase did not return an authenticated user.");
        activateUser(data.user.id);
      }
      router.replace(nextPath);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setBusy(false);
      return;
    }
    activateUser(null);
    setMessage("You have been signed out.");
    setBusy(false);
  }

  return (
    <section className="notebook-card mx-auto mt-10 max-w-md space-y-5">
      {accountEmail ? (
        <>
          <div className="space-y-2">
            <p className="annotation">Signed in</p>
            <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
            <p className="text-sm text-graphite">{accountEmail}</p>
          </div>
          {error && <p role="alert" className="text-sm text-rust">{error}</p>}
          {message && <p role="status" className="text-sm text-moss">{message}</p>}
          <Link href="/onboarding" className="btn-primary w-full">Continue learning</Link>
          <button type="button" className="btn-ghost w-full" disabled={busy} onClick={() => void signOut()}>
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </>
      ) : (
      <>
      <div className="space-y-2">
        <p className="annotation">Your learner account</p>
        <h1 className="font-display text-3xl font-semibold">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-graphite">
          Sign in to keep your profile and learning progress connected to your account.
        </p>
      </div>

      {!configured ? (
        <div role="alert" className="space-y-3 rounded-lg border border-amber/50 bg-amber/10 p-4 text-sm">
          <p className="font-semibold">Supabase Auth setup is needed</p>
          <p className="text-graphite">
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
            <code> .env</code> (or <code>.env.local</code>). Find the project URL and publishable anon key in Supabase → Project Settings → API.
            Never use the service-role key in a <code>NEXT_PUBLIC_</code> variable.
          </p>
        </div>
      ) : (
        <>
          <form className="space-y-4" onSubmit={(event) => void submit(event)}>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Password</span>
              <input
                className="input"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {mode === "sign-up" && <span className="text-xs text-graphite">Use at least 8 characters.</span>}
            </label>
            {error && <p role="alert" className="text-sm text-rust">{error}</p>}
            {message && <p role="status" className="text-sm text-moss">{message}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="button"
              className="text-accent underline-offset-2 hover:underline"
              onClick={() => { setError(""); setMessage(""); setMode(mode === "sign-in" ? "sign-up" : "sign-in"); }}
            >
              {mode === "sign-in" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </>
      )}
      <p className="text-xs text-graphite">
        Your password is handled by Supabase Auth and is never stored by this app.
      </p>
      <Link href="/" className="block text-sm text-accent hover:underline">Back to home</Link>
      </>
      )}
    </section>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<p className="pt-16 text-center text-graphite">Loading account…</p>}>
      <AccountForm />
    </Suspense>
  );
}
