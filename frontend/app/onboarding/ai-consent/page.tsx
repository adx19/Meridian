"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";


export default function AIConsentPage() {

  const { data: session } = useSession();
  const router = useRouter();

  const handleConsent = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

      await fetch(`${backendUrl}/auth/ai-consent`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: session?.userId,
          ai_consent: true,
          ai_enabled: true,
        }),
      });

      router.push("/dashboard")
    } catch (error) {
      console.error(error);
    }
  }

  const handleSkip = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

      await fetch(`${backendUrl}/auth/ai-consent`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: session?.userId,
          ai_consent: false,
          ai_enabled: false,
        }),
      });

      router.push("/dashboard")
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div className="h-screen flex items-center justify-center bg-[#030712] px-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-blue-500/10 blur-[140px] rounded-full" />
      </div>
      <div className="relative z-10 w-full max-w-4xl">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-14">

          <div className="text-center mb-12">

            <div className="text-center">
              <div className="inline-flex px-4 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-wide mb-4">
                AI Features Available
              </div>
              <div className="flex justify-center mb-6">
                <img src="/meridian-icon.svg" alt="Meridian" className="w-14 h-14" />
              </div>
              <h1 className="mt-6 text-5xl font-bold text-white tracking-tight">
                Welcome to Meridian
              </h1>
              <p className="mt-4 text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Meridian uses AI to generate repository intelligence, project summaries, recent work analysis, and developer insights.
              </p>
            </div>
            <div className="mt-10 grid gap-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-white font-semibold mb-3">
                  Meridian may analyze:
                </p>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>✓ Repository metadata</li>
                  <li>✓ Commit messages</li>
                  <li>✓ Changed file names</li>
                  <li>✓ Development activity statistics</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.05] p-5">
                <p className="text-indigo-300 text-sm">
                  No source code is sent without your permission.
                </p>
              </div>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button className="flex-1 h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 transition text-white font-semibold" onClick={handleConsent}>
                Agree & Continue
              </button>
              <button className="flex-1 h-12 rounded-xl border border-white/10 hover:border-white/20 transition text-zinc-300" onClick={handleSkip}>
                Skip For Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}