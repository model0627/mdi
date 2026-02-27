import { mdStore } from '@/lib/mdStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let clientId = '';

  const stream = new ReadableStream({
    async start(controller) {
      await mdStore.init();

      clientId = Math.random().toString(36).slice(2);
      const client = { id: clientId, controller, encoder };
      mdStore.addClient(client);

      // Send initial full state
      const initial = mdStore.getAll();
      const data = `event: init\ndata: ${JSON.stringify(initial)}\n\n`;
      controller.enqueue(encoder.encode(data));

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Store heartbeat ref for cleanup
      (client as { heartbeat?: ReturnType<typeof setInterval> }).heartbeat =
        heartbeat;
    },
    cancel() {
      mdStore.removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
