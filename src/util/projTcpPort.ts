import * as net from 'net';
import { EventEmitter } from 'events';
require('dotenv').config();

/**
 * TCP socket wrapper for the ESP32 WiFi-to-serial projector bridge.
 * Exposes the same .write() and .on() interface used by the SerialPort
 * projector connection, so the controller requires no changes.
 */
class ProjTcpPort extends EventEmitter {
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
    console.log(`Projector TCP bridge: connecting to ${this.host}:${this.port}`);
  }

  private attachHandlers(): void {
    this.socket.on('connect', () => {
      this.connected = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      console.log(`Projector TCP bridge: connected to ${this.host}:${this.port}`);
    });

    this.socket.on('data', (data: Buffer) => {
      this._buffer = data;
      this.emit('readable');
    });

    this.socket.on('error', (err: Error) => {
      this.connected = false;
      console.log('Projector TCP bridge error:', err.message);
      this.emit('error', err);
      this.scheduleReconnect();
    });

    this.socket.on('close', () => {
      this.connected = false;
      console.log('Projector TCP bridge: disconnected');
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log(`Projector TCP bridge: reconnecting to ${this.host}:${this.port}`);
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
      const err = new Error('Projector TCP bridge not connected');
      console.log(err.message);
      if (callback) callback(err);
      return;
    }
    this.socket.write(Uint8Array.from(data), (err) => {
      if (callback) callback(err ?? null);
    });
  }
}

const PROJ_TCP_HOST = process.env.PROJ_TCP_HOST || '192.168.1.100';
const PROJ_TCP_PORT = parseInt(process.env.PROJ_TCP_PORT || '8888', 10);

export const projTcpPort = new ProjTcpPort(PROJ_TCP_HOST, PROJ_TCP_PORT);
