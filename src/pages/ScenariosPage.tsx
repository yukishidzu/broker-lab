import { ArrowRight, Check, Gauge, Network, ShieldCheck, Split, TimerReset, UsersRound } from 'lucide-react'
import { scenarioList } from '../content/scenarios'
import { Badge } from '../components/ui/badge'

export function ScenariosPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="max-w-2xl">
        <Badge>Каталог</Badge>
        <h1 className="mt-3 text-xl font-semibold">Сценарии пути сообщения</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Откройте готовый запуск и переходите между этапами. Переключатель брокера сохраняет смысловую контрольную точку, даже если внутренние шаги различаются.</p>
      </div>
      <section className="mt-7" aria-labelledby="normal-path">
        <div className="mb-4 flex items-center justify-between"><h2 id="normal-path" className="text-base font-semibold">Нормальный путь</h2><span className="text-xs text-muted-foreground">1 сценарий · 2 модели</span></div>
        <div className="grid gap-4 md:grid-cols-2">
          {scenarioList.map((scenario) => (
            <a key={scenario.broker} href={`#/message/s01?broker=${scenario.broker}`} className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">{scenario.broker === 'rabbitmq' ? <Split size={19} /> : <Network size={19} />}</span>
                <ArrowRight size={17} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div className="mt-5 flex items-center gap-2"><Badge>S01</Badge><Badge>{scenario.broker === 'rabbitmq' ? 'RabbitMQ' : 'Kafka'}</Badge></div>
              <h3 className="mt-3 font-semibold">Первое сообщение</h3>
              <p className="mt-2 min-h-16 text-sm leading-relaxed text-muted-foreground">{scenario.description}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground"><span>{scenario.steps.length} шагов</span><span className="inline-flex items-center gap-1"><Check size={12} className="text-success" />Журнал и инспектор</span></div>
            </a>
          ))}
        </div>
      </section>
      <section className="mt-10" aria-labelledby="practical-labs">
        <div className="mb-4"><h2 id="practical-labs" className="text-base font-semibold">Практические разборы</h2><p className="mt-1 text-xs text-muted-foreground">Отдельные модели для отказов, подтверждений и распределения partitions.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <a href="#/delivery" className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"><ShieldCheck size={22} className="text-primary" /><h3 className="mt-4 font-semibold">Гарантии доставки</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">At most once, at least once и Kafka transactions. Сбой до/после эффекта, redelivery и идемпотентность.</p><span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">Открыть разбор<ArrowRight size={14} /></span></a>
          <a href="#/kafka-groups" className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"><UsersRound size={22} className="text-primary" /><h3 className="mt-4 font-semibold">Kafka consumer groups</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Настройка partitions и consumers, 4 consumers на 2 partitions, несколько partitions на consumer, две группы и rebalance.</p><span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">Открыть лабораторию<ArrowRight size={14} /></span></a>
        </div>
      </section>
      <section className="mt-10" aria-labelledby="advanced-labs"><div className="mb-4"><h2 id="advanced-labs" className="text-base font-semibold">Дополнительные лаборатории</h2><p className="mt-1 text-xs text-muted-foreground">Настраиваемые модели для отдельных механизмов брокеров.</p></div><div className="grid gap-4 md:grid-cols-3">
        <LabLink href="#/labs/routing" icon={<Split size={20} />} title="RabbitMQ routing">Direct, topic, fanout и headers exchanges, bindings, копии сообщений и unroutable.</LabLink>
        <LabLink href="#/labs/retry" icon={<TimerReset size={20} />} title="Retry и DLQ">Backoff, poison message, delivery-limit, DLX и прикладные retry/DLQ topics Kafka.</LabLink>
        <LabLink href="#/labs/capacity" icon={<Gauge size={20} />} title="Capacity и lag">Входящий темп, время обработки, partitions, consumers и накопление lag/backlog.</LabLink>
      </div></section>
      <section className="mt-10 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Что смотреть в обоих вариантах</h2>
        <div className="mt-3 grid gap-3 text-sm leading-relaxed text-muted-foreground md:grid-cols-3">
          <p><strong className="font-medium text-foreground">Подтверждение producer</strong><br />Брокер принял сообщение, но это ещё не бизнес-обработка.</p>
          <p><strong className="font-medium text-foreground">Внешний эффект</strong><br />Платёж уже записан, хотя ack или commit ещё не выполнен.</p>
          <p><strong className="font-medium text-foreground">Завершение</strong><br />RabbitMQ удаляет сообщение после ack, Kafka сохраняет запись после commit.</p>
        </div>
      </section>
    </main>
  )
}


function LabLink({ href, icon, title, children }: { href: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <a href={href} className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"><span className="text-primary">{icon}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p><span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">Открыть<ArrowRight size={14} /></span></a>
}
