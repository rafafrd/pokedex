import {
  Apple,
  ArrowLeft,
  Check,
  Gift,
  Heart,
  Leaf,
  Moon,
  Pencil,
  Plus,
  Sparkles,
  Volleyball,
  Brush,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  activeCompanion,
  artworkUrl,
  BERRIES,
  CARE_OPTIONS,
  bondProgress,
  careBlockedReason,
  companionMood,
  countdown,
  favoriteBerry,
  FORAGE_COOLDOWN,
  frontSpriteUrl,
  localDay,
  MAX_COMPANIONS,
  STARTERS,
  type CompanionPokemon,
} from "../../../shared/companion";
import { PokemonSprite } from "../../components/pokemon/PokemonSprite";
import { useCompanion } from "./useCompanion";
import "./companion.css";

function Portrait({
  pokemon,
  large = false,
}: {
  pokemon: CompanionPokemon;
  large?: boolean;
}) {
  return (
    <PokemonSprite
      sprites={{
        animated: null,
        showdown: null,
        artwork: artworkUrl(pokemon.id),
        front: frontSpriteUrl(pokemon.id),
      }}
      alt={pokemon.name}
      className={large ? "companion-portrait" : "companion-avatar"}
    />
  );
}

export function CompanionView({
  candidate,
  onBrowse,
}: {
  candidate: CompanionPokemon | null;
  onBrowse: () => void;
}) {
  const { save, ready, busy, error, message, now, execute, reload } =
    useCompanion();
  const [choosing, setChoosing] = useState(!!candidate);
  const [selected, setSelected] = useState(candidate ?? STARTERS[3]);
  const [nickname, setNickname] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const pet = activeCompanion(save, now);
  const adopt = async (event: FormEvent) => {
    event.preventDefault();
    if (await execute({ type: "adopt", pokemon: selected, nickname })) {
      setChoosing(false);
      setNickname("");
    }
  };
  const selectPet = async (id: number) => {
    if (await execute({ type: "select", id })) {
      setChoosing(false);
      setRenaming(false);
    }
  };

  if (!ready)
    return (
      <section className="companion-module companion-loading" aria-busy={busy}>
        <Heart size={36} />
        <h2>
          {error ? "Seu progresso está guardado" : "Preparando seu cantinho…"}
        </h2>
        {error && (
          <>
            <p role="alert">{error}</p>
            <button
              className="companion-button primary"
              disabled={busy}
              onClick={() => void reload()}
            >
              Tentar carregar novamente
            </button>
          </>
        )}
      </section>
    );

  const bond = pet ? bondProgress(pet.xp) : null;
  const mood = pet ? companionMood(pet) : null;
  const favorite = pet ? favoriteBerry(pet.pokemon.id) : null;
  const forageRemaining =
    save.lastForageAt === null
      ? 0
      : Math.max(0, FORAGE_COOLDOWN - (now - save.lastForageAt));
  const basketClaimed =
    !!save.lastBasketDay && save.lastBasketDay >= localDay(now);
  const owned = save.companions.some((p) => p.pokemon.id === selected.id);
  const choices =
    candidate && !STARTERS.some((p) => p.id === candidate.id)
      ? [candidate, ...STARTERS]
      : STARTERS;

  return (
    <section className="companion-module" aria-label="Módulo de companheiro">
      <div className="companion-heading">
        <div>
          <p className="companion-eyebrow">
            <Leaf size={14} /> SEU CANTINHO NA POKÉDEX
          </p>
          <h2>Uma amizade para cuidar.</h2>
          <p>
            Frutas, carinho e um tempinho juntos. É assim que o vínculo cresce.
          </p>
        </div>
        {pet && !choosing && save.companions.length < MAX_COMPANIONS && (
          <button
            className="companion-button"
            onClick={() => {
              setChoosing(true);
              setNickname("");
            }}
          >
            <Plus size={16} /> Novo companheiro
          </button>
        )}
      </div>

      <div className="companion-feedback" aria-live="polite" aria-atomic="true">
        {error ? (
          <p className="companion-notice error" role="alert">
            {error}
          </p>
        ) : message ? (
          <p className="companion-notice">
            <Check size={16} /> {message}
          </p>
        ) : (
          <p className="companion-save-note">
            Seu cantinho fica salvo neste navegador.
          </p>
        )}
      </div>

      {save.companions.length > 0 && (
        <nav className="companion-team" aria-label="Seus companheiros">
          {save.companions.map((p) => (
            <button
              key={p.pokemon.id}
              className="companion-team-member"
              aria-pressed={p.pokemon.id === save.activeId && !choosing}
              disabled={busy}
              onClick={() => void selectPet(p.pokemon.id)}
            >
              <Portrait pokemon={p.pokemon} />
              <span>{p.nickname}</span>
              {p.pokemon.id === save.activeId && !choosing && (
                <Heart size={13} fill="currentColor" />
              )}
            </button>
          ))}
        </nav>
      )}

      {!pet || choosing ? (
        <div className="companion-adoption companion-panel">
          <div className="companion-adoption-copy">
            <span className="companion-stamp">
              <Heart size={22} />
            </span>
            <p className="companion-eyebrow">TODO LAÇO TEM UM COMEÇO</p>
            <h3>
              Quem vai estar
              <br />
              ao seu lado?
            </h3>
            <p>
              Escolha um Pokémon e dê a ele um apelido. A mochila compartilhada
              começa com 10 frutas.
            </p>
            <button className="companion-text-button" onClick={onBrowse}>
              Escolher outro na Pokédex →
            </button>
            {pet && (
              <button
                className="companion-text-button"
                onClick={() => setChoosing(false)}
              >
                <ArrowLeft size={14} /> Voltar para {pet.nickname}
              </button>
            )}
          </div>
          <form
            onSubmit={(e) => void adopt(e)}
            className="companion-adoption-form"
          >
            <div
              className="companion-starters"
              role="group"
              aria-label="Escolher Pokémon"
            >
              {choices.map((p) => (
                <button
                  className="companion-starter"
                  type="button"
                  aria-pressed={selected.id === p.id}
                  key={p.id}
                  onClick={() => setSelected(p)}
                >
                  <Portrait pokemon={p} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
            {owned ? (
              <>
                <p>{selected.name} já faz parte da sua equipe.</p>
                <button
                  className="companion-button primary"
                  type="button"
                  disabled={busy}
                  onClick={() => void selectPet(selected.id)}
                >
                  Visitar companheiro
                </button>
              </>
            ) : (
              <>
                <label htmlFor="companion-name">
                  Como vamos chamar {selected.name}?
                </label>
                <div className="companion-name-row">
                  <input
                    id="companion-name"
                    maxLength={20}
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Um apelido especial…"
                    autoComplete="off"
                  />
                  <span>{nickname.length}/20</span>
                </div>
                <button
                  className="companion-button primary"
                  disabled={
                    busy ||
                    !nickname.trim() ||
                    save.companions.length >= MAX_COMPANIONS
                  }
                >
                  <Heart size={17} />{" "}
                  {busy ? "Salvando…" : "Começar nossa amizade"}
                </button>
              </>
            )}
          </form>
        </div>
      ) : (
        <>
          <div className="companion-main-grid">
            <article className="companion-habitat companion-panel">
              <div className="companion-habitat-top">
                <span className="companion-pill">
                  {mood!.emoji} {mood!.label}
                </span>
                <span className="companion-species">
                  #{String(pet.pokemon.id).padStart(3, "0")} ·{" "}
                  {pet.pokemon.name}
                </span>
              </div>
              <div
                className={`companion-scene${pet.sleepingUntil ? " sleeping" : ""}`}
              >
                <div className="companion-orbit" />
                <div className="companion-ground" />
                <Portrait pokemon={pet.pokemon} large />
                <span className="companion-scene-symbol" aria-hidden="true">
                  {pet.sleepingUntil ? "z z Z" : "♥"}
                </span>
              </div>
              <div className="companion-identity">
                {renaming ? (
                  <form
                    className="companion-rename"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (await execute({ type: "rename", nickname: draft }))
                        setRenaming(false);
                    }}
                  >
                    <label className="sr-only" htmlFor="rename-companion">
                      Novo apelido
                    </label>
                    <input
                      autoFocus
                      id="rename-companion"
                      maxLength={20}
                      required
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <button
                      className="companion-button primary"
                      disabled={busy || !draft.trim()}
                    >
                      Salvar
                    </button>
                    <button
                      className="companion-text-button"
                      type="button"
                      onClick={() => setRenaming(false)}
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <div className="companion-name">
                    <h3>{pet.nickname}</h3>
                    <button
                      className="companion-icon-button"
                      aria-label="Editar apelido"
                      onClick={() => {
                        setDraft(pet.nickname);
                        setRenaming(true);
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                )}
                <p>{mood!.hint}</p>
              </div>
              <div className="companion-care-actions">
                {CARE_OPTIONS.map(({ type, label, hint }) => {
                  const Icon = {
                    pet: Heart,
                    play: Volleyball,
                    rest: Moon,
                    walk: Leaf,
                    groom: Brush,
                    trick: Sparkles,
                  }[type];
                  const reason = careBlockedReason(pet, type, now);
                  return (
                    <button
                      key={type}
                      className="companion-care"
                      disabled={busy || !!reason}
                      onClick={() => void execute({ type })}
                    >
                      <Icon size={21} />
                      <strong>{label}</strong>
                      <small>{reason ?? hint}</small>
                    </button>
                  );
                })}
              </div>
            </article>

            <aside className="companion-status companion-panel">
              <div className="companion-section-heading">
                <h3>Nosso vínculo</h3>
                <Heart size={19} />
              </div>
              <div className="companion-bond-title">
                <span className="companion-level">{bond!.level}</span>
                <div>
                  <span className="companion-caption">NÍVEL DE AMIZADE</span>
                  <h4>{bond!.name}</h4>
                </div>
              </div>
              <Meter
                label="Vínculo"
                value={bond!.percent}
                caption={`${pet.xp} pontos`}
                kind="bond"
              />
              <p className="companion-small">
                {bond!.next
                  ? `Faltam ${bond!.remaining} pontos para ${bond!.next.toLowerCase()}.`
                  : "Vocês construíram uma amizade para a vida toda!"}
              </p>
              <div className="companion-needs">
                <Meter label="Saciedade" value={pet.fullness} kind="fullness" />
                <Meter label="Alegria" value={pet.happiness} kind="happiness" />
                <Meter label="Energia" value={pet.energy} kind="energy" />
              </div>
              <div className="companion-favorite">
                <span>{favorite!.emoji}</span>
                <div>
                  <span className="companion-caption">FRUTA FAVORITA</span>
                  <strong>{favorite!.name}</strong>
                  <small>+6 de vínculo extra ao alimentar</small>
                </div>
              </div>
              <p className="companion-small">
                Juntos desde{" "}
                {new Date(pet.adoptedAt).toLocaleDateString("pt-BR")} ·{" "}
                {pet.careCount} cuidados
              </p>
            </aside>
          </div>

          <div className="companion-bottom-grid">
            <section className="companion-panel companion-pantry">
              <div className="companion-section-heading">
                <div>
                  <p className="companion-eyebrow">HORA DO LANCHINHO</p>
                  <h3>Mochila de frutas</h3>
                </div>
                <Apple size={23} />
              </div>
              <p className="companion-small">
                Escolha uma fruta para alimentar {pet.nickname}.
              </p>
              <div className="companion-berries">
                {BERRIES.map((berry) => {
                  const reason = careBlockedReason(pet, "feed", now);
                  const empty = save.inventory[berry.id] === 0;
                  return (
                    <button
                      key={berry.id}
                      className="companion-berry"
                      disabled={busy || empty || !!reason}
                      onClick={() =>
                        void execute({ type: "feed", berry: berry.id })
                      }
                      aria-label={`Dar ${berry.name}, ${save.inventory[berry.id]} disponíveis${reason ? `. ${reason}` : ""}`}
                    >
                      <span className="companion-berry-count">
                        ×{save.inventory[berry.id]}
                      </span>
                      <span className="companion-fruit" aria-hidden="true">
                        {berry.emoji}
                      </span>
                      <strong>
                        {berry.name}{" "}
                        {favorite!.id === berry.id && (
                          <Heart size={12} fill="currentColor" />
                        )}
                      </strong>
                      <small>{berry.description}</small>
                      <span className="companion-berry-cta">
                        {empty ? "Sem frutas" : (reason ?? "Dar fruta")}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="companion-supplies">
                <div>
                  <Gift size={18} />
                  <span>
                    <strong>Cesta diária</strong>
                    <small>
                      10 frutas · {save.basketStreak}{" "}
                      {save.basketStreak === 1
                        ? "dia seguido"
                        : "dias seguidos"}
                    </small>
                  </span>
                  <button
                    className="companion-button"
                    disabled={busy || basketClaimed}
                    onClick={() => void execute({ type: "basket" })}
                  >
                    {basketClaimed ? "Volte amanhã" : "Coletar cesta"}
                  </button>
                </div>
                <div>
                  <Leaf size={18} />
                  <span>
                    <strong>Pomar</strong>
                    <small>4 frutas a cada 5 minutos</small>
                  </span>
                  <button
                    className="companion-button"
                    disabled={busy || forageRemaining > 0}
                    onClick={() => void execute({ type: "forage" })}
                  >
                    {forageRemaining > 0
                      ? countdown(forageRemaining)
                      : "Colher frutas"}
                  </button>
                </div>
              </div>
            </section>
            <section className="companion-panel companion-journal">
              <div className="companion-section-heading">
                <div>
                  <p className="companion-eyebrow">PEQUENAS MEMÓRIAS</p>
                  <h3>Diário de vocês</h3>
                </div>
                <Sparkles size={20} />
              </div>
              <ol>
                {pet.history.slice(0, 5).map((entry, index) => (
                  <li key={`${entry.at}-${index}`}>
                    <span className="companion-journal-dot" />
                    <div>
                      <p>{entry.text}</p>
                      <time dateTime={new Date(entry.at).toISOString()}>
                        {new Date(entry.at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
          <p className="companion-footnote">
            Os cuidados continuam com o passar do tempo. Seu vínculo nunca
            diminui e seu companheiro sempre espera por você. Progresso local,
            sem sincronização entre dispositivos.
          </p>
        </>
      )}
    </section>
  );
}

function Meter({
  label,
  value,
  caption,
  kind,
}: {
  label: string;
  value: number;
  caption?: string;
  kind: string;
}) {
  return (
    <div className={`companion-meter ${kind}`}>
      <div>
        <span>{label}</span>
        <strong>{caption ?? `${Math.round(value)}/100`}</strong>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="companion-meter-track"
      >
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
