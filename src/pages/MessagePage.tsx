import { useEffect, useState } from 'react'
import { BookOpen, Check, List, Mail, MessageSquareText, Network } from 'lucide-react'
import { BrokerSwitch } from '../components/player/BrokerSwitch'
import { EventLog } from '../components/player/EventLog'
import { MessageInspector } from '../components/player/MessageInspector'
import { PlayerControls } from '../components/player/PlayerControls'
import { StageNavigator } from '../components/player/StageNavigator'
import { StepExplanation } from '../components/player/StepExplanation'
import { TopologyGraph } from '../components/player/TopologyGraph'
import { GlossaryDialog } from '../components/glossary/GlossaryDialog'
import { Badge } from '../components/ui/badge'
import { clampStep, scenarioFor, switchBroker } from '../engine/core/player'
import { loadPlayerState, savePlayerState, type PlayerState } from '../lib/playerStorage'
import { cn } from '../lib/utils'
import type { Broker } from '../types'

type MobileTab = 'diagram' | 'events' | 'details'
type DetailsTab = 'step' | 'message'

export function MessagePage() {
  const [player, setPlayer] = useState<PlayerState>(() => {
    const saved = loadPlayerState()
    const query = new URLSearchParams(location.hash.split('?')[1] ?? '')
    const requested = query.get('broker')
    return requested === 'kafka' || requested === 'rabbitmq' ? { ...saved, broker: requested } : saved
  })
  const [mobileTab, setMobileTab] = useState<MobileTab>('diagram')
  const [detailsTab, setDetailsTab] = useState<DetailsTab>('step')
  const [termId, setTermId] = useState<string | null>(null)
  const scenario = scenarioFor(player.broker)
  const current = clampStep(scenario, player.steps[player.broker])
  const step = scenario.steps[current]

  useEffect(() => savePlayerState(player), [player])
  useEffect(() => {
    history.replaceState(null, '', `#/message/s01?broker=${player.broker}`)
  }, [player.broker])

  const selectStep = (index: number) => {
    const next = clampStep(scenario, index)
    setPlayer((state) => ({ ...state, steps: { ...state.steps, [state.broker]: next } }))
  }

  const changeBroker = (broker: Broker) => {
    if (broker === player.broker) return
    const next = switchBroker(scenario, current, broker)
    setPlayer((state) => ({ broker, steps: { ...state.steps, [broker]: next } }))
  }

  return (
    <div className="min-h-dvh lg:flex lg:h-[calc(100dvh-61px)] lg:flex-col lg:overflow-hidden">
      <section className="border-b border-border bg-card px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><Badge>S01</Badge><span className="text-xs text-muted-foreground">Нормальный путь</span></div>
            <h1 className="mt-1.5 text-base font-semibold">{scenario.name}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex"><Check size={13} className="text-success" />Сохранено в браузере</span>
            <BrokerSwitch value={player.broker} onChange={changeBroker} />
          </div>
        </div>
        <p className="mt-2 max-w-4xl text-xs leading-relaxed text-muted-foreground">{scenario.description}</p>
        <label className="mt-3 block lg:hidden">
          <span className="sr-only">Текущий этап</span>
          <select value={current} onChange={(event) => selectStep(Number(event.target.value))} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/15">
            {scenario.steps.map((item, index) => <option key={item.id} value={index}>Шаг {index + 1} · {item.shortTitle}</option>)}
          </select>
        </label>
      </section>

      <nav className="grid grid-cols-3 border-b border-border bg-card px-2 py-1.5 lg:hidden" aria-label="Представления сценария">
        <MobileTabButton active={mobileTab === 'diagram'} onClick={() => setMobileTab('diagram')} icon={<Network size={14} />} label="Схема" />
        <MobileTabButton active={mobileTab === 'events'} onClick={() => setMobileTab('events')} icon={<List size={14} />} label="События" />
        <MobileTabButton active={mobileTab === 'details'} onClick={() => setMobileTab('details')} icon={<MessageSquareText size={14} />} label="Пояснение" />
      </nav>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[210px_minmax(0,1fr)_340px]">
        <aside className="hidden min-h-0 border-r border-border bg-card lg:block">
          <StageNavigator scenario={scenario} current={current} onSelect={selectStep} />
        </aside>

        <main className={cn('min-w-0 bg-background lg:min-h-0', mobileTab !== 'diagram' && 'hidden lg:block')} aria-label="Схема и управление сценарием">
          <div className="flex min-h-0 flex-col lg:h-full">
            <div className="min-h-0 overflow-auto scrollbar-thin lg:flex-1"><TopologyGraph scenario={scenario} step={step} /></div>
            <div className="hidden h-[238px] min-h-0 border-t border-border lg:block"><EventLog scenario={scenario} current={current} onSelect={selectStep} /></div>
            <PlayerControls scenario={scenario} current={current} onChange={selectStep} />
          </div>
        </main>

        {mobileTab === 'events' && <div className="min-h-[420px] bg-background lg:hidden"><EventLog scenario={scenario} current={current} onSelect={selectStep} /></div>}

        <aside className={cn('min-h-0 border-l border-border bg-card lg:flex lg:flex-col', mobileTab !== 'details' && 'hidden lg:flex')} aria-label="Пояснение и сообщение">
          <div className="grid grid-cols-2 gap-1 border-b border-border p-2">
            <DetailsTabButton active={detailsTab === 'step'} onClick={() => setDetailsTab('step')} icon={<BookOpen size={14} />} label="Текущий шаг" />
            <DetailsTabButton active={detailsTab === 'message'} onClick={() => setDetailsTab('message')} icon={<Mail size={14} />} label="Сообщение" />
          </div>
          <div className="min-h-0 overflow-auto scrollbar-thin lg:flex-1">
            {detailsTab === 'step' ? <StepExplanation step={step} onOpenTerm={setTermId} /> : <MessageInspector scenario={scenario} step={step} />}
          </div>
        </aside>
      </div>
      <GlossaryDialog termId={termId} onClose={() => setTermId(null)} />
    </div>
  )
}

function MobileTabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring', active && 'bg-secondary text-secondary-foreground')}>{icon}{label}</button>
}

function DetailsTabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring', active && 'bg-secondary text-secondary-foreground')}>{icon}{label}</button>
}
