/**
 * Phase 0 probe: send one RS-232 command to the projector through the ESP32
 * serial bridge (esp32-projector-bridge) and print the raw reply bytes.
 *
 * Usage:
 *   npx tsc && node dist/tools/projSerialProbe.js [command] [host] [port]
 *
 *   command  power-status (default) | power-on | power-off | blank-status | blank-on | blank-off
 *   host     defaults to PROJ_TCP_HOST, then 192.168.108.18 (bridge DHCP reservation)
 *   port     defaults to PROJ_TCP_PORT, then 8888
 *
 * Deliberately standalone: it does not import comport.ts, so running it never
 * touches the live PJLink transport the server uses.
 */
import * as net from 'net';
import Projector from '../Models/Projector';
require('dotenv').config();

const projector = new Projector();

const COMMANDS: Record<string, () => number[]> = {
  'power-status': () => projector.powerStatus(),
  'power-on':     () => projector.powerOn(),
  'power-off':    () => projector.powerOff(),
  'blank-status': () => projector.blankStatus(),
  'blank-on':     () => projector.blankOn(),
  'blank-off':    () => projector.blankOff(),
};

const OVERALL_TIMEOUT_MS = 3000;
const POLL_INTERVAL_MS = 10;

const hex = (bytes: number[]): string =>
  bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');

/**
 * Decide whether the bytes received so far form one complete projector reply.
 * Called every POLL_INTERVAL_MS once at least one byte has arrived.
 *
 * @param bytes            everything received since the command was sent
 * @param msSinceLastByte  time since the most recent byte arrived
 */
function replyIsComplete(bytes: number[], msSinceLastByte: number): boolean {
  // TODO(human)
  return false;
}

function main(): void {
  const [name = 'power-status', hostArg, portArg] = process.argv.slice(2);
  const build = COMMANDS[name];
  if (!build) {
    console.error(`Unknown command "${name}". Choose one of: ${Object.keys(COMMANDS).join(', ')}`);
    process.exit(2);
  }

  const host = hostArg || process.env.PROJ_TCP_HOST || '192.168.108.18';
  const port = parseInt(portArg || process.env.PROJ_TCP_PORT || '8888', 10);
  const command = build();

  const received: number[] = [];
  let sentAt = 0;
  let lastByteAt = 0;
  let poll: NodeJS.Timeout | undefined;

  const socket = new net.Socket();

  const finish = (outcome: string, exitCode: number): void => {
    if (poll) clearInterval(poll);
    socket.destroy();
    const elapsed = sentAt ? Date.now() - sentAt : 0;
    console.log(received.length
      ? `RX (${received.length} bytes, ${elapsed} ms): ${hex(received)}`
      : `RX: nothing after ${elapsed} ms`);
    console.log(outcome);
    // Set the code and let Node exit on its own: process.exit() can drop
    // buffered output when stdout is a pipe.
    process.exitCode = exitCode;
  };

  socket.on('data', (chunk: Buffer) => {
    received.push(...chunk);
    lastByteAt = Date.now();
  });
  socket.on('error', (err: Error) => finish(`Socket error: ${err.message}`, 1));

  socket.connect(port, host, () => {
    console.log(`Connected to bridge ${host}:${port}`);
    console.log(`TX ${name}: ${hex(command)}`);
    sentAt = Date.now();
    socket.write(Uint8Array.from(command));

    poll = setInterval(() => {
      if (received.length > 0 && replyIsComplete(received, Date.now() - lastByteAt)) {
        finish('Reply complete', 0);
      } else if (Date.now() - sentAt > OVERALL_TIMEOUT_MS) {
        finish(received.length
          ? 'Timed out before the reply looked complete'
          : 'No reply. Check TX/RX swap, baud rate, and that the projector has RS-232 control enabled', 1);
      }
    }, POLL_INTERVAL_MS);
  });
}

main();
