import { useEffect, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { Button } from './components/ui/button'
import { GlossaryPage } from './pages/GlossaryPage'
import { MessagePage } from './pages/MessagePage'
import { ScenariosPage } from './pages/ScenariosPage'

export default function App() {
  const [hash, setHash] = useState(location.hash || '#/message/s01')
  useEffect(() => {
    if (!location.hash) history.replaceState(null, '', '#/message/s01')
    const update = () => setHash(location.hash)
    addEventListener('hashchange', update)
    return () => removeEventListener('hashchange', update)
  }, [])

  const path = hash.split('?')[0]
  const glossary = path.match(/^#\/glossary\/([a-z0-9-]+)$/)
  let page
  if (path === '#/' || path.startsWith('#/message/')) page = <MessagePage key={hash} />
  else if (path === '#/scenarios') page = <ScenariosPage />
  else if (glossary) page = <GlossaryPage termId={glossary[1]} />
  else if (path === '#/glossary') page = <GlossaryPage />
  else page = <main className="mx-auto max-w-lg px-5 py-16 text-center"><h1 className="text-xl font-semibold">Раздел не найден</h1><p className="mt-2 text-sm text-muted-foreground">Вернитесь к пути первого сообщения.</p><Button className="mt-5" onClick={() => { location.hash = '/message/s01' }}>Открыть сценарий</Button></main>

  return <><AppHeader hash={hash} />{page}</>
}
