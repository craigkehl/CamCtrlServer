import * as net from 'net';
import { EventEmitter } from 'events';
require('dotenv').config();

/**
 * TCP socket wrapper for direct IP control of ViewSonic LS831WU projector.
 * Connects directly to the projector's ethernet interface on port 5000 (default ViewSonic port).
 * Exposes the same .write() and .on() interface used by the SerialPort
 * projector connection, so the controller requires no changes.
 */
class ProjDirectPort extends EventEmitter {
  private socket: net.Socket;
  private connected = false;
  private readonly host: string;
  private readonly port: number;
  private _buffer: Buffer | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(host: string, port: number) {
    super();
    this.host = host;
    this.port = port;
    this.socket = new net.Socket();
    this.attachHandlers();
    this.socket.connect(this.port, this.host);
    console.log(`Projector direct IP: connecting to ${this.host}:${this.port}`);
  }

  private attachHandlers(): void {
    this.socket.on('connect', () => {
      this.connected = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      console.log(`Projector direct IP: connected to ${this.host}:${this.port}`);
    });

    this.socket.on('data', (data: Buffer) => {
      this._buffer = data;
      console.log('Projector response:', data);
      this.emit('readable');
    });

    this.socket.on('error', (err: Error) => {
      this.connected = false;
      console.log('Projector direct IP error:', err.message);
      this.emit('error', err);
      this.scheduleReconnect();
    });

    this.socket.on('close', () => {
      this.connected = false;
      console.log('Projector direct IP: disconnected');
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log(`Projector direct IP: reconnecting to ${this.host}:${this.port}`);
      this.socket.removeAllListeners();
      this.socket.destroy();
      this.socket = new net.Socket();
      this.attachHandlers();
      this.socket.connect(this.port, this.host);
    }, 5000);
  }

  /** Matches SerialPort's read() — called inside a 'readable' handler */
  read(): Buffer | null {
    const buf = this._buffer;
    this._buffer = null;
    return buf;
  }

  /** Matches SerialPort's write(data, callback) signature used by the controllers */
  write(data: number[], callback?: (err?: Error | null) => void): void {
    if (!this.connected) {
      const err = new Error('Projector direct IP not connected');
      console.log(err.message);
      if (callback) callback(err);
      return;
    }
    console.log('Sending to projector:', data.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
    this.socket.write(Uint8Array.from(data), (err) => {
      if (callback) callback(err ?? null);
    });
  }
}

const PROJ_DIRECT_HOST = process.env.PROJ_DIRECT_HOST || '192.168.108.11';
const PROJ_DIRECT_PORT = parseInt(process.env.PROJ_DIRECT_PORT || '5000', 10);

export const projDirectPort = new ProjDirectPort(PROJ_DIRECT_HOST, PROJ_DIRECT_PORT);
