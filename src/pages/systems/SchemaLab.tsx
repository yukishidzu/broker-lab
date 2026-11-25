import { useState } from 'react'
import { ArrowDown, ArrowUpRight, Check, X } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { evaluateSchemaChange, schemaChanges, type CompatibilityMode } from '../../engine/schema/compatibility'
import { cn } from '../../lib/utils'

export function SchemaLab() {
  const [changeId, setChangeId] = useState(schemaChanges[0].id)
  const [mode, setMode] = useState<CompatibilityMode>('BACKWARD')
  const change = schemaChanges.find((item) => item.id === changeId)!
  const result = evaluateSchemaChange(change, mode)

  return (
    <div>
      <div className="max-w-3xl"><Badge>Контракт данных</Badge><h2 className="mt-3 text-lg font-semibold">Schema evolution и совместимость</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Проверка одной пары соседних Avro-like схем. Модель объясняет направления чтения; BACKWARD_TRANSITIVE и FORWARD_TRANSITIVE со всеми предыдущими версиями здесь не эмулируются.</p></div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-card p-4" aria-label="Изменение схемы">
          <h3 className="text-sm font-semibold">Что изменилось</h3>
          <div className="mt-3 space-y-1">{schemaChanges.map((item) => <button key={item.id} type="button" aria-pressed={changeId === item.id} onClick={() => setChangeId(item.id)} className={cn('w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-xs leading-relaxed hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring', changeId === item.id ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground')}>{item.title}</button>)}</div>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compatibility mode</h3>
          <div className="mt-2 grid grid-cols-2 gap-1.5">{(['BACKWARD', 'FORWARD', 'FULL', 'NONE'] as const).map((item) => <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)} className={cn('cursor-pointer rounded-lg border border-border px-2 py-2 font-mono text-[11px] hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring', mode === item && 'border-primary/60 bg-primary/10 text-primary')}>{item}</button>)}</div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4" aria-label="Результат совместимости">
          <h3 className="font-semibold">{change.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{change.description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2"><Schema title="Schema v1" value={change.v1} /><Schema title="Schema v2" value={change.v2} /></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2"><Direction title="BACKWARD" subtitle="Reader v2 читает данные writer v1" ok={result.backward} /><Direction title="FORWARD" subtitle="Reader v1 читает данные writer v2" ok={result.forward} /></div>
          <div className={cn('mt-4 rounded-xl p-4', result.allowed ? 'bg-success/10' : 'bg-destructive/10')}><div className="flex items-start gap-2">{result.allowed ? <Check size={18} className="mt-0.5 text-success" /> : <X size={18} className="mt-0.5 text-destructive" />}<div><p className="text-sm font-semibold">{mode === 'NONE' ? 'Проверка отключена' : result.allowed ? `Проверка ${mode} пройдена` : `Проверка ${mode} отклонит регистрацию`}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{change.note}</p></div></div></div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/70 p-3 text-xs leading-relaxed text-muted-foreground"><ArrowDown size={15} className="shrink-0" />Registry проверяет схему writer по настроенному правилу. Это не доказывает корректность бизнес-значений и не заменяет reader compatibility в каждом consumer.</div>
        </section>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3"><Info title="BACKWARD">Новый consumer со схемой v2 читает старые сообщения v1. Обычно позволяет обновить consumers раньше producers.</Info><Info title="FORWARD">Старый consumer v1 читает новые сообщения v2. Обычно позволяет обновить producers раньше consumers.</Info><Info title="FULL">Нужны оба направления. Transitive-варианты проверяют не только последнюю, но и более ранние зарегистрированные версии.</Info></div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs"><a href="https://avro.apache.org/docs/1.12.0/specification/#schema-resolution" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Avro — schema resolution<ArrowUpRight size={12} /></a><a href="https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Schema Registry — evolution<ArrowUpRight size={12} /></a></div>
    </div>
  )
}

function Schema({ title, value }: { title: string; value: Record<string, unknown> }) {
  return <div><p className="mb-1.5 font-mono text-[11px] font-medium text-muted-foreground">{title}</p><pre className="code-block h-full">{JSON.stringify(value, null, 2)}</pre></div>
}

function Direction({ title, subtitle, ok }: { title: string; subtitle: string; ok: boolean }) {
  return <div className={cn('rounded-lg border p-3', ok ? 'border-success/30 bg-success/10' : 'border-destructive/30 bg-destructive/10')}><div className="flex items-center gap-2"><span className={ok ? 'text-success' : 'text-destructive'}>{ok ? <Check size={15} /> : <X size={15} />}</span><p className="font-mono text-xs font-semibold">{title}</p></div><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p></div>
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="rounded-xl border border-border bg-card p-4"><h3 className="font-mono text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{children}</p></article>
}
