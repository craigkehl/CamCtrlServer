import * as net from 'net';
import { EventEmitter } from 'events';
require('dotenv').config();

class ProjPJLinkPort extends EventEmitter {
  private socket: net.Socket;
  private connected = false;
  private readonly host: string;
  private readonly port: number;
  private _buffer: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(host: string, port: number) {
    super();
    this.host = host;
    this.port = port;
    this.socket = new net.Socket();
    this.attachHandlers();
    this.socket.connect(this.port, this.host);
    console.log(`Projector PJLink: connecting to ${this.host}:${this.port}`);
  }

  private attachHandlers(): void {
    this.socket.on('connect', () => {
      console.log(`Projector PJLink: TCP connected, waiting for banner...`);
    });

    this.socket.on('data', (data: Buffer) => {
      const msg = data.toString();
      if (!this.connected && msg.startsWith('PJLINK')) {
        this.connected = true;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        console.log(`Projector PJLink: ready (${msg.trim()})`);
        return;
      }
      this._buffer = msg;
      console.log('Projector PJLink response:', msg.trim());
      this.emit('readable');
    });

    this.socket.on('error', (err: Error) => {
      this.connected = false;
      console.log('Projector PJLink error:', err.message);
      this.emit('error', err);
      this.scheduleReconnect();
    });

    this.socket.on('close', () => {
      this.connected = false;
      console.log('Projector PJLink: disconnected');
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log(`Projector PJLink: reconnecting to ${this.host}:${this.port}`);
      this.socket.removeAllListeners();
      this.socket.destroy();
      this.socket = new net.Socket();
      this.attachHandlers();
      this.socket.connect(this.port, this.host);
    }, 5000);
  }

  read(): string | null {
    const buf = this._buffer;
    this._buffer = null;
    return buf;
  }

  writeAndRead(command: string, timeoutMs = 2000): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Projector PJLink not connected'));
        return;
      }
      const timer = setTimeout(() => {
        this.removeListener('readable', onReadable);
        reject(new Error('Projector response timeout'));
      }, timeoutMs);

      const onReadable = () => {
        clearTimeout(timer);
        resolve(this._buffer || '');
        this._buffer = null;
      };

      this.once('readable', onReadable);

      this.socket.write(command, (err) => {
        if (err) {
          clearTimeout(timer);
          this.removeListener('readable', onReadable);
          reject(err);
        }
      });
    });
  }

  write(command: string, callback?: (err?: Error | null) => void): void {
    if (!this.connected) {
      const err = new Error('Projector PJLink not connected');
      console.log(err.message);
      if (callback) callback(err);
      return;
    }
    console.log('Sending to projector:', command.trim());
    this.socket.write(command, (err) => {
      if (callback) callback(err ?? null);
    });
  }
}

const PROJ_PJLINK_HOST = process.env.PROJ_PJLINK_HOST || '192.168.108.11';
const PROJ_PJLINK_PORT = parseInt(process.env.PROJ_PJLINK_PORT || '4352', 10);

export const projPJLinkPort = new ProjPJLinkPort(PROJ_PJLINK_HOST, PROJ_PJLINK_PORT);
