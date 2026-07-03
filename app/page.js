"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError("");
    if (password.length < 4) {
      setError("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword({ email, token, password });
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <p className="text-slate-500 text-sm">Lien de réinitialisation invalide ou incomplet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
        <h1 className="font-extrabold text-blue-900 text-lg mb-1">ABP Menuiseries</h1>
        <p className="text-slate-500 text-sm mb-6">Choisissez un nouveau mot de passe pour {email}</p>

        {success ? (
          <p className="text-green-700 text-sm">
            Votre mot de passe a bien été mis à jour. Vous pouvez maintenant retourner à l'accueil et vous connecter.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nouveau mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Confirmer le mot de passe</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <button disabled={busy} onClick={handleSubmit} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-60">
              {busy ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
