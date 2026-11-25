import { useEffect, useRef, useState } from 'react'
import { BookOpen, Moon, Search, Sun, Waypoints } from 'lucide-react'
import { useTheme } from '../lib/theme'
import { cn } from '../lib/utils'
import { SearchDialog } from './SearchDialog'
import { Button } from './ui/button'
import { Tooltip } from './ui/tooltip'

const navigation = [
  { href: '#/message/s01', label: 'Сообщение', match: '#/message' },
  { href: '#/scenarios', label: 'Сценарии', match: '#/scenarios' },
  { href: '#/delivery', label: 'Гарантии', match: '#/delivery' },
  { href: '#/kafka-groups', label: 'Группы', match: '#/kafka-groups' },
  { href: '#/glossary', label: 'Глоссарий', match: '#/glossary' },
]

export function AppHeader({ hash }: { hash: string }) {
  const { dark, change } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const previousFocus = useRef<HTMLElement | null>(null)

  const openSearch = () => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setSearchOpen(true)
  }
  const changeSearchOpen = (open: boolean) => {
    setSearchOpen(open)
    if (!open) requestAnimationFrame(() => previousFocus.current?.focus())
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        setSearchOpen(true)
      }
    }
    addEventListener('keydown', handleKey)
    return () => removeEventListener('keydown', handleKey)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-[60px] items-center gap-2 px-4 md:px-5">
        <a href="#/message/s01" className="flex shrink-0 items-center gap-2 rounded-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Waypoints size={17} /></span>
          <span>Broker Lab</span>
        </a>
        <nav className="ml-5 hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className={cn('rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring', hash.startsWith(item.match) && 'bg-secondary text-secondary-foreground')}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={openSearch} className="max-md:size-9 max-md:px-0">
            <Search size={15} /><span aria-hidden="true" className="max-md:hidden">Поиск</span><kbd aria-hidden="true" className="ml-2 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground max-lg:hidden">Ctrl K</kbd><span className="sr-only">Поиск</span>
          </Button>
          <Tooltip label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}>
            <Button variant="ghost" size="icon" onClick={() => change(dark ? 'light' : 'dark')} aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
          </Tooltip>
          <Tooltip label="Открыть глоссарий">
            <a href="#/glossary" className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring max-md:hidden" aria-label="Открыть глоссарий"><BookOpen size={16} /></a>
          </Tooltip>
        </div>
      </div>
      <nav className="grid grid-cols-5 border-t border-border/70 px-2 py-1.5 lg:hidden" aria-label="Основная навигация на мобильном">
        {navigation.map((item) => (
          <a key={item.href} href={item.href} className={cn('rounded-md px-1 py-2 text-center text-[11px] font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring', hash.startsWith(item.match) && 'bg-secondary text-secondary-foreground')}>
            {item.label}
          </a>
        ))}
      </nav>
      <SearchDialog open={searchOpen} onOpenChange={changeSearchOpen} />
    </header>
  )
}
