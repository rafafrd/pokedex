import { useState, type FormEvent } from "react";
import { Check, Heart, MapPin, Save, UserRound } from "lucide-react";
import {
  TRAINER_AVATARS,
  TRAINER_REGIONS,
  trainerAvatar,
  type TrainerProfile,
} from "../../../shared/trainer";
import { trainerProgress } from "../../../shared/companion";
import type { ThemeName } from "../../types/pokemon";
import { useCompanion } from "../companion/useCompanion";
import type { useTrainer } from "./useTrainer";
import "../companion/companion.css";
import "./trainer.css";

export function TrainerView({
  trainer,
  theme,
  onThemeChange,
  themeError,
}: {
  trainer: ReturnType<typeof useTrainer>;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  themeError: string | null;
}) {
  const companion = useCompanion();
  const stats = trainerProgress(companion.save);
  return (
    <section
      className="companion-module trainer-module"
      aria-label="Perfil do treinador"
    >
      <div className="companion-heading">
        <div>
          <p className="companion-eyebrow">
            <UserRound size={14} /> SUA JORNADA
          </p>
          <h2>Perfil do treinador</h2>
          <p>Seu jeito de explorar. Suas amizades. Sua história.</p>
        </div>
      </div>
      {!trainer.ready ? (
        <div className="companion-panel trainer-form" aria-busy={trainer.busy}>
          <p role={trainer.error ? "alert" : undefined}>
            {trainer.error ?? "Carregando seu perfil…"}
          </p>
          {trainer.error && (
            <button
              className="companion-button"
              disabled={trainer.busy}
              onClick={() => void trainer.reload()}
            >
              Tentar novamente
            </button>
          )}
        </div>
      ) : (
        <TrainerForm
          trainer={trainer}
          theme={theme}
          onThemeChange={onThemeChange}
          themeError={themeError}
        />
      )}
      <section className="companion-panel trainer-progress">
        <div className="companion-section-heading">
          <h3>Laços que você construiu</h3>
          <Heart size={20} />
        </div>
        {!companion.ready ? (
          <>
            <p className="companion-small">
              {companion.error ?? "Carregando suas conquistas…"}
            </p>
            {companion.error && (
              <button
                className="companion-button"
                disabled={companion.busy}
                onClick={() => void companion.reload()}
              >
                Carregar conquistas
              </button>
            )}
          </>
        ) : (
          <>
            <div className="trainer-stats">
              {[
                { value: stats.companions, label: "Companheiros" },
                { value: stats.care, label: "Cuidados" },
                { value: stats.meals, label: "Frutas servidas" },
              ].map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="trainer-badges">
              {stats.badges.map((badge) => (
                <div
                  key={badge.name}
                  className={`trainer-badge${badge.unlocked ? " unlocked" : ""}`}
                >
                  <span aria-hidden="true">{badge.emoji}</span>
                  <strong>{badge.name}</strong>
                  <small>{badge.description}</small>
                  <span className="trainer-badge-status">
                    {badge.unlocked ? "Conquistado ✓" : "Em progresso"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
      <p className="companion-footnote">
        Seu perfil e suas conquistas ficam salvos neste navegador.
      </p>
    </section>
  );
}

function TrainerForm({
  trainer,
  theme,
  onThemeChange,
  themeError,
}: {
  trainer: ReturnType<typeof useTrainer>;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  themeError: string | null;
}) {
  const [draft, setDraft] = useState<TrainerProfile>(trainer.profile);
  const [saved, setSaved] = useState(false);
  const edit = (patch: Partial<TrainerProfile>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(await trainer.saveProfile(draft));
  };
  return (
    <div className="trainer-grid">
      <aside className="trainer-pass companion-panel">
        <span className="companion-eyebrow">
          CARTEIRA DE TREINADOR · PRÉVIA
        </span>
        <div
          className="trainer-avatar-large"
          aria-label={trainerAvatar(draft).label}
        >
          {trainerAvatar(draft).emoji}
        </div>
        <h3>{draft.name.trim() || "Seu nome"}</h3>
        <span className="trainer-region">
          <MapPin size={14} /> {draft.region}
        </span>
        <p>{draft.bio || "Sua história começa aqui."}</p>
        <div className="trainer-pass-footer">
          POKÉDEX <span>♡</span> COMPANHEIROS
        </div>
      </aside>
      <form
        className="companion-panel trainer-form"
        onSubmit={(e) => void submit(e)}
      >
        <h3>Do seu jeito</h3>
        <label htmlFor="trainer-name">
          Nome do treinador
          <input
            id="trainer-name"
            value={draft.name}
            onChange={(e) => edit({ name: e.target.value })}
            maxLength={24}
            required
            autoComplete="nickname"
            disabled={trainer.busy}
          />
        </label>
        <fieldset disabled={trainer.busy}>
          <legend>Seu avatar</legend>
          <div className="trainer-avatars">
            {TRAINER_AVATARS.map((avatar) => (
              <button
                type="button"
                key={avatar.id}
                aria-label={`Avatar ${avatar.label}`}
                aria-pressed={draft.avatar === avatar.id}
                onClick={() => edit({ avatar: avatar.id })}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>
        </fieldset>
        <label htmlFor="trainer-region">
          Região favorita
          <select
            id="trainer-region"
            value={draft.region}
            onChange={(e) =>
              edit({ region: e.target.value as TrainerProfile["region"] })
            }
            disabled={trainer.busy}
          >
            {TRAINER_REGIONS.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </label>
        <label htmlFor="trainer-bio">
          Sua apresentação{" "}
          <span className="companion-small">{draft.bio.length}/100</span>
          <input
            id="trainer-bio"
            value={draft.bio}
            onChange={(e) => edit({ bio: e.target.value })}
            maxLength={100}
            placeholder="O que move sua jornada?"
            disabled={trainer.busy}
          />
        </label>
        <div className="trainer-form-actions">
          <button
            className="companion-button primary"
            disabled={trainer.busy || !draft.name.trim()}
          >
            <Save size={16} /> {trainer.busy ? "Salvando…" : "Salvar perfil"}
          </button>
          <button
            type="button"
            className="companion-text-button"
            disabled={trainer.busy}
            onClick={() => {
              setDraft(trainer.profile);
              setSaved(false);
            }}
          >
            Descartar alterações
          </button>
        </div>
        <div aria-live="polite">
          {trainer.error ? (
            <p role="alert" className="companion-small">
              {trainer.error}
            </p>
          ) : (
            saved && (
              <p className="trainer-success">
                <Check size={15} /> Perfil salvo!
              </p>
            )
          )}
        </div>
        <fieldset className="trainer-theme">
          <legend>Tema da Pokédex</legend>
          <p className="companion-small">Aplicado e salvo ao selecionar.</p>
          <div className="trainer-theme-options">
            {(["gengar", "mewtwo"] as const).map((option) => (
              <button
                type="button"
                className="companion-button"
                aria-pressed={theme === option}
                key={option}
                onClick={() => onThemeChange(option)}
              >
                {option === "gengar"
                  ? "🌙 Gengar · escuro"
                  : "☀️ Mewtwo · claro"}
                {theme === option && <Check size={14} />}
              </button>
            ))}
          </div>
          {themeError && (
            <p role="alert" className="companion-small">
              {themeError}
            </p>
          )}
        </fieldset>
      </form>
    </div>
  );
}
