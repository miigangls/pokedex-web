import type { PokemonsPage, Pokemon, PokemonDetail } from '../models/pokemon'

type PokeApiListResponse = {
  count: number
  next: string | null
  previous: string | null
  results: { name: string; url: string }[]
}

export function adaptPokemonsPage(data: PokeApiListResponse): PokemonsPage {
  const nextOffset = data.next ? getOffsetFromUrl(data.next) : null
  const prevOffset = data.previous ? getOffsetFromUrl(data.previous) : null
  return {
    count: data.count,
    nextOffset,
    prevOffset,
    results: data.results,
  }
}

function getOffsetFromUrl(url: string): number {
  const u = new URL(url)
  const offset = u.searchParams.get('offset')
  return Number(offset ?? '0')
}

// Raw Pokemon from PokeAPI
type PokeApiPokemon = {
  id: number
  name: string
  height: number
  weight: number
  types: { slot: number; type: { name: string } }[]
  abilities?: { ability: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  sprites: {
    front_default: string | null
    front_shiny: string | null
    other?: { 'official-artwork'?: { front_default: string | null } }
  }
}

export function adaptPokemon(data: PokeApiPokemon): Pokemon {
  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    types: data.types.map((t) => t.type.name),
    abilities: data.abilities?.map((a) => a.ability.name) ?? [],
    stats: data.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
    sprites: {
      default: data.sprites.front_default ?? null,
      shiny: data.sprites.front_shiny ?? null,
      artwork: data.sprites.other?.['official-artwork']?.front_default ?? null,
    },
  }
}

// Species adapter
type PokeApiSpecies = {
  flavor_text_entries: { flavor_text: string; language: { name: string } }[]
  evolution_chain: { url: string }
}

export function adaptSpeciesDescription(species: PokeApiSpecies): {
  description?: string
  evolutionChainUrl: string
} {
  const entry = species.flavor_text_entries.find((e) => e.language.name === 'en')
  const description = entry?.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ')
  return { description, evolutionChainUrl: species.evolution_chain.url }
}

// Evolution chain adapter (flatten up to 3 stages like the reference)
type EvolutionChain = {
  chain: {
    species: { name: string; url: string }
    evolves_to: {
      species: { name: string; url: string }
      evolution_details: { min_level: number | null }[]
      evolves_to: {
        species: { name: string; url: string }
        evolution_details: { min_level: number | null }[]
      }[]
    }[]
  }
}

function idFromSpeciesUrl(url: string): number {
  const parts = url.split('/').filter(Boolean)
  return Number(parts[parts.length - 1])
}

function spriteUrlForId(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export function adaptEvolutionChain(data: EvolutionChain): PokemonDetail['evolutionChain'] {
  const out: PokemonDetail['evolutionChain'] = []
  const baseId = idFromSpeciesUrl(data.chain.species.url)
  out.push({ id: baseId, name: data.chain.species.name, sprite: spriteUrlForId(baseId) })

  if (data.chain.evolves_to.length > 0) {
    const first = data.chain.evolves_to[0]
    const firstId = idFromSpeciesUrl(first.species.url)
    out.push({
      id: firstId,
      name: first.species.name,
      sprite: spriteUrlForId(firstId),
      minLevel: first.evolution_details[0]?.min_level ?? null,
    })
    if (first.evolves_to.length > 0) {
      const second = first.evolves_to[0]
      const secondId = idFromSpeciesUrl(second.species.url)
      out.push({
        id: secondId,
        name: second.species.name,
        sprite: spriteUrlForId(secondId),
        minLevel: second.evolution_details[0]?.min_level ?? null,
      })
    }
  }
  return out
}


