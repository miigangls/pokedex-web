import { Link } from 'react-router-dom'
import { usePokemonQuery, usePrefetchPokemon } from '../../../hooks/queries/usePokemonQuery'
import { Card, CardContent } from '../../../components/ui/Card'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { capitalize } from '../../../utils/formatters'
import { getTypeClasses } from '../../../utils/typeColors'
import { HeartMinusIcon, HeartPlusIcon } from '../../../components/ui/icons'

export function PokemonCard({ name }: { name: string }) {
  const { data, isLoading, isError } = usePokemonQuery(name)
  const prefetch = usePrefetchPokemon()
  const favorites = useLocalStorage<string[]>('favorites', [])
  const isFavorite = favorites.value.includes(name)

  function toggleFavorite() {
    favorites.setValue(
      isFavorite ? favorites.value.filter((n) => n !== name) : [...favorites.value, name],
    )
  }

  return (
    <Card className="relative overflow-visible pt-10 pb-5">
      {data && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite()
          }}
          className="absolute right-2 top-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 p-2 text-white shadow-[0_8px_24px_rgba(244,63,94,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          {isFavorite ? (
            <HeartMinusIcon width={18} height={18} />
          ) : (
            <HeartPlusIcon width={18} height={18} />
          )}
        </button>
      )}
      <CardContent className="pt-0">
        {isLoading && (
          <div className="h-40 animate-pulse rounded-md bg-gray-100" aria-hidden />
        )}
        {isError && (
          <div className="text-sm text-red-600">Error al cargar {capitalize(name)}</div>
        )}
        {data && (
          <div className="flex flex-col items-center text-center">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              {data.sprites.artwork || data.sprites.default ? (
                <img
                  src={data.sprites.artwork ?? data.sprites.default ?? ''}
                  alt={`Imagen de ${data.name}`}
                  className="h-16 w-16 object-contain drop-shadow"
                  loading="lazy"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-gray-100" aria-hidden />
              )}
            </div>
            <div className="mt-6 text-xs font-medium text-gray-400">N° {data.id}</div>
            <Link
              to={`/pokemon/${data.name}`}
              className="mt-1 text-lg font-semibold text-gray-900 hover:text-red-600"
              onMouseEnter={() => prefetch(data.name)}
              onFocus={() => prefetch(data.name)}
            >
              {capitalize(data.name)}
            </Link>
            <div className="mt-3">
              {data.types[0] && (
                <span className={`inline-flex rounded-md px-3 py-1 text-sm ${getTypeClasses(data.types[0])}`}>
                  {capitalize(data.types[0])}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


