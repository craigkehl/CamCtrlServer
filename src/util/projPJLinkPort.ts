import * as net from 'net';
import * as crypto from 'crypto';
require('dotenv').config();

// PJLink is a connect-per-command protocol: connect → receive banner → send command → receive response → close.
// Keeping a persistent connection breaks because the projector closes it after each response.

class ProjPJLinkPort {
  private readonly host: string;
  private readonly port: number;
  private readonly password: string;

  constructor(host: string, port: number, password = '') {
    this.host = host;
    this.port = port;
    this.password = password;
    console.log(`Projector PJLink: ${this.host}:${this.port} (connect-per-command)`);
  }

  private runCommand(command: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let settled = false;
      let bannerReceived = false;
      let buffer = '';

      const done = (err: Error | null, result = '') => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        if (err) reject(err);
        else resolve(result);
      };

      const timer = setTimeout(
        () => done(new Error('Projector response timeout')),
        timeoutMs
      );

      socket.on('data', (data: Buffer) => {
        buffer += data.toString();

        if (!bannerReceived) {
          if (!buffer.includes('\n') && !buffer.includes('\r')) return;
          if (buffer.startsWith('PJLINK 0')) {
            bannerReceived = true;
            buffer = '';
            socket.write(command);
          } else if (buffer.startsWith('PJLINK 1 ')) {
            const randomNum = buffer.trim().split(' ')[2] ?? '';
            bannerReceived = true;
            buffer = '';
            const hash = crypto.createHash('md5')
              .update(randomNum + this.password)
              .digest('hex');
            socket.write(hash + command);
          } else {
            done(new Error(`Unexpected PJLink banner: ${buffer.trim()}`));
          }
          return;
        }

        if (buffer.includes('\r') || buffer.includes('\n')) {
          done(null, buffer);
        }
      });

      socket.on('error', (err) => done(err));

      socket.on('close', () => {
        if (!settled) {
          if (buffer.length > 0) {
            done(null, buffer);
          } else {
            done(new Error('Projector closed connection without response'));
          }
        }
      });

      socket.connect(this.port, this.host);
    });
  }

  writeAndRead(command: string, timeoutMs = 3000): Promise<string> {
    console.log('Projector PJLink query:', command.trim());
    return this.runCommand(command, timeoutMs);
  }

  write(command: string, callback?: (err?: Error | null) => void): void {
    console.log('Projector PJLink send:', command.trim());
    this.runCommand(command, 3000)
      .then(() => callback?.(null))
      .catch((err: Error) => {
        console.log('Projector PJLink error:', err.message);
        callback?.(err);
      });
  }
}

const PROJ_PJLINK_HOST = process.env.PROJ_PJLINK_HOST || '192.168.108.3';
const PROJ_PJLINK_PORT = parseInt(process.env.PROJ_PJLINK_PORT || '4352', 10);
const PROJ_PJLINK_PASSWORD = process.env.PROJ_PJLINK_PASSWORD || '';

export const projPJLinkPort = new ProjPJLinkPort(PROJ_PJLINK_HOST, PROJ_PJLINK_PORT, PROJ_PJLINK_PASSWORD);
