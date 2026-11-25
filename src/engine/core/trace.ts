export interface TraceSpan {
  id: string
  traceId: string
  parentId: string | null
  service: string
  name: string
  start: number
  duration: number
  orderId: string
  eventId: string
  messageId?: string
  causedBy?: string
}

const mainTrace = '8f2a6c1d9e4b4a7f8c3d2e1a0b9f0011'
const brokenTrace = 'b71c2a9d4e6f48a19b3c5d7e0f2a1122'
const spanId = (value: number) => value.toString(16).padStart(16, '0')

export function buildTrace(slowBilling: boolean, broken: boolean): TraceSpan[] {
  const billingDuration = slowBilling ? 220 : 80
  const shift = slowBilling ? 140 : 0
  const downstreamTrace = broken ? brokenTrace : mainTrace
  return [
    { id: spanId(1), traceId: mainTrace, parentId: null, service: 'order-api', name: 'HTTP POST /orders', start: 0, duration: 40, orderId: 'order-1042', eventId: 'http-1042' },
    { id: spanId(2), traceId: mainTrace, parentId: spanId(1), service: 'order-api', name: 'SEND orders · OrderCreated', start: 40, duration: 10, orderId: 'order-1042', eventId: 'evt-017', messageId: 'msg-017', causedBy: 'http-1042' },
    { id: spanId(3), traceId: downstreamTrace, parentId: broken ? null : spanId(2), service: 'billing', name: 'PROCESS OrderCreated', start: 70, duration: billingDuration, orderId: 'order-1042', eventId: 'evt-017', messageId: 'msg-017', causedBy: 'http-1042' },
    { id: spanId(4), traceId: downstreamTrace, parentId: spanId(3), service: 'billing', name: 'SEND payments · PaymentProcessed', start: 150 + shift, duration: 10, orderId: 'order-1042', eventId: 'evt-018', messageId: 'msg-018', causedBy: 'evt-017' },
    { id: spanId(5), traceId: downstreamTrace, parentId: spanId(4), service: 'inventory', name: 'PROCESS PaymentProcessed', start: 180 + shift, duration: 70, orderId: 'order-1042', eventId: 'evt-018', messageId: 'msg-018', causedBy: 'evt-017' },
    { id: spanId(6), traceId: downstreamTrace, parentId: spanId(4), service: 'notifications', name: 'PROCESS PaymentProcessed', start: 200 + shift, duration: 50, orderId: 'order-1042', eventId: 'evt-018', messageId: 'msg-018', causedBy: 'evt-017' },
  ]
}

export function traceParent(span: TraceSpan) {
  return `00-${span.traceId}-${span.id}-01`
}
