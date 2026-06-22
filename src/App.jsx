import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Archive, Users, Receipt, Search, Lock, CreditCard,
  Car, ShieldAlert, Crown, Building2, Skull, Star, X, MapPin,
  Calendar, UserCog, Fingerprint, Briefcase, Clock, FileText,
  Banknote, Plus, Circle, TrendingUp, Camera, Pencil, Trash2,
  LogOut, AlertTriangle, Database, Loader2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { supabase, isConfigured, resolveEmail } from "./supabaseClient";

const LOGO = "/logo.png";

/* ───────── THÈME · noir / blanc / doré ───────── */
const T = {
  bg: "#0A0A0B", panel: "#121214", panel2: "#18181B", line: "#28282C", lineSoft: "#1C1C20",
  text: "#F2EFE9", textDim: "#9A968E", textFaint: "#5C5A55",
  gold: "#C9A84C", goldSoft: "#8C7634", danger: "#B0413B",
};

const RARITY = {
  Commun:       { c: "#6B6863", label: "COMMUN", solid: false },
  "Peu commun": { c: "#8F8A7E", label: "PEU COMMUN", solid: false },
  Rare:         { c: "#B89B57", label: "RARE", solid: false },
  "Très rare":  { c: "#C9A84C", label: "TRÈS RARE", solid: false },
  Légendaire:   { c: "#C9A84C", label: "LÉGENDAIRE", solid: true },
};

const CATS = ["Civil", "Travailleur", "Commerçant", "Gang", "Organisation criminelle", "Fonctionnaire", "LSPD", "SAHP", "Politicien", "Profil influent", "Profil stratégique"];

const CAT_META = {
  Civil: { icon: Users, gold: false }, Travailleur: { icon: Briefcase, gold: false },
  Commerçant: { icon: Building2, gold: false }, Gang: { icon: Skull, gold: false },
  "Organisation criminelle": { icon: Skull, gold: false }, Fonctionnaire: { icon: Building2, gold: false },
  LSPD: { icon: ShieldAlert, gold: true }, SAHP: { icon: ShieldAlert, gold: true },
  Politicien: { icon: Crown, gold: true }, "Profil influent": { icon: Star, gold: true },
  "Profil stratégique": { icon: Star, gold: true },
};
const catColor = (c) => (CAT_META[c]?.gold ? T.gold : T.textDim);

const STATUS = {
  disponible: { c: T.gold, label: "DISPONIBLE" }, reserve: { c: T.text, label: "RÉSERVÉ" },
  vendu: { c: T.danger, label: "VENDU" }, archive: { c: T.textFaint, label: "ARCHIVÉ" },
};

const fmt = (n) => "$" + (Number(n) || 0).toLocaleString("fr-FR");
const pad = (n, l) => String(n).padStart(l, "0");

/* ───────── PRIMITIVES UI ───────── */
function Monogram({ p, size = 56 }) {
  const ini = ((p.prenom?.[0] || "") + (p.nom?.[0] || "")).toUpperCase() || "??";
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: 4, background: "linear-gradient(150deg,#1e1e22,#0f0f12)", border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <span style={{ fontFamily: "Space Grotesk", fontWeight: 600, color: "rgba(242,239,233,.5)", fontSize: size * 0.32, letterSpacing: 1 }}>{ini}</span>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.2) 3px,rgba(0,0,0,.2) 4px)" }} />
    </div>
  );
}
function Avatar({ p, size = 56 }) {
  if (p.photo) return <img src={p.photo} alt="" style={{ width: size, height: size, flexShrink: 0, borderRadius: 4, objectFit: "cover", border: `1px solid ${T.line}` }} />;
  return <Monogram p={p} size={size} />;
}
const Badge = ({ color, children, solid }) => (
  <span style={{ fontFamily: "JetBrains Mono", fontSize: 9.5, fontWeight: 600, letterSpacing: .8, padding: "3px 7px", borderRadius: 3, whiteSpace: "nowrap", color: solid ? T.bg : color, background: solid ? color : "transparent", border: `1px solid ${color}${solid ? "" : "55"}` }}>{children}</span>
);
const RarityBar = ({ rarete }) => {
  const r = RARITY[rarete] || RARITY.Commun;
  return <div style={{ width: 3, alignSelf: "stretch", background: r.c, borderRadius: 2, boxShadow: r.solid ? `0 0 8px ${r.c}66` : "none" }} />;
};
const SectionLabel = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 10px" }}>
    <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: 2, color: T.gold, textTransform: "uppercase" }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: T.lineSoft }} />
  </div>
);
const Chip = ({ active, onClick, gold, children }) => {
  const c = gold ? T.gold : T.textDim;
  return <button onClick={onClick} style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, letterSpacing: .5, padding: "6px 11px", borderRadius: 5, cursor: "pointer", whiteSpace: "nowrap", color: active ? T.bg : c, background: active ? (gold ? T.gold : T.text) : "transparent", border: `1px solid ${active ? (gold ? T.gold : T.text) : T.line}`, transition: "all .15s" }}>{children}</button>;
};
const Empty = ({ children, action }) => (
  <div style={{ textAlign: "center", padding: "54px 20px", color: T.textFaint, border: `1px dashed ${T.line}`, borderRadius: 10 }}>
    <div style={{ fontSize: 13.5, marginBottom: action ? 16 : 0 }}>{children}</div>{action}
  </div>
);
const GoldBtn = ({ onClick, children, ghost, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ fontFamily: "Space Grotesk", fontSize: 13, fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? .6 : 1, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 7, color: ghost ? T.gold : T.bg, background: ghost ? "transparent" : T.gold, border: `1px solid ${T.gold}`, transition: "all .15s" }}>{children}</button>
);
const IconBtn = ({ icon: Ic, onClick, danger, title }) => (
  <button onClick={onClick} title={title} style={{ background: "transparent", border: `1px solid ${T.line}`, borderRadius: 6, padding: 6, cursor: "pointer", color: danger ? T.danger : T.textDim, display: "inline-flex" }}>
    <Ic size={15} />
  </button>
);

