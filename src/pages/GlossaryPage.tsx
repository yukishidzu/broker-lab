import { useMemo, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { glossaryById, glossaryTerms } from '../content/glossary'
import { GlossaryTermDetails } from '../components/glossary/GlossaryTermDetails'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils'

const categories = ['Все', 'Общее', 'RabbitMQ', 'Kafka', 'Надёжность'] as const

export function GlossaryPage({ termId }: { termId?: string }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof categories)[number]>('Все')
  const selected = termId ? glossaryById.get(termId) : undefined
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ru')
    return glossaryTerms.filter((term) => {
      const inCategory = category === 'Все' || term.category === category
      const matches = !normalized || `${term.title} ${term.english} ${term.short}`.toLocaleLowerCase('ru').includes(normalized)
      return inCategory && matches
    })
  }, [category, query])

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="max-w-2xl"><Badge>Справочник</Badge><h1 className="mt-3 text-xl font-semibold">Глоссарий</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Короткое определение, техническая оговорка и типичная ошибка. Из контекста сценария термин открывается без потери текущего шага.</p></div>
      <div className="mt-6 grid items-start gap-6 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section aria-label="Список терминов">
          <label className="relative block"><span className="sr-only">Поиск по глоссарию</span><Search size={15} className="absolute left-3 top-3 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Термин или английское название" /></label>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Категория терминов">
            {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={cn('cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring', category === item && 'bg-secondary text-secondary-foreground')}>{item}</button>)}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            {filtered.map((term) => (
              <a key={term.id} href={`#/glossary/${term.id}`} className={cn('block border-b border-border/70 px-4 py-3 last:border-0 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring', selected?.id === term.id && 'bg-primary/8')}>
                <span className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{term.title}</span><Badge className="text-[9px]">{term.category}</Badge></span>
                <span className="mt-1 block font-mono text-[10px] text-muted-foreground">{term.english}</span>
                <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{term.short}</span>
              </a>
            ))}
            {!filtered.length && <p className="p-8 text-center text-sm text-muted-foreground">Термины не найдены.</p>}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5 md:sticky md:top-24" aria-label="Определение термина">
          {selected ? <><h2 className="mb-5 text-xl font-semibold">{selected.title}</h2><GlossaryTermDetails term={selected} onOpenScenario={() => { location.hash = '/message/s01' }} /></> : <div className="py-12 text-center"><BookOpenIcon /><h2 className="mt-3 text-sm font-semibold">Выберите термин</h2><p className="mt-2 text-sm text-muted-foreground">Откройте определение в списке или через глобальный поиск.</p></div>}
        </section>
      </div>
    </main>
  )
}

function BookOpenIcon() {
  return <BookOpen size={22} className="mx-auto text-muted-foreground" />
}
