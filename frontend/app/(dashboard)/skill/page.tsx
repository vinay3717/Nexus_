"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const PRESET_SKILLS = [
  { id: "python",       label: "Python",             icon: "🐍", description: "Programming fundamentals to advanced patterns" },
  { id: "design",       label: "UI/UX Design",       icon: "🎨", description: "Figma, design systems, user research" },
  { id: "data",         label: "Data Analysis",      icon: "📊", description: "SQL, pandas, visualisation, statistics" },
  { id: "ml",           label: "Machine Learning",   icon: "🤖", description: "Supervised learning, neural networks, MLOps" },
  { id: "javascript",   label: "JavaScript",         icon: "⚡", description: "ES6+, async patterns, browser APIs" },
  { id: "product",      label: "Product Management", icon: "🗺️", description: "Roadmapping, user stories, prioritisation" },
  { id: "writing",      label: "Technical Writing",  icon: "✍️", description: "Documentation, clarity, style guides" },
  { id: "devops",       label: "DevOps",             icon: "🔧", description: "CI/CD, containers, cloud infrastructure" },
];

const MAX_SKILLS = 1;

export default function SkillSelectionPage() {
  const router = useRouter();

  // Modern @supabase/ssr browser client — no deprecated helpers needed
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [selected, setSelected]         = useState<string[]>([]);
  const [customSkill, setCustomSkill]   = useState("");
  const [customAdded, setCustomAdded]   = useState<string[]>([]);
  const [maxError, setMaxError]         = useState(false);
  const [customError, setCustomError]   = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const totalSelected = selected.length + customAdded.length;

  function togglePreset(id: string) {
    setMaxError(false);
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      if (totalSelected >= MAX_SKILLS) { setMaxError(true); return; }
      setSelected([...selected, id]);
    }
  }

  function toggleCustom(label: string) {
    setMaxError(false);
    if (customAdded.includes(label)) {
      setCustomAdded(customAdded.filter((s) => s !== label));
    } else {
      if (totalSelected >= MAX_SKILLS) { setMaxError(true); return; }
      setCustomAdded([...customAdded, label]);
    }
  }

  function addCustomSkill() {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (trimmed.length < 2)  { setCustomError("Skill name must be at least 2 characters."); return; }
    if (trimmed.length > 60) { setCustomError("Keep it under 60 characters."); return; }
    const isDuplicate =
      customAdded.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase()) ||
      PRESET_SKILLS.some((s) => s.label.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) { setCustomError("That skill is already in your list."); return; }
    if (totalSelected >= MAX_SKILLS) { setMaxError(true); return; }
    setCustomError("");
    setCustomAdded([...customAdded, trimmed]);
    setCustomSkill("");
  }

  async function handleConfirm() {
    if (totalSelected === 0) return;
    setIsConfirming(true);

    const allSkills = [
      ...selected.map((id) => PRESET_SKILLS.find((s) => s.id === id)!.label),
      ...customAdded,
    ];

    try {
      // Get current user from the modern client
      const { data: { user } } = await supabase.auth.getUser();

      const rows = allSkills.map((skill_name) => ({
        user_id:    user?.id ?? "anon",
        skill_name,
        status:     "active",
      }));

      const { error } = await supabase.from("skill_sessions").insert(rows);
      if (error) console.error("Supabase insert error:", error);
    } catch (err) {
      console.error("Failed to save skill selection:", err);
    } finally {
      // Always navigate — demo must never die on a DB error
      router.push(`/assessment?skill=${encodeURIComponent(allSkills[0])}`);
      setIsConfirming(false);
    }
  }

  return (
    <main className="nx-page">
      <header className="nx-header">
        <p className="nx-eyebrow">Step 2 of 4</p>
        <h1 className="nx-title">What do you want to learn?</h1>
        <p className="nx-subtitle">
          Pick up to {MAX_SKILLS} skills. Nexus builds a separate roadmap for each one.
        </p>
      </header>

      <section className="nx-grid" aria-label="Suggested skills">
        {PRESET_SKILLS.map((skill) => {
          const isSelected = selected.includes(skill.id);
          return (
            <button
              key={skill.id}
              onClick={() => togglePreset(skill.id)}
              aria-pressed={isSelected}
              className={`nx-skill-card ${isSelected ? "nx-skill-card--selected" : ""}`}
            >
              <span className="nx-skill-icon">{skill.icon}</span>
              <span className="nx-skill-label">{skill.label}</span>
              <span className="nx-skill-desc">{skill.description}</span>
              {isSelected && <span className="nx-check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </section>

      <section className="nx-custom-section" aria-label="Add a custom skill">
        <p className="nx-custom-label">Don't see your skill?</p>
        <div className="nx-custom-row">
          <input
            type="text"
            placeholder="e.g. Blender, Copywriting, SQL…"
            value={customSkill}
            onChange={(e) => { setCustomSkill(e.target.value); setCustomError(""); }}
            onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
            className="nx-input"
            aria-label="Custom skill name"
            maxLength={60}
          />
          <button onClick={addCustomSkill} disabled={!customSkill.trim()} className="nx-btn-ghost">
            Add
          </button>
        </div>
        {customError && <p className="nx-error">{customError}</p>}
        {customAdded.length > 0 && (
          <div className="nx-chips" role="list">
            {customAdded.map((label) => (
              <button
                key={label}
                role="listitem"
                onClick={() => toggleCustom(label)}
                className="nx-chip nx-chip--selected"
              >
                {label} ×
              </button>
            ))}
          </div>
        )}
      </section>

      {maxError && (
        <p className="nx-error nx-error--center" role="alert">
          You can select up to {MAX_SKILLS} skills. Remove one to add another.
        </p>
      )}

      <footer className="nx-footer">
        <p className="nx-count">
          {totalSelected === 0
            ? "No skills selected yet"
            : `${totalSelected} of ${MAX_SKILLS} skill${totalSelected !== 1 ? "s" : ""} selected`}
        </p>
        <button
          onClick={handleConfirm}
          disabled={totalSelected === 0 || isConfirming}
          className="nx-btn-primary"
        >
          {isConfirming ? "Saving…" : "Start with these skills →"}
        </button>
      </footer>

      <style>{`
        .nx-page {
          min-height: 100vh;
          background: var(--color-bg, #0f0f13);
          color: var(--color-text, #f0eee8);
          font-family: var(--font-body, 'Inter', sans-serif);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem 1.25rem 6rem;
          gap: 2.5rem;
        }
        .nx-header { text-align: center; max-width: 560px; }
        .nx-eyebrow {
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-accent, #7c6af7);
          margin-bottom: 0.5rem;
        }
        .nx-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }
        .nx-subtitle { font-size: 1rem; color: var(--color-muted, #8a8799); line-height: 1.6; }
        .nx-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.875rem;
          width: 100%;
          max-width: 860px;
        }
        .nx-skill-card {
          position: relative;
          background: var(--color-surface, #1a1924);
          border: 1.5px solid var(--color-border, #2a2838);
          border-radius: 12px;
          padding: 1.25rem 1rem 1rem;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .nx-skill-card:hover { border-color: var(--color-accent, #7c6af7); background: #201f2e; transform: translateY(-1px); }
        .nx-skill-card--selected { border-color: var(--color-accent, #7c6af7); background: #1e1c30; }
        .nx-skill-icon { font-size: 1.5rem; line-height: 1; margin-bottom: 0.25rem; }
        .nx-skill-label { font-weight: 600; font-size: 0.95rem; }
        .nx-skill-desc { font-size: 0.78rem; color: var(--color-muted, #8a8799); line-height: 1.45; }
        .nx-check {
          position: absolute; top: 0.65rem; right: 0.75rem;
          width: 1.25rem; height: 1.25rem; border-radius: 50%;
          background: var(--color-accent, #7c6af7); color: #fff;
          font-size: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: 700;
        }
        .nx-custom-section { width: 100%; max-width: 860px; display: flex; flex-direction: column; gap: 0.6rem; }
        .nx-custom-label { font-size: 0.8rem; font-weight: 600; color: var(--color-muted, #8a8799); text-transform: uppercase; letter-spacing: 0.08em; }
        .nx-custom-row { display: flex; gap: 0.5rem; }
        .nx-input {
          flex: 1;
          background: var(--color-surface, #1a1924);
          border: 1.5px solid var(--color-border, #2a2838);
          border-radius: 8px; padding: 0.65rem 0.9rem;
          color: var(--color-text, #f0eee8); font-size: 0.9rem; outline: none;
          transition: border-color 0.15s;
        }
        .nx-input:focus { border-color: var(--color-accent, #7c6af7); }
        .nx-input::placeholder { color: var(--color-muted, #8a8799); }
        .nx-btn-ghost {
          background: transparent; border: 1.5px solid var(--color-accent, #7c6af7);
          color: var(--color-accent, #7c6af7); border-radius: 8px; padding: 0.65rem 1.1rem;
          font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s; white-space: nowrap;
        }
        .nx-btn-ghost:hover:not(:disabled) { background: var(--color-accent, #7c6af7); color: #fff; }
        .nx-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }
        .nx-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .nx-chip {
          background: #1e1c30; border: 1.5px solid var(--color-accent, #7c6af7);
          border-radius: 20px; padding: 0.3rem 0.85rem;
          font-size: 0.83rem; color: var(--color-accent, #7c6af7); cursor: pointer;
        }
        .nx-error { font-size: 0.82rem; color: #e05a5a; }
        .nx-error--center { text-align: center; }
        .nx-footer {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--color-bg, #0f0f13);
          border-top: 1px solid var(--color-border, #2a2838);
          padding: 1rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between; gap: 1rem; z-index: 50;
        }
        .nx-count { font-size: 0.85rem; color: var(--color-muted, #8a8799); }
        .nx-btn-primary {
          background: var(--color-accent, #7c6af7); color: #fff; border: none;
          border-radius: 8px; padding: 0.75rem 1.5rem; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s, transform 0.1s; white-space: nowrap;
        }
        .nx-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .nx-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
        @media (max-width: 480px) {
          .nx-grid { grid-template-columns: 1fr 1fr; }
          .nx-footer { flex-direction: column; align-items: stretch; text-align: center; }
        }
      `}</style>
    </main>
  );
}
