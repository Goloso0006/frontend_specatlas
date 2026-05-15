import { Input } from '../ui/Input'

type FiltersToolbarProps = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterCategory: string | null
  setFilterCategory: (category: string | null) => void
  categories: string[]
  getCategoryLabel: (category: string) => string
}

export default function FiltersToolbar({
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  categories,
  getCategoryLabel,
}: FiltersToolbarProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
      <Input
        placeholder="Busca por código ISO, nombre o descripción..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        type="search"
      />
      <select
        className="w-full rounded-xl border border-app-border bg-app-surface px-4 py-3 text-[15px] app-text-primary outline-none transition-colors focus:border-app-accent"
        value={filterCategory || ''}
        onChange={(e) => setFilterCategory(e.target.value || null)}
      >
        <option value="">Todas las categorías</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {getCategoryLabel(category)}
          </option>
        ))}
      </select>
    </div>
  )
}
