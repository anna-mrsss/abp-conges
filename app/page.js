"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { toDate, workingDaysInclusive, overlaps, fmt, MOIS, JOURS_SEMAINE, isValidEmail, isNonWorkingDay, currentLeavePeriod } from "@/lib/dates";

/* ---------- Logo (équerre de menuisier) ---------- */
function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0">
      <rect x="8" y="8" width="48" height="14" rx="2" fill="#facc15" stroke="#1e3a8a" strokeWidth="2" />
      <rect x="8" y="8" width="14" height="48" rx="2" fill="#facc15" stroke="#1e3a8a" strokeWidth="2" />
      {[16, 24, 32, 40, 48].map((x) => (
        <line key={"h" + x} x1={x} y1="8" x2={x} y2="16" stroke="#1e3a8a" strokeWidth="1.5" />
      ))}
      {[16, 24, 32, 40, 48].map((y) => (
        <line key={"v" + y} x1="8" y1={y} x2="16" y2={y} stroke="#1e3a8a" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function StatutBadge({ statut }) {
  const styles = {
    "En attente": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Validé": "bg-green-100 text-green-700 border-green-300",
    "Refusé": "bg-red-100 text-red-700 border-red-300",
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[statut] || ""}`}>
      {statut}
    </span>
  );
}
function ConflitBadge({ conflit }) {
  if (!conflit) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-orange-100 text-orange-700 border-orange-300">
      ⚠ Conflit
    </span>
  );
}

function ReglesBanner({ closures, blockingPeriods }) {
  const period = currentLeavePeriod();
  return (
    <div className="bg-blue-900 text-white rounded-xl p-5 space-y-2 text-sm leading-relaxed">
      <p className="font-bold text-yellow-400 uppercase tracking-wide text-xs mb-2">
        À lire avant de vous identifier
      </p>
      <ul className="space-y-1.5 list-none">
        <li className="flex gap-2"><span className="text-yellow-400">•</span> Maximum 2 personnes absentes en même temps.</li>
        <li className="flex gap-2"><span className="text-yellow-400">•</span> Les demandes sont traitées par ordre d'arrivée (l'horodateur fait foi).</li>
        <li className="flex gap-2"><span className="text-yellow-400">•</span> Les congés ne sont validés qu'après confirmation de la direction.</li>
        <li className="flex gap-2"><span className="text-yellow-400">•</span> Pas de congés pendant les périodes de fermeture de l'entreprise (été et hiver).</li>
      </ul>
      <p className="pt-2 mt-2 border-t border-blue-700 font-semibold">📅 {period.message}</p>
      {closures.length > 0 && (
        <div className="pt-2 mt-2 border-t border-blue-700">
          <p className="font-semibold text-yellow-400 text-xs uppercase mb-1">Fermetures programmées</p>
          <ul className="space-y-1">
            {closures.map((c) => (
              <li key={c.id}>🔒 {c.libelle || "Fermeture"} : du {fmt(c.dateDebut)} au {fmt(c.dateFin)}</li>
            ))}
          </ul>
        </div>
      )}
      {blockingPeriods.length > 0 && (
        <div className="pt-2 mt-2 border-t border-blue-700">
          <p className="font-semibold text-yellow-400 text-xs uppercase mb-1">Périodes de blocage temporaire des congés</p>
          <ul className="space-y-1">
            {blockingPeriods.map((c) => (
              <li key={c.id}>⛔ {c.libelle || "Blocage"} : du {fmt(c.dateDebut)} au {fmt(c.dateFin)}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="pt-2 mt-2 border-t border-blue-700 font-bold">
        IMPORTANT : utilisez toujours la même adresse e-mail et vérifiez bien qu'il n'y a pas de faute de frappe.
      </p>
    </div>
  );
}

/* ================= LOGIN / ACCUEIL ================= */
function LoginScreen({ closures, blockingPeriods, onAuthChange }) {
  const [tab, setTab] = useState("salarie");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-blue-900 border-b-4 border-yellow-400">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-white font-extrabold text-lg leading-tight">ABP Menuiseries</h1>
            <p className="text-blue-200 text-xs">Gestion des congés</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 grid md:grid-cols-2 gap-8 items-start">
        <ReglesBanner closures={closures} blockingPeriods={blockingPeriods} />

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setTab("salarie")}
              className={`flex-1 py-3 text-sm font-semibold ${tab === "salarie" ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              Espace salarié
            </button>
            <button
              onClick={() => setTab("direction")}
              className={`flex-1 py-3 text-sm font-semibold ${tab === "direction" ? "bg-blue-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              Espace direction
            </button>
          </div>
          <div className="p-6">
            {tab === "salarie" ? (
              <EmployeeLoginForm onAuthChange={onAuthChange} />
            ) : (
              <DirectionLoginForm onAuthChange={onAuthChange} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function EmployeeLoginForm({ onAuthChange }) {
  const [mode, setMode] = useState("choix"); // choix | create | access | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  function resetFields() {
    setEmail(""); setPassword(""); setConfirm(""); setNom(""); setPrenom(""); setError(""); setInfo("");
  }

  async function handleAccess() {
    setError(""); setInfo("");
    if (!isValidEmail(email.trim().toLowerCase())) {
      setError("Merci de saisir une adresse e-mail valide.");
      return;
    }
    setBusy(true);
    try {
      const emp = await api.login({ email: email.trim().toLowerCase(), password });
      onAuthChange({ role: "employee", ...emp });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    setError(""); setInfo("");
    const normEmail = email.trim().toLowerCase();
    if (!isValidEmail(normEmail)) {
      setError("Merci de saisir une adresse e-mail valide.");
      return;
    }
    if (!nom.trim() || !prenom.trim()) {
      setError("Merci de renseigner votre nom et votre prénom.");
      return;
    }
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
      const emp = await api.register({ email: normEmail, password, nom: nom.trim(), prenom: prenom.trim() });
      onAuthChange({ role: "employee", ...emp });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    setError(""); setInfo("");
    if (!isValidEmail(email.trim().toLowerCase())) {
      setError("Merci de saisir une adresse e-mail valide.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      setInfo(res.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (mode === "choix") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600 mb-2">Que souhaitez-vous faire ?</p>
        <button
          onClick={() => { resetFields(); setMode("create"); }}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold py-3 rounded-lg text-sm transition"
        >
          Créer mon compte salarié
        </button>
        <button
          onClick={() => { resetFields(); setMode("access"); }}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg text-sm transition"
        >
          Accéder à mon compte salarié
        </button>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Créez votre compte salarié : votre adresse e-mail sera votre identifiant. Choisissez un mot de passe que vous garderez pour vos prochaines connexions.
        </p>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse e-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@exemple.com"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom</label>
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Créer un mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Confirmer le mot de passe</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <button disabled={busy} onClick={handleCreate} className="w-full bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold py-2.5 rounded-lg text-sm transition disabled:opacity-60">
          {busy ? "Création…" : "Créer mon compte"}
        </button>
        <button onClick={() => { resetFields(); setMode("choix"); }} className="w-full text-slate-500 text-xs underline">
          ← Retour
        </button>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Saisissez l'adresse e-mail de votre compte salarié pour recevoir un lien de réinitialisation.</p>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse e-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleForgot()} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        {info && <p className="text-green-700 text-xs">{info}</p>}
        <button disabled={busy} onClick={handleForgot} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60">
          {busy ? "Envoi…" : "Envoyer le lien de réinitialisation"}
        </button>
        <button onClick={() => { resetFields(); setMode("access"); }} className="w-full text-slate-500 text-xs underline">
          ← Retour
        </button>
      </div>
    );
  }

  // mode === "access"
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Connectez-vous avec l'adresse e-mail utilisée à la création de votre compte.</p>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse e-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@exemple.com"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAccess()}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button disabled={busy} onClick={handleAccess} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60">
        {busy ? "Connexion…" : "Accéder à mon compte salarié"}
      </button>
      <button onClick={() => { resetFields(); setMode("forgot"); }} className="w-full text-slate-500 text-xs underline">
        Mot de passe oublié ?
      </button>
      <button onClick={() => { resetFields(); setMode("choix"); }} className="w-full text-slate-500 text-xs underline">
        ← Retour
      </button>
    </div>
  );
}

function DirectionLoginForm({ onAuthChange }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setError("");
    setBusy(true);
    try {
      await api.directionLogin(password);
      onAuthChange({ role: "direction" });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Accès réservé à la direction.</p>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" autoFocus />
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button disabled={busy} onClick={handleLogin} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60">
        {busy ? "Connexion…" : "Accéder à l'espace direction"}
      </button>
    </div>
  );
}

/* ================= ESPACE SALARIÉ ================= */
function EmployeeDashboard({ employee, requests, closures, blockingPeriods, onLogout, refresh }) {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const myRequests = useMemo(
    () => [...requests].sort((a, b) => b.horodateurTs - a.horodateurTs),
    [requests]
  );

  const period = useMemo(() => currentLeavePeriod(), []);

  const totals = useMemo(() => {
    let demandes = 0, valides = 0, attente = 0;
    myRequests
      .filter((r) => r.dateDebut >= period.startDate && r.dateDebut <= period.endDate)
      .forEach((r) => {
        const j = workingDaysInclusive(r.dateDebut, r.dateFin);
        if (r.statut !== "Refusé") demandes += j;
        if (r.statut === "Validé") valides += j;
        if (r.statut === "En attente") attente += j;
      });
    return { demandes, valides, attente };
  }, [myRequests, period]);

  function overlappingClosure(dS, dE) {
    return closures.find((c) => overlaps(dS, dE, c.dateDebut, c.dateFin));
  }
  function overlappingBlocking(dS, dE) {
    return blockingPeriods.find((c) => overlaps(dS, dE, c.dateDebut, c.dateFin));
  }

  const liveClosure = dateDebut && dateFin ? overlappingClosure(dateDebut, dateFin) : null;
  const liveBlocking = dateDebut && dateFin ? overlappingBlocking(dateDebut, dateFin) : null;

  async function handleSubmit() {
    setFormError(""); setFormSuccess("");
    if (!dateDebut || !dateFin) {
      setFormError("Merci de renseigner une date de début et une date de fin.");
      return;
    }
    if (toDate(dateFin) < toDate(dateDebut)) {
      setFormError("La date de fin doit être postérieure ou égale à la date de début.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.createRequest({ dateDebut, dateFin, commentaire });
      setDateDebut(""); setDateFin(""); setCommentaire("");
      setFormSuccess(res.warning || "Votre demande a bien été envoyée à la direction.");
      await refresh();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 border-b-4 border-yellow-400">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-white font-extrabold text-base leading-tight">ABP Menuiseries</h1>
              <p className="text-blue-200 text-xs">{employee.prenom} {employee.nom} · {employee.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} className="text-blue-200 hover:text-white text-xs underline">Actualiser</button>
            <button onClick={onLogout} className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold text-xs px-3 py-1.5 rounded-lg">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-blue-900 text-white rounded-xl px-5 py-3 text-sm font-semibold">
          📅 {period.message}
        </div>

        {closures.length > 0 && (
          <div className="bg-slate-800 text-white rounded-xl px-5 py-3 text-sm">
            🔒 Pas de congés possibles pendant les fermetures de l'entreprise :{" "}
            {closures.map((c, i) => (
              <span key={c.id} className="font-semibold text-yellow-400">
                {c.libelle || "Fermeture"} du {fmt(c.dateDebut)} au {fmt(c.dateFin)}{i < closures.length - 1 ? " — " : ""}
              </span>
            ))}
          </div>
        )}

        {blockingPeriods.length > 0 && (
          <div className="bg-orange-600 text-white rounded-xl px-5 py-3 text-sm">
            ⛔ Congés temporairement bloqués :{" "}
            {blockingPeriods.map((c, i) => (
              <span key={c.id} className="font-semibold">
                {c.libelle || "Blocage"} du {fmt(c.dateDebut)} au {fmt(c.dateFin)}{i < blockingPeriods.length - 1 ? " — " : ""}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-semibold uppercase">Jours demandés</p>
            <p className="text-2xl font-extrabold text-blue-900">{totals.demandes}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-semibold uppercase">Jours validés</p>
            <p className="text-2xl font-extrabold text-green-600">{totals.valides}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-semibold uppercase">En attente</p>
            <p className="text-2xl font-extrabold text-yellow-600">{totals.attente}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold text-blue-900 mb-4">Faire une demande de congé</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date de début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date de fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Commentaire (si besoin)</label>
            <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>

          {dateDebut && dateFin && toDate(dateFin) >= toDate(dateDebut) && (
            <p className="text-xs text-slate-500 mb-2">Durée : {workingDaysInclusive(dateDebut, dateFin)} jour(s) ouvré(s)</p>
          )}
          {liveClosure && (
            <p className="text-red-600 text-xs font-semibold mb-2">
              ⚠ Cette période chevauche une fermeture de l'entreprise ({liveClosure.libelle || "Fermeture"}, du {fmt(liveClosure.dateDebut)} au {fmt(liveClosure.dateFin)}).
            </p>
          )}
          {liveBlocking && (
            <p className="text-red-600 text-xs font-semibold mb-2">
              ⚠ Les congés sont temporairement bloqués sur cette période ({liveBlocking.libelle || "Blocage"}, du {fmt(liveBlocking.dateDebut)} au {fmt(liveBlocking.dateFin)}).
            </p>
          )}
          {formError && <p className="text-red-600 text-sm mb-2">{formError}</p>}
          {formSuccess && <p className="text-green-600 text-sm mb-2">{formSuccess}</p>}

          <button disabled={busy} onClick={handleSubmit} className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm disabled:opacity-60">
            {busy ? "Envoi…" : "Envoyer la demande"}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <h2 className="font-bold text-blue-900 p-6 pb-0">Mes demandes</h2>
          <div className="overflow-x-auto p-6 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                  <th className="py-2 pr-4">Horodateur</th>
                  <th className="py-2 pr-4">Début</th>
                  <th className="py-2 pr-4">Fin</th>
                  <th className="py-2 pr-4">Jours</th>
                  <th className="py-2 pr-4">Commentaire</th>
                  <th className="py-2 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-400">Aucune demande pour le moment.</td></tr>
                )}
                {myRequests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{r.horodateur}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{fmt(r.dateDebut)}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{fmt(r.dateFin)}</td>
                    <td className="py-2 pr-4">{workingDaysInclusive(r.dateDebut, r.dateFin)}</td>
                    <td className="py-2 pr-4 text-slate-500">{r.commentaire || "—"}</td>
                    <td className="py-2 pr-4"><StatutBadge statut={r.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ================= ESPACE DIRECTION ================= */
function DirectionDashboard({ requests, closures, blockingPeriods, onLogout, refresh, saveClosures, saveBlockingPeriods }) {
  const [tab, setTab] = useState("demandes");
  const [filter, setFilter] = useState("Tous");
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function deleteSelected() {
    setDeleteError("");
    if (selectedIds.length === 0) return;
    try {
      await api.bulkDeleteRequests(selectedIds);
      setSelectedIds([]);
      setConfirmingDelete(false);
      await refresh();
    } catch (e) {
      setDeleteError(e.message);
    }
  }

  function conflictCount(req) {
    const emails = new Set();
    requests.forEach((r) => {
      if (r.statut !== "Refusé" && overlaps(req.dateDebut, req.dateFin, r.dateDebut, r.dateFin)) {
        emails.add(r.email);
      }
    });
    return emails.size;
  }

  const sorted = useMemo(() => [...requests].sort((a, b) => a.horodateurTs - b.horodateurTs), [requests]);
  const filtered = filter === "Tous" ? sorted : sorted.filter((r) => r.statut === filter);

  async function updateStatus(id, statut) {
    await api.updateRequestStatus(id, statut);
    await refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 border-b-4 border-yellow-400">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-white font-extrabold text-base leading-tight">ABP Menuiseries</h1>
              <p className="text-blue-200 text-xs">Espace direction</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} className="text-blue-200 hover:text-white text-xs underline">Actualiser</button>
            <button onClick={onLogout} className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold text-xs px-3 py-1.5 rounded-lg">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex gap-2 border-b border-slate-200">
          {["demandes", "calendrier", "fermetures", "salaries"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg ${tab === t ? "bg-white border border-b-0 border-slate-200 text-blue-900" : "text-slate-400 hover:text-slate-600"}`}
            >
              {t === "demandes" ? "Demandes" : t === "calendrier" ? "Calendrier" : t === "fermetures" ? "Fermetures & blocages" : "Salariés"}
            </button>
          ))}
        </div>

        {tab === "demandes" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="font-bold text-blue-900">Toutes les demandes (par ordre d'arrivée)</h2>
              <div className="flex items-center gap-3">
                {selectedIds.length > 0 && !confirmingDelete && (
                  <button onClick={() => setConfirmingDelete(true)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-full">
                    Supprimer la sélection ({selectedIds.length})
                  </button>
                )}
                <div className="flex gap-1">
                  {["Tous", "En attente", "Validé", "Refusé"].map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-full border ${filter === f ? "bg-blue-900 text-white border-blue-900" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {confirmingDelete && (
              <div className="mb-4 bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-red-700">
                  Supprimer définitivement {selectedIds.length > 1 ? `ces ${selectedIds.length} demandes` : "cette demande"} ? Cette action est irréversible.
                </p>
                <div className="flex gap-2">
                  <button onClick={deleteSelected} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-md">Confirmer la suppression</button>
                  <button onClick={() => { setConfirmingDelete(false); setDeleteError(""); }} className="text-xs bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold px-3 py-1.5 rounded-md">Annuler</button>
                </div>
              </div>
            )}
            {deleteError && <p className="text-red-600 text-xs mb-3">{deleteError}</p>}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                    <th className="py-2 pr-4">
                      <input type="checkbox"
                        checked={filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => Array.from(new Set([...prev, ...filtered.map((r) => r.id)])));
                          } else {
                            const filteredIds = filtered.map((r) => r.id);
                            setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
                          }
                        }} />
                    </th>
                    <th className="py-2 pr-4">Horodateur</th>
                    <th className="py-2 pr-4">Salarié</th>
                    <th className="py-2 pr-4">Début</th>
                    <th className="py-2 pr-4">Fin</th>
                    <th className="py-2 pr-4">Jours</th>
                    <th className="py-2 pr-4">Commentaire</th>
                    <th className="py-2 pr-4">Conflit</th>
                    <th className="py-2 pr-4">Statut</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="py-6 text-center text-slate-400">Aucune demande.</td></tr>
                  )}
                  {filtered.map((r) => (
                    <tr key={r.id} className={`border-b border-slate-100 align-top ${selectedIds.includes(r.id) ? "bg-blue-50" : ""}`}>
                      <td className="py-2 pr-4"><input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                      <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{r.horodateur}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <p className="font-semibold">{r.prenom} {r.nom}</p>
                        <p className="text-xs text-slate-400">{r.email}</p>
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">{fmt(r.dateDebut)}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{fmt(r.dateFin)}</td>
                      <td className="py-2 pr-4">{workingDaysInclusive(r.dateDebut, r.dateFin)}</td>
                      <td className="py-2 pr-4 text-slate-500 max-w-[160px]">{r.commentaire || "—"}</td>
                      <td className="py-2 pr-4"><ConflitBadge conflit={conflictCount(r) > 2} /></td>
                      <td className="py-2 pr-4"><StatutBadge statut={r.statut} /></td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-1.5">
                          {r.statut !== "Validé" && <button onClick={() => updateStatus(r.id, "Validé")} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-md">Valider</button>}
                          {r.statut !== "Refusé" && <button onClick={() => updateStatus(r.id, "Refusé")} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-md">Refuser</button>}
                          {r.statut !== "En attente" && <button onClick={() => updateStatus(r.id, "En attente")} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-md">Attente</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "calendrier" && <CalendarView requests={requests} closures={closures} blockingPeriods={blockingPeriods} />}
        {tab === "fermetures" && (
          <div className="space-y-6">
            <ClosuresPanel closures={closures} saveClosures={saveClosures} />
            <BlockingPeriodsPanel blockingPeriods={blockingPeriods} saveBlockingPeriods={saveBlockingPeriods} />
          </div>
        )}
        {tab === "salaries" && <EmployeesPanel />}
      </main>
    </div>
  );
}

function EmployeesPanel() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function loadEmployees() {
    return api.listEmployees().then((res) => setEmployees(res.employees));
  }

  useEffect(() => {
    loadEmployees().finally(() => setLoading(false));
  }, []);

  async function handleReset() {
    setError(""); setSuccess("");
    if (!selected) {
      setError("Choisissez un salarié.");
      return;
    }
    if (newPassword.length < 4) {
      setError("Le nouveau mot de passe doit contenir au moins 4 caractères.");
      return;
    }
    setBusy(true);
    try {
      await api.resetEmployeePassword(selected, newPassword);
      setSuccess("Mot de passe réinitialisé. Communiquez-le au salarié concerné.");
      setNewPassword("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(email) {
    setDeleteError("");
    try {
      await api.deleteEmployee(email);
      setConfirmingDelete(null);
      if (selected === email) setSelected("");
      await loadEmployees();
    } catch (e) {
      setDeleteError(e.message);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-blue-900 mb-2">Réinitialiser le mot de passe d'un salarié</h2>
        <p className="text-sm text-slate-500 mb-4">
          À utiliser si un salarié ne peut pas récupérer son compte lui-même (e-mail de réinitialisation non configuré, ou boîte mail inaccessible).
        </p>
        {loading ? (
          <p className="text-slate-400 text-sm">Chargement…</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Salarié</label>
              <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                <option value="">— Choisir —</option>
                {employees.map((e) => (
                  <option key={e.email} value={e.email}>{e.prenom} {e.nom} ({e.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nouveau mot de passe</label>
              <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            {success && <p className="text-green-700 text-xs">{success}</p>}
            <button disabled={busy} onClick={handleReset} className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60">
              {busy ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-blue-900 mb-2">Comptes salariés</h2>
        <p className="text-sm text-slate-500 mb-4">
          Supprimer un compte (utile pour retirer un compte de test) efface aussi toutes ses demandes de congé. Cette action est irréversible.
        </p>
        {deleteError && <p className="text-red-600 text-xs mb-3">{deleteError}</p>}
        {loading ? (
          <p className="text-slate-400 text-sm">Chargement…</p>
        ) : employees.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucun compte salarié pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {employees.map((e) => (
              <li key={e.email} className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">
                    <span className="font-semibold">{e.prenom} {e.nom}</span>{" "}
                    <span className="text-slate-400">({e.email})</span>
                  </span>
                  {confirmingDelete !== e.email && (
                    <button onClick={() => setConfirmingDelete(e.email)} className="text-xs text-red-600 hover:text-red-700 font-semibold shrink-0">
                      Supprimer
                    </button>
                  )}
                </div>
                {confirmingDelete === e.email && (
                  <div className="mt-2 bg-red-50 border border-red-300 rounded-lg px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-red-700">Supprimer définitivement ce compte et toutes ses demandes ?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(e.email)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-md">Confirmer</button>
                      <button onClick={() => setConfirmingDelete(null)} className="text-xs bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold px-3 py-1 rounded-md">Annuler</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CalendarView({ requests, closures, blockingPeriods }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  function peopleOnDay(ds, statut) {
    return requests.filter((r) => r.statut === statut && overlaps(ds, ds, r.dateDebut, r.dateFin));
  }
  function closureOnDay(ds) {
    return closures.find((c) => overlaps(ds, ds, c.dateDebut, c.dateFin));
  }
  function blockingOnDay(ds) {
    return blockingPeriods.find((c) => overlaps(ds, ds, c.dateDebut, c.dateFin));
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="text-slate-500 hover:text-blue-900 text-sm px-2">◀</button>
        <h2 className="font-bold text-blue-900">{MOIS[month]} {year}</h2>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="text-slate-500 hover:text-blue-900 text-sm px-2">▶</button>
      </div>

      <div className="flex gap-4 mb-3 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-700 inline-block" /> Validé</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> En attente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" /> Fermeture</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> Blocage temporaire</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundImage: "repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 2px, #f1f5f9 2px, #f1f5f9 5px)" }} /> Week-end / jour férié
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-slate-400 font-semibold mb-1">
        {JOURS_SEMAINE.map((j) => <div key={j} className="text-center py-1">{j}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="min-h-[80px]" />;
          const ds = dateStr(d);
          const closure = closureOnDay(ds);
          const blocking = blockingOnDay(ds);
          const nonWorking = isNonWorkingDay(ds);
          // Sur les jours non travaillés (week-ends, jours fériés), on n'affiche aucun
          // congé : ces jours ne sont pas décomptés, donc pas de nom de salarié dessus.
          const valides = nonWorking ? [] : peopleOnDay(ds, "Validé");
          const attente = nonWorking ? [] : peopleOnDay(ds, "En attente");
          const hatchStyle = nonWorking && !closure
            ? { backgroundImage: "repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 3px, #f8fafc 3px, #f8fafc 8px)" }
            : undefined;
          return (
            <div
              key={i}
              style={hatchStyle}
              className={`min-h-[80px] rounded-lg border p-1.5 ${
                closure ? "bg-slate-100 border-slate-300" : blocking ? "bg-orange-50 border-orange-200" : nonWorking ? "border-slate-200" : "border-slate-200"
              }`}
            >
              <p className="text-xs font-semibold text-slate-500 mb-1">{d}</p>
              {closure && <p className="text-[10px] text-slate-500 mb-1">🔒 {closure.libelle || "Fermeture"}</p>}
              {!closure && blocking && <p className="text-[10px] text-orange-700 mb-1">⛔ {blocking.libelle || "Blocage"}</p>}
              <div className="flex flex-wrap gap-1">
                {valides.map((r) => (
                  <span key={r.id} title={`${r.prenom} ${r.nom} — Validé`} className="text-[10px] font-bold bg-blue-700 text-white rounded px-1">
                    {(r.prenom[0] + r.nom[0]).toUpperCase()}
                  </span>
                ))}
                {attente.map((r) => (
                  <span key={r.id} title={`${r.prenom} ${r.nom} — En attente`} className="text-[10px] font-bold bg-yellow-400 text-blue-900 rounded px-1">
                    {(r.prenom[0] + r.nom[0]).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockingPeriodsPanel({ blockingPeriods, saveBlockingPeriods }) {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [libelle, setLibelle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function addBlocking() {
    setError("");
    if (!dateDebut || !dateFin) {
      setError("Merci de renseigner une date de début et une date de fin.");
      return;
    }
    if (toDate(dateFin) < toDate(dateDebut)) {
      setError("La date de fin doit être postérieure ou égale à la date de début.");
      return;
    }
    setBusy(true);
    try {
      await api.addBlockingPeriod({ dateDebut, dateFin, libelle: libelle.trim() });
      await saveBlockingPeriods();
      setDateDebut(""); setDateFin(""); setLibelle("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeBlocking(id) {
    await api.deleteBlockingPeriod(id);
    await saveBlockingPeriods();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-blue-900 mb-1">Ajouter une période de blocage temporaire</h2>
        <p className="text-sm text-slate-500 mb-4">
          À utiliser pour interdire temporairement les congés (forte activité, inventaire…), sans que ce soit une fermeture officielle de l'entreprise.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Libellé (ex : Période de forte activité, Inventaire)</label>
            <input value={libelle} onChange={(e) => setLibelle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button disabled={busy} onClick={addBlocking} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60">
            {busy ? "Ajout…" : "Ajouter le blocage"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-blue-900 mb-4">Blocages temporaires en cours</h2>
        {blockingPeriods.length === 0 && <p className="text-slate-400 text-sm">Aucun blocage temporaire enregistré.</p>}
        <ul className="space-y-2">
          {blockingPeriods.map((c) => (
            <li key={c.id} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2 text-sm">
              <span>⛔ <span className="font-semibold">{c.libelle || "Blocage"}</span> — du {fmt(c.dateDebut)} au {fmt(c.dateFin)}</span>
              <button onClick={() => removeBlocking(c.id)} className="text-red-600 hover:text-red-700 text-xs font-semibold">Supprimer</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ClosuresPanel({ closures, saveClosures }) {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [libelle, setLibelle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function addClosure() {
    setError("");
    if (!dateDebut || !dateFin) {
      setError("Merci de renseigner une date de début et une date de fin.");
      return;
    }
    if (toDate(dateFin) < toDate(dateDebut)) {
      setError("La date de fin doit être postérieure ou égale à la date de début.");
      return;
    }
    setBusy(true);
    try {
      await api.addClosure({ dateDebut, dateFin, libelle: libelle.trim() });
      await saveClosures();
      setDateDebut(""); setDateFin(""); setLibelle("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeClosure(id) {
    await api.deleteClosure(id);
    await saveClosures();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-blue-900 mb-4">Ajouter une période de fermeture</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Libellé (ex : Fermeture été)</label>
            <input value={libelle} onChange={(e) => setLibelle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button disabled={busy} onClick={addClosure} className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60">
            {busy ? "Ajout…" : "Ajouter la fermeture"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-blue-900 mb-4">Fermetures programmées</h2>
        {closures.length === 0 && <p className="text-slate-400 text-sm">Aucune fermeture enregistrée.</p>}
        <ul className="space-y-2">
          {closures.map((c) => (
            <li key={c.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
              <span>🔒 <span className="font-semibold">{c.libelle || "Fermeture"}</span> — du {fmt(c.dateDebut)} au {fmt(c.dateFin)}</span>
              <button onClick={() => removeClosure(c.id)} className="text-red-600 hover:text-red-700 text-xs font-semibold">Supprimer</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ================= APP ================= */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [requests, setRequests] = useState([]);
  const [closures, setClosures] = useState([]);
  const [blockingPeriods, setBlockingPeriods] = useState([]);

  const loadClosures = useCallback(async () => {
    try {
      const res = await api.getClosures();
      setClosures(res.closures);
    } catch (e) {
      console.error("Erreur chargement fermetures :", e);
    }
  }, []);

  const loadBlockingPeriods = useCallback(async () => {
    try {
      const res = await api.getBlockingPeriods();
      setBlockingPeriods(res.blockingPeriods);
    } catch (e) {
      console.error("Erreur chargement blocages :", e);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const res = await api.getRequests();
      setRequests(res.requests);
    } catch {
      // pas authentifié : rien à charger
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadClosures(), loadBlockingPeriods(), loadRequests()]);
  }, [loadClosures, loadBlockingPeriods, loadRequests]);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadClosures(), loadBlockingPeriods()]);
        const me = await api.me();
        if (me.auth) {
          setAuth(me.auth);
          await loadRequests();
        }
      } catch (e) {
        console.error("Erreur au chargement initial :", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadClosures, loadBlockingPeriods, loadRequests]);

  useEffect(() => {
    if (!auth) return;
    const id = setInterval(loadAll, 20000);
    return () => clearInterval(id);
  }, [auth, loadAll]);

  async function handleAuthChange(newAuth) {
    setAuth(newAuth);
    await loadRequests();
  }

  async function handleLogout() {
    await api.logout();
    setAuth(null);
    setRequests([]);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm">Chargement…</p>
      </div>
    );
  }

  if (!auth) {
    return <LoginScreen closures={closures} blockingPeriods={blockingPeriods} onAuthChange={handleAuthChange} />;
  }

  if (auth.role === "employee") {
    return (
      <EmployeeDashboard employee={auth} requests={requests} closures={closures} blockingPeriods={blockingPeriods} onLogout={handleLogout} refresh={loadAll} />
    );
  }

  return (
    <DirectionDashboard
      requests={requests}
      closures={closures}
      blockingPeriods={blockingPeriods}
      onLogout={handleLogout}
      refresh={loadAll}
      saveClosures={loadClosures}
      saveBlockingPeriods={loadBlockingPeriods}
    />
  );
}