const inputBase = { width: "100%", background: T.bg, border: `1px solid ${T.line}`, borderRadius: 6, padding: "9px 11px", color: T.text, fontSize: 13, fontFamily: "Space Grotesk", outline: "none" };
const Field = ({ label, children, full }) => (
  <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
    <label style={{ fontFamily: "JetBrains Mono", fontSize: 9.5, letterSpacing: 1, color: T.textDim, display: "block", marginBottom: 6 }}>{label.toUpperCase()}</label>{children}
  </div>
);
const TextInput = (props) => <input {...props} style={inputBase} />;
const Area = (props) => <textarea {...props} style={{ ...inputBase, minHeight: 70, resize: "vertical" }} />;
const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={onChange} style={{ ...inputBase, fontFamily: "JetBrains Mono", fontSize: 12, cursor: "pointer" }}>
    {options.map((o) => <option key={o} value={o} style={{ background: T.bg }}>{o}</option>)}
  </select>
);
const Check = ({ checked, onChange, label }) => (
  <button type="button" onClick={() => onChange(!checked)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 11px", background: T.bg, border: `1px solid ${checked ? T.gold + "88" : T.line}`, borderRadius: 6, cursor: "pointer" }}>
    <span style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${checked ? T.gold : T.textFaint}`, background: checked ? T.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{checked && <span style={{ color: T.bg, fontSize: 11, fontWeight: 700 }}>✓</span>}</span>
    <span style={{ fontSize: 13, color: T.text }}>{label}</span>
  </button>
);

function Modal({ title, onClose, children, onSubmit, submitLabel = "Enregistrer", mobile, busy }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.74)", backdropFilter: "blur(4px)", zIndex: 60, display: "flex", alignItems: mobile ? "stretch" : "center", justifyContent: "center", padding: mobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: mobile ? "100%" : "min(640px,100%)", maxHeight: mobile ? "100%" : "90vh", height: mobile ? "100%" : "auto", background: T.panel, border: `1px solid ${T.line}`, borderRadius: mobile ? 0 : 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22, overflowY: "auto", flex: 1 }}>{children}</div>
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${T.line}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <GoldBtn ghost onClick={onClose}>Annuler</GoldBtn>
          <GoldBtn onClick={onSubmit} disabled={busy}>{busy ? <Loader2 size={15} className="spin" /> : null}{submitLabel}</GoldBtn>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ label, onCancel, onConfirm, busy, mobile }) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", backdropFilter: "blur(4px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(420px,100%)", background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12, padding: 24, textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", border: `1px solid ${T.danger}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><AlertTriangle size={22} style={{ color: T.danger }} /></div>
        <h3 style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>Confirmer la suppression</h3>
        <p style={{ color: T.textDim, fontSize: 13.5, margin: "0 0 6px" }}>Voulez-vous vraiment supprimer cette donnée ?</p>
        {label && <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: T.text, marginBottom: 18 }}>{label}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
          <GoldBtn ghost onClick={onCancel}>Annuler</GoldBtn>
          <button onClick={onConfirm} disabled={busy} style={{ fontFamily: "Space Grotesk", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 7, color: "#fff", background: T.danger, border: `1px solid ${T.danger}`, opacity: busy ? .6 : 1 }}>
            {busy ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── FORMULAIRES (création + modification) ───────── */
function ProfileForm({ initial, onClose, onSave, mobile, busy }) {
  const [f, setF] = useState(() => ({
    photo: initial?.photo ?? null,
    nom: initial?.nom ?? "", prenom: initial?.prenom ?? "", age: initial?.age && initial.age !== "—" ? initial.age : "",
    dn: initial?.dn ?? "", lieu: initial?.lieu ?? "", prof: initial?.prof ?? "",
    groupe: initial?.groupe && initial.groupe !== "—" ? initial.groupe : "", anc: initial?.anc ?? "",
    cat: initial?.cat ?? "Civil", rarete: initial?.rarete ?? "Commun", statut: initial?.statut ?? "disponible",
    cni: initial?.cni ?? true, permis: initial?.permis ?? true,
    collecte: initial?.collecte ?? new Date().toISOString().slice(0, 10), op: initial?.op ?? "Atlas",
    casier: initial?.casier && initial.casier !== "Vierge" ? initial.casier : "",
    police: initial?.police && initial.police !== "Aucun contact" ? initial.police : "",
    crime: initial?.crime && initial.crime !== "Aucune liaison" ? initial.crime : "",
    notes: initial?.notes ?? "",
  }));
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 420; let w = img.width, h = img.height;
        if (w > h && w > max) { h = h * max / w; w = max; } else if (h > max) { w = w * max / h; h = max; }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        setF((prev) => ({ ...prev, photo: c.toDataURL("image/jpeg", 0.85) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  const grid = { display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 };
  const submit = () => {
    if (!f.nom.trim() || !f.prenom.trim()) { alert("Nom et prénom obligatoires."); return; }
    onSave({ ...f, age: f.age || "—", casier: f.casier || "Vierge", police: f.police || "Aucun contact", crime: f.crime || "Aucune liaison", groupe: f.groupe || "—" }, initial?.id);
  };
  return (
    <Modal title={initial ? "Modifier le profil" : "Nouveau profil"} onClose={onClose} onSubmit={submit} submitLabel={initial ? "Enregistrer" : "Créer le dossier"} mobile={mobile} busy={busy}>
      <SectionLabel>Photo</SectionLabel>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 4 }}>
        <label style={{ cursor: "pointer", flexShrink: 0 }}>
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          {f.photo
            ? <img src={f.photo} alt="" style={{ width: 88, height: 88, borderRadius: 6, objectFit: "cover", border: `1px solid ${T.gold}66` }} />
            : <div style={{ width: 88, height: 88, borderRadius: 6, border: `1px dashed ${T.line}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.textFaint, gap: 5, background: T.bg }}>
                <Camera size={20} /><span style={{ fontSize: 8.5, fontFamily: "JetBrains Mono", letterSpacing: 1 }}>IMPORTER</span>
              </div>}
        </label>
        <div>
          <div style={{ fontSize: 13, color: T.text, marginBottom: 4 }}>Photo d'identité</div>
          <div style={{ fontSize: 11.5, color: T.textFaint, lineHeight: 1.5, maxWidth: 240 }}>Cliquez sur le cadre pour importer une image depuis l'appareil.</div>
          {f.photo && <button type="button" onClick={() => setF({ ...f, photo: null })} style={{ marginTop: 8, background: "none", border: `1px solid ${T.line}`, color: T.textDim, fontFamily: "JetBrains Mono", fontSize: 10, padding: "5px 9px", borderRadius: 5, cursor: "pointer" }}>RETIRER</button>}
        </div>
      </div>
      <SectionLabel>État civil</SectionLabel>
      <div style={grid}>
        <Field label="Nom *"><TextInput value={f.nom} onChange={up("nom")} placeholder="Vasquez" /></Field>
        <Field label="Prénom *"><TextInput value={f.prenom} onChange={up("prenom")} placeholder="Mateo" /></Field>
        <Field label="Âge"><TextInput value={f.age} onChange={up("age")} placeholder="34" /></Field>
        <Field label="Date de naissance"><input type="date" value={f.dn} onChange={up("dn")} style={{ ...inputBase, fontFamily: "JetBrains Mono", fontSize: 12 }} /></Field>
        <Field label="Lieu de naissance"><TextInput value={f.lieu} onChange={up("lieu")} placeholder="Vespucci Beach" /></Field>
        <Field label="Profession"><TextInput value={f.prof} onChange={up("prof")} placeholder="Mécanicien" /></Field>
        <Field label="Groupe éventuel"><TextInput value={f.groupe} onChange={up("groupe")} placeholder="—" /></Field>
        <Field label="Ancienneté en ville"><TextInput value={f.anc} onChange={up("anc")} placeholder="3 ans" /></Field>
      </div>
      <SectionLabel>Classification</SectionLabel>
      <div style={grid}>
        <Field label="Catégorie"><Select value={f.cat} onChange={up("cat")} options={CATS} /></Field>
        <Field label="Niveau de rareté"><Select value={f.rarete} onChange={up("rarete")} options={Object.keys(RARITY)} /></Field>
        <Field label="Statut"><Select value={f.statut} onChange={up("statut")} options={["disponible", "reserve", "vendu", "archive"]} /></Field>
        <Field label="Documents">
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><Check checked={f.cni} onChange={(v) => setF({ ...f, cni: v })} label="CNI" /></div>
            <div style={{ flex: 1 }}><Check checked={f.permis} onChange={(v) => setF({ ...f, permis: v })} label="Permis" /></div>
          </div>
        </Field>
      </div>
      <SectionLabel>Renseignement</SectionLabel>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="Casier judiciaire" full><TextInput value={f.casier} onChange={up("casier")} placeholder="Vierge" /></Field>
        <Field label="Relations avec la police" full><TextInput value={f.police} onChange={up("police")} placeholder="Aucun contact" /></Field>
        <Field label="Relations criminelles" full><TextInput value={f.crime} onChange={up("crime")} placeholder="Aucune liaison" /></Field>
        <Field label="Notes internes" full><Area value={f.notes} onChange={up("notes")} placeholder="Observations opérationnelles…" /></Field>
      </div>
      <SectionLabel>Traçabilité</SectionLabel>
      <div style={grid}>
        <Field label="Date de collecte"><input type="date" value={f.collecte} onChange={up("collecte")} style={{ ...inputBase, fontFamily: "JetBrains Mono", fontSize: 12 }} /></Field>
        <Field label="Opérateur"><TextInput value={f.op} onChange={up("op")} /></Field>
      </div>
    </Modal>
  );
}

function ClientForm({ initial, onClose, onSave, mobile, busy }) {
  const [f, setF] = useState(() => ({ groupe: initial?.groupe ?? "", type: initial?.type ?? "Gang", contact: initial?.contact ?? "", tel: initial?.tel ?? "", conf: initial?.conf ?? "Moyen" }));
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const grid = { display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 };
  const submit = () => { if (!f.groupe.trim()) { alert("Nom du groupe obligatoire."); return; } onSave(f, initial?.id); };
  return (
    <Modal title={initial ? "Modifier le client" : "Nouveau client"} onClose={onClose} onSubmit={submit} submitLabel={initial ? "Enregistrer" : "Ajouter le client"} mobile={mobile} busy={busy}>
      <div style={grid}>
        <Field label="Nom du groupe *"><TextInput value={f.groupe} onChange={up("groupe")} placeholder="Los Santos Vagos" /></Field>
        <Field label="Type du groupe"><Select value={f.type} onChange={up("type")} options={[...CATS, "Inconnu"]} /></Field>
        <Field label="Contact principal"><TextInput value={f.contact} onChange={up("contact")} placeholder="El Jefe" /></Field>
        <Field label="Téléphone"><TextInput value={f.tel} onChange={up("tel")} placeholder="555-0142" /></Field>
        <Field label="Niveau de confiance"><Select value={f.conf} onChange={up("conf")} options={["Faible", "Moyen", "Élevé", "Vérifié"]} /></Field>
      </div>
    </Modal>
  );
}

function SaleForm({ initial, onClose, onSave, clients, mobile, busy }) {
  const [f, setF] = useState(() => ({ date: initial?.date ?? new Date().toISOString().slice(0, 10), client: initial?.client ?? (clients[0]?.groupe || ""), type: initial?.type ?? "Catalogue", prix: initial?.prix != null ? String(initial.prix) : "", resp: initial?.resp ?? "Atlas", statut: initial?.statut ?? "Réglée" }));
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const grid = { display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 };
  const submit = () => {
    if (!f.client.trim()) { alert("Sélectionnez ou saisissez un client."); return; }
    if (!f.prix || isNaN(+f.prix)) { alert("Prix invalide."); return; }
    onSave({ ...f, prix: +f.prix }, initial?.id);
  };
  return (
    <Modal title={initial ? "Modifier la vente" : "Nouvelle vente"} onClose={onClose} onSubmit={submit} submitLabel={initial ? "Enregistrer" : "Enregistrer la vente"} mobile={mobile} busy={busy}>
      <div style={grid}>
        <Field label="Date"><input type="date" value={f.date} onChange={up("date")} style={{ ...inputBase, fontFamily: "JetBrains Mono", fontSize: 12 }} /></Field>
        <Field label="Client">{clients.length ? <Select value={f.client} onChange={up("client")} options={clients.map((c) => c.groupe)} /> : <TextInput value={f.client} onChange={up("client")} placeholder="Nom du client" />}</Field>
        <Field label="Type de vente"><Select value={f.type} onChange={up("type")} options={["Catalogue", "Sur-Mesure"]} /></Field>
        <Field label="Prix ($)"><TextInput value={f.prix} onChange={up("prix")} placeholder="22000" inputMode="numeric" /></Field>
        <Field label="Responsable"><TextInput value={f.resp} onChange={up("resp")} /></Field>
        <Field label="Statut"><Select value={f.statut} onChange={up("statut")} options={["Réglée", "Acompte", "Litige"]} /></Field>
      </div>
    </Modal>
  );
}

/* ───────── FICHE PROFIL ───────── */
function ProfileSheet({ p, onClose, onEdit, onDelete, mobile }) {
  const cat = CAT_META[p.cat] || CAT_META.Civil; const CatIcon = cat.icon; const r = RARITY[p.rarete] || RARITY.Commun;
  const Row = ({ icon: Ic, label, value, danger }) => (
    <div style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: `1px solid ${T.lineSoft}` }}>
      <Ic size={15} style={{ color: T.textFaint, marginTop: 1, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 9.5, letterSpacing: 1, color: T.textFaint, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 13.5, color: danger ? T.danger : T.text, lineHeight: 1.45 }}>{value || "—"}</div>
      </div>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: mobile ? "100%" : "min(560px,100%)", height: "100%", background: T.panel, borderLeft: `1px solid ${T.line}`, overflowY: "auto", animation: "slideIn .28s ease" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: T.panel, borderBottom: `1px solid ${T.line}`, padding: "18px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: T.gold, letterSpacing: 2 }}>DOSSIER {p.ref}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer" }}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Avatar p={p} size={84} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 600, margin: 0 }}>{p.prenom} {p.nom}</h2>
              <div style={{ fontSize: 13, color: T.textDim, margin: "3px 0 10px" }}>{p.age} ans · {p.prof || "—"}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge color={catColor(p.cat)}><CatIcon size={9} style={{ verticalAlign: -1, marginRight: 3 }} />{p.cat.toUpperCase()}</Badge>
                <Badge color={r.c} solid={r.solid}>{r.label}</Badge>
                <Badge color={STATUS[p.statut].c}>{STATUS[p.statut].label}</Badge>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <GoldBtn ghost onClick={() => onEdit(p)}><Pencil size={14} />Modifier</GoldBtn>
            <button onClick={() => onDelete(p)} style={{ fontFamily: "Space Grotesk", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 7, color: T.danger, background: "transparent", border: `1px solid ${T.danger}55` }}><Trash2 size={14} />Supprimer</button>
          </div>
        </div>
        <div style={{ padding: "8px 22px 40px" }}>
          <SectionLabel>Documents</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <DocChip icon={CreditCard} label="Carte d'identité" ok={p.cni} />
            <DocChip icon={Car} label="Permis de conduire" ok={p.permis} />
          </div>
          <SectionLabel>État civil</SectionLabel>
          <Row icon={Fingerprint} label="Nom / Prénom" value={`${p.nom.toUpperCase()} ${p.prenom}`} />
          <Row icon={Calendar} label="Date de naissance" value={p.dn} />
          <Row icon={MapPin} label="Lieu de naissance" value={p.lieu} />
          <Row icon={Briefcase} label="Profession" value={p.prof} />
          <Row icon={Clock} label="Ancienneté en ville" value={p.anc} />
          <Row icon={Users} label="Groupe" value={p.groupe} />
          <SectionLabel>Renseignement</SectionLabel>
          <Row icon={FileText} label="Casier judiciaire" value={p.casier} danger={p.casier && p.casier !== "Vierge"} />
          <Row icon={ShieldAlert} label="Relations avec la police" value={p.police} />
          <Row icon={Skull} label="Relations criminelles" value={p.crime} />
          <SectionLabel>Traçabilité</SectionLabel>
          <Row icon={Calendar} label="Date de collecte" value={p.collecte} />
          <Row icon={UserCog} label="Opérateur" value={p.op} />
          <SectionLabel>Notes internes</SectionLabel>
          <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 6, padding: 14, fontSize: 13, color: T.textDim, lineHeight: 1.55, fontStyle: "italic" }}>{p.notes || "Aucune note."}</div>
        </div>
      </div>
    </div>
  );
}
const DocChip = ({ icon: Ic, label, ok }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", borderRadius: 6, background: T.bg, border: `1px solid ${ok ? T.gold + "55" : T.line}` }}>
    <Ic size={17} style={{ color: ok ? T.gold : T.textFaint }} />
    <div>
      <div style={{ fontSize: 12.5, color: T.text }}>{label}</div>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, letterSpacing: 1, color: ok ? T.gold : T.textFaint }}>{ok ? "EN STOCK" : "MANQUANT"}</div>
    </div>
  </div>
);

function ProfileCard({ p, onClick }) {
  const cat = CAT_META[p.cat] || CAT_META.Civil; const CatIcon = cat.icon; const r = RARITY[p.rarete] || RARITY.Commun;
  return (
    <div onClick={onClick} className="pcard" style={{ display: "flex", background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, overflow: "hidden", cursor: "pointer" }}>
      <RarityBar rarete={p.rarete} />
      <div style={{ display: "flex", gap: 13, padding: 14, flex: 1, minWidth: 0 }}>
        <Avatar p={p} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "Space Grotesk", fontSize: 15.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.prenom} {p.nom}</div>
              <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 1 }}>{p.age} ans · {p.prof || "—"}</div>
            </div>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.textFaint, whiteSpace: "nowrap" }}>{p.ref}</span>
          </div>
          <div style={{ fontSize: 11, color: T.textFaint, margin: "7px 0 9px", display: "flex", alignItems: "center", gap: 5 }}>
            <CatIcon size={11} style={{ color: catColor(p.cat) }} />{p.groupe !== "—" ? p.groupe : "Sans affiliation"}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge color={r.c} solid={r.solid}>{r.label}</Badge>
            <Badge color={STATUS[p.statut].c}>{STATUS[p.statut].label}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Ic, label, value, gold, sub }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: 1, color: T.textDim, textTransform: "uppercase", lineHeight: 1.3, maxWidth: 140 }}>{label}</span>
        {Ic && <Ic size={16} style={{ color: T.textFaint }} />}
      </div>
      <div style={{ fontFamily: "Space Grotesk", fontSize: 28, fontWeight: 600, color: gold ? T.gold : T.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textFaint, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
const Split = ({ label, pct, val }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: T.text }}>{label} <span style={{ color: T.textFaint, fontFamily: "JetBrains Mono", fontSize: 11 }}>{pct}%</span></span>
      <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: T.gold, fontWeight: 600 }}>{fmt(val)}</span>
    </div>
    <div style={{ height: 8, background: T.bg, borderRadius: 4, overflow: "hidden", border: `1px solid ${T.lineSoft}` }}>
      <div style={{ width: pct + "%", height: "100%", background: pct === 60 ? T.gold : T.goldSoft, borderRadius: 4 }} />
    </div>
  </div>
);

/* ───────── VUES ───────── */
function Dashboard({ profiles, clients, sales, openAdd }) {
  const dispo = profiles.filter((p) => p.statut === "disponible");
  const inStock = profiles.filter((p) => ["disponible", "reserve"].includes(p.statut));
  const cni = inStock.filter((p) => p.cni).length, permis = inStock.filter((p) => p.permis).length;
  const rares = dispo.filter((p) => ["Rare", "Très rare", "Légendaire"].includes(p.rarete)).length;
  const lspd = dispo.filter((p) => p.cat === "LSPD").length, sahp = dispo.filter((p) => p.cat === "SAHP").length, poli = dispo.filter((p) => p.cat === "Politicien").length;
  const ym = new Date().toISOString().slice(0, 7);
  const moisVentes = sales.filter((s) => (s.date || "").startsWith(ym));
  const revenuMois = moisVentes.reduce((a, s) => a + Number(s.prix || 0), 0);
  const caTotal = sales.reduce((a, s) => a + Number(s.prix || 0), 0);
  const byMonth = useMemo(() => {
    const m = {}; sales.forEach((s) => { const k = (s.date || "").slice(0, 7); if (k) m[k] = (m[k] || 0) + Number(s.prix || 0); });
    return Object.keys(m).sort().slice(-6).map((k) => ({ mois: k.slice(5) + "/" + k.slice(2, 4), ca: m[k] }));
  }, [sales]);

  if (!profiles.length && !sales.length && !clients.length)
    return <Empty action={<GoldBtn onClick={() => openAdd("profile")}><Plus size={15} />Créer le premier profil</GoldBtn>}>Aucune donnée pour l'instant. Commencez par enregistrer un profil dans le stock d'identités.</Empty>;

  return (
    <div>
      <SectionLabel>Statistiques globales</SectionLabel>
      <div className="grid-stat" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 22 }}>
        <Stat icon={Fingerprint} label="Identités enregistrées" value={profiles.length} gold />
        <Stat icon={Users} label="Clients" value={clients.length} />
        <Stat icon={Receipt} label="Ventes" value={sales.length} />
        <Stat icon={Banknote} label="Chiffre d'affaires total" value={fmt(caTotal)} gold />
      </div>

      <SectionLabel>Stock opérationnel</SectionLabel>
      <div className="grid-stat" style={{ marginBottom: 20 }}>
        <Stat icon={CreditCard} label="Cartes d'identité en stock" value={cni} gold />
        <Stat icon={Car} label="Permis de conduire en stock" value={permis} gold />
        <Stat icon={Star} label="Profils rares disponibles" value={rares} sub="Rare → Légendaire" />
        <Stat icon={ShieldAlert} label="Profils LSPD disponibles" value={lspd} />
        <Stat icon={ShieldAlert} label="Profils SAHP disponibles" value={sahp} />
        <Stat icon={Crown} label="Profils politiques disponibles" value={poli} />
      </div>
      <div className="grid-2col">
        <div>
          <SectionLabel>Activité financière — ce mois</SectionLabel>
          <div className="grid-stat" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Stat icon={Receipt} label="Ventes du mois" value={moisVentes.length} />
            <Stat icon={Banknote} label="Revenus du mois" value={fmt(revenuMois)} gold />
          </div>
          <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, padding: 18, marginTop: 12 }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: 1, color: T.textDim, marginBottom: 14 }}>RÉPARTITION DES REVENUS (MOIS)</div>
            <Split label="Famille" pct={60} val={Math.round(revenuMois * 0.6)} />
            <Split label="Réinvestissement business" pct={40} val={Math.round(revenuMois * 0.4)} />
          </div>
        </div>
        <div>
          <SectionLabel>Chiffre d'affaires mensuel</SectionLabel>
          <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, padding: "20px 14px 8px", height: 256 }}>
            {byMonth.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <XAxis dataKey="mois" tick={{ fill: T.textDim, fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: T.line }} tickLine={false} />
                  <YAxis tick={{ fill: T.textFaint, fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + v / 1000 + "k"} width={42} />
                  <Tooltip cursor={{ fill: "rgba(201,168,76,.06)" }} contentStyle={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 12 }} labelStyle={{ color: T.gold }} formatter={(v) => [fmt(v), "CA"]} />
                  <Bar dataKey="ca" radius={[3, 3, 0, 0]}>{byMonth.map((_, i) => <Cell key={i} fill={i === byMonth.length - 1 ? T.gold : T.goldSoft} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.textFaint, fontSize: 13 }}>Aucune vente enregistrée.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stock({ profiles, go, openAdd }) {
  const [cat, setCat] = useState("Tous"); const [stat, setStat] = useState("Tous");
  const inStock = profiles.filter((p) => ["disponible", "reserve"].includes(p.statut));
  const counts = { cni: inStock.filter((p) => p.cni).length, permis: inStock.filter((p) => p.permis).length, dispo: profiles.filter((p) => p.statut === "disponible").length, vendu: profiles.filter((p) => p.statut === "vendu").length, archive: profiles.filter((p) => p.statut === "archive").length };
  const list = profiles.filter((p) => (cat === "Tous" || p.cat === cat) && (stat === "Tous" || p.statut === stat));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><GoldBtn onClick={() => openAdd("profile")}><Plus size={15} />Nouveau profil</GoldBtn></div>
      <div className="grid-stat5" style={{ marginBottom: 22 }}>
        <Stat icon={CreditCard} label="Cartes d'identité" value={counts.cni} gold />
        <Stat icon={Car} label="Permis de conduire" value={counts.permis} gold />
        <Stat icon={Circle} label="Profils disponibles" value={counts.dispo} />
        <Stat icon={Receipt} label="Profils vendus" value={counts.vendu} />
        <Stat icon={Archive} label="Profils archivés" value={counts.archive} />
      </div>
      {profiles.length === 0 ? (
        <Empty action={<GoldBtn onClick={() => openAdd("profile")}><Plus size={15} />Nouveau profil</GoldBtn>}>Le stock est vide. Ajoutez votre premier dossier d'identité.</Empty>
      ) : (<>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>{["Tous", ...CATS].map((c) => <Chip key={c} active={cat === c} gold={c === "Tous" || CAT_META[c]?.gold} onClick={() => setCat(c)}>{c}</Chip>)}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>{["Tous", "disponible", "reserve", "vendu", "archive"].map((s) => <Chip key={s} active={stat === s} gold={s === "Tous"} onClick={() => setStat(s)}>{s === "Tous" ? "Tous statuts" : STATUS[s].label}</Chip>)}</div>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: T.textFaint, marginBottom: 12 }}>{list.length} PROFIL(S)</div>
        <div className="grid-cards">{list.map((p) => <ProfileCard key={p.id} p={p} onClick={() => go("_open", p)} />)}</div>
        {list.length === 0 && <Empty>Aucun profil ne correspond à ce filtre.</Empty>}
      </>)}
    </div>
  );
}

function Clients({ clients, sales, openAdd, onEdit, onDelete }) {
  const confColor = { "Élevé": T.gold, "Vérifié": T.gold, "Moyen": T.text, "Faible": T.danger };
  const enriched = clients.map((c) => { const cs = sales.filter((s) => s.client === c.groupe); return { ...c, tx: cs.length, ca: cs.reduce((a, s) => a + Number(s.prix || 0), 0) }; });
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <SectionLabel>Base clients · {clients.length}</SectionLabel>
        <div style={{ flexShrink: 0 }}><GoldBtn onClick={() => openAdd("client")}><Plus size={15} />Nouveau client</GoldBtn></div>
      </div>
      {clients.length === 0 ? (
        <Empty action={<GoldBtn onClick={() => openAdd("client")}><Plus size={15} />Nouveau client</GoldBtn>}>Aucun client enregistré.</Empty>
      ) : (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.line}` }}>{["Groupe", "Type", "Contact", "Téléphone", "Transactions", "Volume", "Confiance", ""].map((h, i) => <th key={i} style={{ textAlign: i > 3 && i < 7 ? "right" : "left", padding: "12px 16px", fontFamily: "JetBrains Mono", fontSize: 9.5, letterSpacing: 1, color: T.textDim, fontWeight: 500 }}>{h.toUpperCase()}</th>)}</tr></thead>
            <tbody>{enriched.map((c) => (
              <tr key={c.id} className="trow" style={{ borderBottom: `1px solid ${T.lineSoft}` }}>
                <td style={{ padding: "13px 16px", fontSize: 13.5, fontWeight: 500 }}>{c.groupe}</td>
                <td style={{ padding: "13px 16px" }}><Badge color={CAT_META[c.type]?.gold ? T.gold : T.textDim}>{c.type}</Badge></td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: T.textDim }}>{c.contact || "—"}</td>
                <td style={{ padding: "13px 16px", fontFamily: "JetBrains Mono", fontSize: 12.5, color: T.textDim }}>{c.tel || "—"}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 13 }}>{c.tx}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 13, color: T.gold }}>{fmt(c.ca)}</td>
                <td style={{ padding: "13px 16px", textAlign: "right" }}><Badge color={confColor[c.conf]}>{(c.conf || "").toUpperCase()}</Badge></td>
                <td style={{ padding: "13px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", gap: 6 }}>
                    <IconBtn icon={Pencil} title="Modifier" onClick={() => onEdit(c)} />
                    <IconBtn icon={Trash2} title="Supprimer" danger onClick={() => onDelete(c)} />
                  </span>
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Sales({ sales, openAdd, onEdit, onDelete }) {
  const statColor = { "Réglée": T.gold, "Acompte": T.text, "Litige": T.danger };
  const total = sales.reduce((a, s) => a + Number(s.prix || 0), 0);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><GoldBtn onClick={() => openAdd("sale")}><Plus size={15} />Nouvelle vente</GoldBtn></div>
      <div className="grid-stat" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 22 }}>
        <Stat icon={Receipt} label="Transactions" value={sales.length} />
        <Stat icon={Banknote} label="Volume total" value={fmt(total)} gold />
        <Stat icon={TrendingUp} label="Panier moyen" value={fmt(sales.length ? Math.round(total / sales.length) : 0)} />
      </div>
      {sales.length > 0 && (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, padding: 18, marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: 1, color: T.textDim }}>RÉPARTITION DES REVENUS</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: T.gold }}>{fmt(total)}</span>
          </div>
          <Split label="Famille" pct={60} val={Math.round(total * 0.6)} />
          <Split label="Réinvestissement business" pct={40} val={Math.round(total * 0.4)} />
        </div>
      )}
      <SectionLabel>Historique des ventes</SectionLabel>
      {sales.length === 0 ? (
        <Empty action={<GoldBtn onClick={() => openAdd("sale")}><Plus size={15} />Nouvelle vente</GoldBtn>}>Aucune vente enregistrée.</Empty>
      ) : (
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.line}` }}>{["Réf", "Date", "Client", "Type", "Prix", "Responsable", "Statut", ""].map((h, i) => <th key={i} style={{ textAlign: i === 4 ? "right" : "left", padding: "12px 16px", fontFamily: "JetBrains Mono", fontSize: 9.5, letterSpacing: 1, color: T.textDim, fontWeight: 500 }}>{h.toUpperCase()}</th>)}</tr></thead>
            <tbody>{[...sales].reverse().map((s) => (
              <tr key={s.id} className="trow" style={{ borderBottom: `1px solid ${T.lineSoft}` }}>
                <td style={{ padding: "13px 16px", fontFamily: "JetBrains Mono", fontSize: 11.5, color: T.textFaint }}>{s.ref}</td>
                <td style={{ padding: "13px 16px", fontFamily: "JetBrains Mono", fontSize: 12.5, color: T.textDim }}>{s.date}</td>
                <td style={{ padding: "13px 16px", fontSize: 13.5 }}>{s.client}</td>
                <td style={{ padding: "13px 16px" }}><Badge color={s.type === "Sur-Mesure" ? T.gold : T.textDim}>{(s.type || "").toUpperCase()}</Badge></td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "JetBrains Mono", fontSize: 13, color: T.gold }}>{fmt(s.prix)}</td>
                <td style={{ padding: "13px 16px", fontFamily: "JetBrains Mono", fontSize: 12.5, color: T.textDim }}>{s.resp}</td>
                <td style={{ padding: "13px 16px" }}><Badge color={statColor[s.statut]}>{(s.statut || "").toUpperCase()}</Badge></td>
                <td style={{ padding: "13px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", gap: 6 }}>
                    <IconBtn icon={Pencil} title="Modifier" onClick={() => onEdit(s)} />
                    <IconBtn icon={Trash2} title="Supprimer" danger onClick={() => onDelete(s)} />
                  </span>
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdvancedSearch({ profiles, go, mobile }) {
  const [q, setQ] = useState(""); const [prof, setProf] = useState("");
  const [groupe, setGroupe] = useState("Tous"); const [cat, setCat] = useState("Tous");
  const [rar, setRar] = useState("Tous"); const [from, setFrom] = useState("");
  const groupes = ["Tous", ...Array.from(new Set(profiles.map((p) => p.groupe))).filter((g) => g && g !== "—")];
  const res = profiles.filter((p) => (q === "" || `${p.prenom} ${p.nom}`.toLowerCase().includes(q.toLowerCase())) && (prof === "" || (p.prof || "").toLowerCase().includes(prof.toLowerCase())) && (groupe === "Tous" || p.groupe === groupe) && (cat === "Tous" || p.cat === cat) && (rar === "Tous" || p.rarete === rar) && (from === "" || (p.collecte || "") >= from));
  return (
    <div>
      <SectionLabel>Recherche avancée</SectionLabel>
      <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, padding: 20, marginBottom: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
          <Field label="Par nom"><TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou prénom…" /></Field>
          <Field label="Par métier"><TextInput value={prof} onChange={(e) => setProf(e.target.value)} placeholder="Profession…" /></Field>
          <Field label="Par groupe"><Select value={groupe} onChange={(e) => setGroupe(e.target.value)} options={groupes} /></Field>
          <Field label="Par catégorie"><Select value={cat} onChange={(e) => setCat(e.target.value)} options={["Tous", ...CATS]} /></Field>
          <Field label="Par rareté"><Select value={rar} onChange={(e) => setRar(e.target.value)} options={["Tous", ...Object.keys(RARITY)]} /></Field>
          <Field label="Collecté à partir du"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ ...inputBase, fontFamily: "JetBrains Mono", fontSize: 12 }} /></Field>
        </div>
      </div>
      {profiles.length === 0 ? <Empty>Aucun profil à rechercher pour l'instant.</Empty> : <>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: T.textFaint, marginBottom: 12 }}>{res.length} RÉSULTAT(S)</div>
        <div className="grid-cards">{res.map((p) => <ProfileCard key={p.id} p={p} onClick={() => go("_open", p)} />)}</div>
        {res.length === 0 && <Empty>Aucun profil ne correspond à ces critères.</Empty>}
      </>}
    </div>
  );
}

function Intelligence() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 20px", border: `1px dashed ${T.line}`, borderRadius: 12 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", border: `1px solid ${T.gold}44`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}><Lock size={26} style={{ color: T.gold }} /></div>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, letterSpacing: 3, color: T.gold, marginBottom: 10 }}>MODULE VERROUILLÉ</div>
      <h2 style={{ fontFamily: "Space Grotesk", fontSize: 26, fontWeight: 600, margin: "0 0 10px" }}>Agence de renseignement</h2>
      <p style={{ color: T.textDim, fontSize: 14, maxWidth: 440, lineHeight: 1.6, margin: 0 }}>Section réservée à un développement ultérieur. Activation prévue dans une prochaine phase.</p>
    </div>
  );
}

/* ───────── PAGE DE CONNEXION ───────── */
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setErr(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: resolveEmail(username), password });
    setBusy(false);
    if (error) setErr("Identifiants invalides.");
  };
  const onKey = (e) => { if (e.key === "Enter") submit(); };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Space Grotesk", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "min(400px,100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={LOGO} alt="Black Meridian" style={{ width: 92, height: 92, objectFit: "contain", marginBottom: 16 }} />
          <div style={{ fontFamily: "Space Grotesk", fontSize: 24, fontWeight: 700, letterSpacing: 3 }}>BLACK MERIDIAN</div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, letterSpacing: 4, color: T.gold, marginTop: 6 }}>IDENTITY BUSINESS</div>
        </div>
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Nom d'utilisateur"><TextInput value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={onKey} placeholder="Black Meridian V7" autoFocus /></Field>
            <Field label="Mot de passe"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKey} placeholder="••••••••" style={inputBase} /></Field>
            {err && <div style={{ color: T.danger, fontSize: 12.5, fontFamily: "JetBrains Mono" }}>{err}</div>}
            <button onClick={submit} disabled={busy} style={{ marginTop: 4, fontFamily: "Space Grotesk", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 15px", borderRadius: 8, color: T.bg, background: T.gold, border: "none", opacity: busy ? .7 : 1 }}>
              {busy ? <Loader2 size={16} className="spin" /> : <Lock size={15} />}Connexion
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 18, fontFamily: "JetBrains Mono", fontSize: 9.5, letterSpacing: 1, color: T.textFaint }}>ACCÈS RÉSERVÉ · SESSION CHIFFRÉE</div>
      </div>
    </div>
  );
}

/* ───────── ÉCRAN DE CONFIGURATION (env manquant) ───────── */
function ConfigNotice() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Space Grotesk", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", border: `1px solid ${T.gold}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><Database size={26} style={{ color: T.gold }} /></div>
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 600, margin: "0 0 12px" }}>Configuration Supabase requise</h2>
        <p style={{ color: T.textDim, fontSize: 14, lineHeight: 1.6 }}>Définis les variables d'environnement <b>VITE_SUPABASE_URL</b> et <b>VITE_SUPABASE_ANON_KEY</b> (fichier <code>.env</code> en local, ou Project Settings → Environment Variables sur Vercel), puis relance/redeploie.</p>
        <p style={{ color: T.textFaint, fontSize: 12.5, marginTop: 14 }}>Voir le README et le fichier supabase_schema.sql fournis.</p>
      </div>
    </div>
  );
}

