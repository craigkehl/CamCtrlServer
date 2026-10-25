import * as net from 'net';
import { EventEmitter } from 'events';
require('dotenv').config();

type AuthState = 'banner' | 'password_sent' | 'ready';

class ExtronPort extends EventEmitter {
  private socket: net.Socket;
  private _connected = false;
  private _authState: AuthState = 'banner';
  private readonly host: string;
  private readonly port: number;
  private readonly password: string;
  private _buffer: string = '';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private _busy = false;
  private _queue: Array<() => void> = [];

  constructor(host: string, port: number, password: string) {
    super();
    this.host = host;
    this.port = port;
    this.password = password;
    this.socket = new net.Socket();
    this.attachHandlers();
    this.socket.connect(this.port, this.host);
    console.log(`Extron IN1808: connecting to ${this.host}:${this.port}`);
  }

  get connected(): boolean {
    return this._connected;
  }

  private attachHandlers(): void {
    this.socket.on('connect', () => {
      console.log(`Extron IN1808: TCP connected, waiting for banner...`);
    });

    this.socket.on('data', (data: Buffer) => {
      const msg = data.toString();
      this._buffer += msg;

      if (this._authState !== 'ready') {
        if (this._authState === 'banner' && this._buffer.includes('Password:')) {
          // Banner arrived first, now Password: prompt is here — send credentials
          console.log(`Extron IN1808: sending password`);
          this._buffer = '';
          this._authState = 'password_sent';
          this.socket.write(this.password + '\r');
          return;
        }
        if (this._authState === 'password_sent' && (this._buffer.includes('\n') || this._buffer.includes('\r'))) {
          // Login confirmation line received — now ready for commands
          this._connected = true;
          this._authState = 'ready';
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          console.log(`Extron IN1808: ready (${this._buffer.trim()})`);
          this._buffer = '';
          return;
        }
        // Still accumulating banner or waiting for confirmation
        return;
      }

      // Emit readable when we have a complete line
      if (this._buffer.includes('\r') || this._buffer.includes('\n')) {
        console.log('Extron IN1808 response:', this._buffer.trim());
        this.emit('readable');
      }
    });

    this.socket.on('error', (err: Error) => {
      this._connected = false;
      console.log('Extron IN1808 error:', err.message);
      this.scheduleReconnect();
    });

    this.socket.on('close', () => {
      this._connected = false;
      console.log('Extron IN1808: disconnected');
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log(`Extron IN1808: reconnecting to ${this.host}:${this.port}`);
      this.socket.removeAllListeners();
      this.socket.destroy();
      this._buffer = '';
      this._connected = false;
      this._authState = 'banner';
      this.socket = new net.Socket();
      this.attachHandlers();
      this.socket.connect(this.port, this.host);
    }, 5000);
  }

  readBuffer(): string {
    const buf = this._buffer;
    this._buffer = '';
    return buf;
  }

  writeAndRead(command: string, timeoutMs = 2000): Promise<string> {
    return new Promise((resolve, reject) => {
      const execute = () => {
        if (!this._connected) {
          this._busy = false;
          this._dequeue();
          reject(new Error('Extron IN1808 not connected'));
          return;
        }
        this._buffer = '';

        const done = (fn: () => void) => {
          this._busy = false;
          this._dequeue();
          fn();
        };

        const timer = setTimeout(() => {
          this.removeListener('readable', onReadable);
          done(() => reject(new Error('Extron IN1808 response timeout')));
        }, timeoutMs);

        const onReadable = () => {
          clearTimeout(timer);
          const response = this._buffer.trim();
          this._buffer = '';
          done(() => resolve(response));
        };

        this.once('readable', onReadable);

        this.socket.write(command + '\r', (err) => {
          if (err) {
            clearTimeout(timer);
            this.removeListener('readable', onReadable);
            done(() => reject(err));
          }
        });
      };

      if (this._busy) {
        this._queue.push(execute);
      } else {
        this._busy = true;
        execute();
      }
    });
  }

  private _dequeue(): void {
    const next = this._queue.shift();
    if (next) {
      this._busy = true;
      next();
    }
  }

  write(command: string, callback?: (err?: Error | null) => void): void {
    if (!this._connected) {
      const err = new Error('Extron IN1808 not connected');
      console.log(err.message);
      if (callback) callback(err);
      return;
    }
    console.log('Sending to Extron IN1808:', command.trim());
    this.socket.write(command + '\r', (err) => {
      if (callback) callback(err ?? null);
    });
  }
}

const EXTRON_HOST = process.env.EXTRON_HOST || '192.168.108.19';
const EXTRON_PORT = parseInt(process.env.EXTRON_PORT || '23', 10);
const EXTRON_PASSWORD = process.env.EXTRON_PASSWORD || '';

export const extronPort = new ExtronPort(EXTRON_HOST, EXTRON_PORT, EXTRON_PASSWORD);
