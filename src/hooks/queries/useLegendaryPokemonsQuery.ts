import { useInfiniteQuery } from '@tanstack/react-query'
import { http } from '../../services/http'
import { getPokemonSpecies } from '../../services/pokemon.service'

type SpeciesListResponse = {
  count: number
  next: string | null
  previous: string | null
  results: { name: string; url: string }[]
}

export type LegendaryPage = {
  nextOffset: number | null
  names: string[]
}

// Use a larger page so the first load already includes early-legendaries (Articuno/Zapdos/Moltres...)
const PAGE_SIZE = 200

async function fetchLegendaryPage(offset: number): Promise<LegendaryPage> {
  const { data } = await http.get<SpeciesListResponse>('/pokemon-species', {
    params: { limit: PAGE_SIZE, offset },
  })
  const nextOffset = data.next ? new URL(data.next).searchParams.get('offset') : null

  // Fetch details to check is_legendary; limit concurrency with Promise.all
  const details = await Promise.all(
    data.results.map((s) => getPokemonSpecies(s.name).catch(() => null)),
  )
  const names = details
    .filter((d): d is { name: string; is_legendary: boolean } => Boolean(d))
    .filter((d) => d.is_legendary === true)
    .map((d) => d.name)

  return { nextOffset: nextOffset ? Number(nextOffset) : null, names }
}

export function useLegendaryPokemonsQuery() {
  return useInfiniteQuery<LegendaryPage>({
    queryKey: ['legendary-pokemons'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchLegendaryPage(typeof pageParam === 'number' ? pageParam : 0),
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    staleTime: 1000 * 60 * 10,
  })
}


