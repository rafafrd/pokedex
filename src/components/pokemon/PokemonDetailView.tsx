import { ArrowLeft, Heart } from "lucide-react";
import type { PokemonDetail } from "../../types/pokemon";
import { getTypeColor } from "../../utils/typeColors";
import { PokemonSprite } from "./PokemonSprite";

interface PokemonDetailViewProps {
  pokemon: PokemonDetail;
  onBack: () => void;
  onChooseCompanion?: () => void;
}

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Ataque",
  defense: "Defesa",
  "special-attack": "Atq. Especial",
  "special-defense": "Def. Especial",
  speed: "Velocidade",
};

const MAX_STAT_SCALE = 180;

/** Ficha da busca direta; medidas da API vêm em décimos (altura/10 = metros). */
export function PokemonDetailView({
  pokemon,
  onBack,
  onChooseCompanion,
}: PokemonDetailViewProps) {
  return (
    <div className="w-full rounded-2xl border border-border/40 bg-surface/30 p-6 backdrop-blur-sm sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-accent"
      >
        <ArrowLeft size={16} />
        Voltar para a lista
      </button>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-shrink-0 flex-col items-center gap-2">
          <PokemonSprite
            sprites={pokemon.sprites}
            alt={pokemon.name}
            className="h-40 w-40 object-contain drop-shadow-xl animate-floatSlow"
          />
          <span className="text-sm font-semibold text-text-secondary">
            #{String(pokemon.id).padStart(3, "0")}
          </span>
        </div>

        <div className="w-full flex-1 space-y-5">
          <div>
            <h2 className="text-2xl font-extrabold capitalize text-text-primary">
              {pokemon.name}
            </h2>
            {onChooseCompanion && (
              <button
                type="button"
                onClick={onChooseCompanion}
                className="mt-3 flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover"
              >
                <Heart size={16} /> Escolher como companheiro
              </button>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className="rounded-full px-3 py-1 text-xs font-semibold capitalize text-white shadow-sm"
                  style={{ backgroundColor: getTypeColor(type) }}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Altura" value={`${pokemon.height / 10} m`} />
            <Metric label="Peso" value={`${pokemon.weight / 10} kg`} />
            <Metric label="Exp. Base" value={String(pokemon.baseExperience)} />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
              Estatísticas
            </h3>
            {pokemon.stats.map((stat) => (
              <div key={stat.name} className="flex items-center gap-3 text-sm">
                <span className="w-28 flex-shrink-0 font-medium text-text-secondary">
                  {STAT_LABELS[stat.name] ?? stat.name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/20">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (stat.base / MAX_STAT_SCALE) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right font-semibold text-text-primary">
                  {stat.base}
                </span>
              </div>
            ))}
          </div>

          {pokemon.abilities.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-text-secondary">
                Habilidades
              </h3>
              <p className="text-sm capitalize text-text-primary">
                {pokemon.abilities.join(", ").replaceAll("-", " ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/10 px-2 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className="text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}
