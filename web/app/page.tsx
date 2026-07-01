"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";

type Mode = "signin" | "signup";

interface AuthFields {
  name?: string;
  email: string;
  password: string;
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFields>();

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  async function onSignIn(data: AuthFields) {
    setSubmitting(true);
    setError(null);
    const { error: err } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    if (err) {
      setError(err.message ?? err.statusText ?? "Sign in failed");
      setSubmitting(false);
    } else {
      router.push("/dashboard");
    }
  }

  async function onSignUp(data: AuthFields) {
    setSubmitting(true);
    setError(null);
    const { error: err } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name ?? "",
    });
    if (err) {
      setError(err.message ?? err.statusText ?? "Sign up failed");
      setSubmitting(false);
    } else {
      setMode("signin");
      setError("Verification email sent. Check your inbox.");
      setSubmitting(false);
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    reset();
  };

  const isSignIn = mode === "signin";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full">
      {/* Hero */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
        <div className="max-w-md">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="planToDO logo" className="h-10 w-10" />
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              planToDO
            </h1>
          </div>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Upload HTML plans and get a shareable URL. Manage drafts via the
            CLI or API.
          </p>
          <code className="mt-6 inline-block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-mono">
            npm i -g plantodo &amp;&amp; ptd upload index.html
          </code>
        </div>
      </div>

      {/* Auth forms */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile heading */}
          <div className="lg:hidden mb-10 text-center">
            <div className="flex items-center justify-center gap-2">
              <img src="/icon.svg" alt="planToDO logo" className="h-8 w-8" />
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                planToDO
              </h1>
            </div>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Upload HTML plans &mdash; get a shareable URL.
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-1 mb-8">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isSignIn
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                !isSignIn
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(isSignIn ? onSignIn : onSignUp)}
            className="space-y-4"
          >
            {!isSignIn && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  {...register("name")}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "At least 8 characters" },
                })}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className={`text-sm ${error.startsWith("Verification") ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {submitting
                ? "Please wait…"
                : isSignIn
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