/* ───────── SHELL APP ───────── */
const NAV = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "stock", label: "Stock d'identités", icon: Archive },
  { id: "search", label: "Recherche avancée", icon: Search },
  { id: "clients", label: "Gestion des clients", icon: Users },
  { id: "sales", label: "Historique des ventes", icon: Receipt },
];
const titles = { dashboard: "Tableau de bord", stock: "Stock d'identités", search: "Recherche avancée", clients: "Gestion des clients", sales: "Historique des ventes", intel: "Agence de renseignement" };

function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < 760 : false);
  useEffect(() => { const f = () => setM(window.innerWidth < 760); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return m;
}

function MainApp({ session }) {
  const mobile = useIsMobile();
  const [view, setView] = useState("dashboard");
  const [open, setOpen] = useState(null);
  const [modal, setModal] = useState(null); // { type, data }
  const [confirm, setConfirm] = useState(null); // { kind, id, label }
  const [busy, setBusy] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from("identities").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
  }, []);
  const fetchClients = useCallback(async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: true });
    if (data) setClients(data);
  }, []);
  const fetchSales = useCallback(async () => {
    const { data } = await supabase.from("sales").select("*").order("created_at", { ascending: true });
    if (data) setSales(data.map((s) => ({ ...s, prix: Number(s.prix || 0) })));
  }, []);

  useEffect(() => {
    fetchProfiles(); fetchClients(); fetchSales();
    const ch = supabase.channel("registre-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "identities" }, fetchProfiles)
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, fetchClients)
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, fetchSales)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchProfiles, fetchClients, fetchSales]);

  const go = (v, payload) => { if (v === "_open") { setOpen(payload); return; } setView(v); setOpen(null); };
  const openAdd = (type) => setModal({ type, data: null });

  /* CRUD */
  const saveProfile = async (values, id) => {
    setBusy(true);
    if (id) await supabase.from("identities").update(values).eq("id", id);
    else await supabase.from("identities").insert({ ...values, ref: "ID-" + pad(481 + profiles.length, 4) });
    await fetchProfiles(); setBusy(false); setModal(null); if (!id) setView("stock");
  };
  const saveClient = async (values, id) => {
    setBusy(true);
    if (id) await supabase.from("clients").update(values).eq("id", id);
    else await supabase.from("clients").insert({ ...values, ref: "C-" + pad(1 + clients.length, 3) });
    await fetchClients(); setBusy(false); setModal(null);
  };
  const saveSale = async (values, id) => {
    setBusy(true);
    if (id) await supabase.from("sales").update(values).eq("id", id);
    else await supabase.from("sales").insert({ ...values, ref: "V-" + pad(1001 + sales.length, 4) });
    await fetchSales(); setBusy(false); setModal(null);
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    const tbl = confirm.kind === "identity" ? "identities" : confirm.kind === "client" ? "clients" : "sales";
    await supabase.from(tbl).delete().eq("id", confirm.id);
    if (confirm.kind === "identity") { await fetchProfiles(); setOpen(null); }
    if (confirm.kind === "client") await fetchClients();
    if (confirm.kind === "sale") await fetchSales();
    setBusy(false); setConfirm(null);
  };

  const NavBtn = ({ n }) => {
    const active = view === n.id;
    return <button onClick={() => go(n.id)} className="navbtn" style={{ display: "flex", alignItems: "center", gap: 11, padding: mobile ? "9px 13px" : "10px 12px", marginBottom: mobile ? 0 : 3, borderRadius: 7, border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "Space Grotesk", fontSize: 13.5, fontWeight: active ? 600 : 400, color: active ? T.bg : T.textDim, background: active ? T.gold : "transparent" }}><n.icon size={17} />{n.label}</button>;
  };
  const Brand = ({ size = 36 }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <img src={LOGO} alt="logo" style={{ width: size, height: size, objectFit: "contain" }} />
      <div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 15, fontWeight: 700, letterSpacing: 1.5, lineHeight: 1 }}>BLACK MERIDIAN</div>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 8.5, letterSpacing: 1.5, color: T.gold, marginTop: 3 }}>IDENTITY BUSINESS</div>
      </div>
    </div>
  );
  const userLabel = session?.user?.email || "Opérateur";

  return (
    <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Space Grotesk" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; } body { margin: 0; background: ${T.bg}; }
        .pcard { transition: border-color .18s, transform .18s; }
        .pcard:hover { border-color: ${T.gold}66; transform: translateY(-2px); }
        .trow:hover { background: ${T.panel2}; }
        .navbtn:hover { background: ${T.panel2}; }
        ::-webkit-scrollbar { width: 9px; height: 9px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 5px; }
        input::placeholder, textarea::placeholder { color: ${T.textFaint}; }
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .spin { animation: spin 1s linear infinite; }
        .grid-stat { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .grid-stat5 { display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; }
        .grid-cards { display: grid; grid-template-columns: repeat(auto-fill,minmax(290px,1fr)); gap: 12px; }
        .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
        @media (max-width: 1100px){ .grid-stat,.grid-stat5{ grid-template-columns: repeat(2,1fr);} .grid-2col{ grid-template-columns: 1fr;} }
        @media (max-width: 760px){ .grid-stat,.grid-stat5{ grid-template-columns: 1fr;} .grid-cards{ grid-template-columns: 1fr;} }
      `}</style>

      {!mobile && (
        <aside style={{ width: 248, flexShrink: 0, background: T.panel, borderRight: `1px solid ${T.line}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${T.line}` }}><Brand /></div>
          <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
            {NAV.map((n) => <NavBtn key={n.id} n={n} />)}
            <div style={{ height: 1, background: T.line, margin: "14px 8px" }} />
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 8.5, letterSpacing: 1.5, color: T.textFaint, padding: "0 12px 8px" }}>À VENIR</div>
            <button onClick={() => setView("intel")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 7, border: `1px solid ${view === "intel" ? T.gold + "44" : "transparent"}`, cursor: "pointer", textAlign: "left", fontFamily: "Space Grotesk", fontSize: 13.5, color: T.textFaint, background: "transparent" }}>
              <Lock size={16} />Agence de renseignement
              <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono", fontSize: 8, letterSpacing: 1, color: T.gold, border: `1px solid ${T.gold}44`, borderRadius: 3, padding: "2px 5px" }}>SOON</span>
            </button>
          </nav>
          <div style={{ padding: 14, borderTop: `1px solid ${T.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.panel2, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono", fontSize: 11, color: T.gold, fontWeight: 600 }}>BM</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userLabel}</div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: T.gold, display: "inline-block" }} />SESSION ACTIVE</div>
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "8px", borderRadius: 7, border: `1px solid ${T.line}`, background: "transparent", color: T.textDim, fontFamily: "Space Grotesk", fontSize: 12.5, cursor: "pointer" }}><LogOut size={14} />Déconnexion</button>
          </div>
        </aside>
      )}

      {mobile && (
        <header style={{ position: "sticky", top: 0, zIndex: 20, background: T.panel, borderBottom: `1px solid ${T.line}` }}>
          <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Brand size={30} />
            <button onClick={() => supabase.auth.signOut()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.line}`, background: "transparent", color: T.textDim, fontFamily: "Space Grotesk", fontSize: 12, cursor: "pointer" }}><LogOut size={14} /></button>
          </div>
          <div style={{ display: "flex", gap: 6, padding: "0 12px 12px", overflowX: "auto" }}>
            {NAV.map((n) => <NavBtn key={n.id} n={n} />)}
            <button onClick={() => setView("intel")} className="navbtn" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 7, border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "Space Grotesk", fontSize: 13.5, color: T.textFaint, background: "transparent" }}><Lock size={15} />Renseignement</button>
          </div>
        </header>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {!mobile && (
          <header style={{ padding: "18px 28px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(10,10,11,.85)", backdropFilter: "blur(8px)", zIndex: 10 }}>
            <div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9.5, letterSpacing: 2, color: T.textFaint, marginBottom: 3 }}>MODULE ACTIF</div>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: 21, fontWeight: 600, margin: 0 }}>{titles[view]}</h1>
            </div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: T.textDim, textAlign: "right" }}>
              <div>{profiles.filter((p) => p.statut === "disponible").length} profils en stock</div>
              <div style={{ color: T.gold }}>SECTEUR LOS SANTOS</div>
            </div>
          </header>
        )}
        {mobile && <div style={{ padding: "16px 16px 0" }}><h1 style={{ fontFamily: "Space Grotesk", fontSize: 19, fontWeight: 600, margin: 0 }}>{titles[view]}</h1></div>}

        <main style={{ flex: 1, padding: mobile ? "16px 16px 80px" : "26px 28px 60px", maxWidth: 1320, width: "100%" }}>
          {view === "dashboard" && <Dashboard profiles={profiles} clients={clients} sales={sales} openAdd={openAdd} />}
          {view === "stock" && <Stock profiles={profiles} go={go} openAdd={openAdd} />}
          {view === "search" && <AdvancedSearch profiles={profiles} go={go} mobile={mobile} />}
          {view === "clients" && <Clients clients={clients} sales={sales} openAdd={openAdd} onEdit={(c) => setModal({ type: "client", data: c })} onDelete={(c) => setConfirm({ kind: "client", id: c.id, label: c.groupe })} />}
          {view === "sales" && <Sales sales={sales} openAdd={openAdd} onEdit={(s) => setModal({ type: "sale", data: s })} onDelete={(s) => setConfirm({ kind: "sale", id: s.id, label: `${s.ref} · ${s.client}` })} />}
          {view === "intel" && <Intelligence />}
        </main>
      </div>

      {open && <ProfileSheet p={open} onClose={() => setOpen(null)} mobile={mobile} onEdit={(p) => { setModal({ type: "profile", data: p }); setOpen(null); }} onDelete={(p) => setConfirm({ kind: "identity", id: p.id, label: `${p.prenom} ${p.nom}` })} />}
      {modal?.type === "profile" && <ProfileForm initial={modal.data} onClose={() => setModal(null)} onSave={saveProfile} mobile={mobile} busy={busy} />}
      {modal?.type === "client" && <ClientForm initial={modal.data} onClose={() => setModal(null)} onSave={saveClient} mobile={mobile} busy={busy} />}
      {modal?.type === "sale" && <SaleForm initial={modal.data} onClose={() => setModal(null)} onSave={saveSale} clients={clients} mobile={mobile} busy={busy} />}
      {confirm && <ConfirmDelete label={confirm.label} onCancel={() => setConfirm(null)} onConfirm={doDelete} busy={busy} mobile={mobile} />}
    </div>
  );
}

/* ───────── RACINE ───────── */
export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isConfigured) return <ConfigNotice />;
  if (session === undefined) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={26} className="spin" style={{ color: T.gold }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style></div>;
  if (!session) return <Login />;
  return <MainApp session={session} />;
}
