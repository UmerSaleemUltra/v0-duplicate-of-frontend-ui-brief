type ClientConnection = {
  id: string
  userId: string
  controller: ReadableStreamDefaultController
  lastPing: number
}

class SSEManager {
  private clients: Map<string, ClientConnection> = new Map()
  private pingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startPingInterval()
  }

  private startPingInterval() {
    if (this.pingInterval) return

    this.pingInterval = setInterval(() => {
      const now = Date.now()
      this.clients.forEach((client, id) => {
        try {
          client.controller.enqueue(`: ping\n\n`)
          client.lastPing = now
        } catch (error) {
          this.removeClient(id)
        }
      })
    }, 30000)
  }

  addClient(userId: string, controller: ReadableStreamDefaultController): string {
    const id = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`
    this.clients.set(id, {
      id,
      userId,
      controller,
      lastPing: Date.now(),
    })
    return id
  }

  removeClient(id: string) {
    this.clients.delete(id)
  }

  broadcast(userId: string, event: string, data: any) {
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          client.controller.enqueue(message)
        } catch (error) {
          this.removeClient(client.id)
        }
      }
    })
  }

  broadcastToAll(event: string, data: any) {
    this.clients.forEach((client) => {
      try {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        client.controller.enqueue(message)
      } catch (error) {
        this.removeClient(client.id)
      }
    })
  }

  getClientCount(): number {
    return this.clients.size
  }
}

export const sseManager = new SSEManager()
