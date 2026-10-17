/**
 * A small WebSocket server (RFC 6455) on node:http's `upgrade` event — no
 * dependency. Text frames only (JSON), fragmented messages, ping/pong
 * keep-alive, close handshake. Client frames must be masked; messages are
 * capped at 64 KB. Enough for classroom games; nothing more.
 */
import { createHash } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
export const MAX_MESSAGE = 64 * 1024;
const PING_MS = 25_000;

export interface WsConn {
  readonly id: number;
  send(data: unknown): void;
  close(code?: number, reason?: string): void;
  onMessage(fn: (data: unknown) => void): void;
  onClose(fn: () => void): void;
  readonly open: boolean;
}

/** The value of Sec-WebSocket-Accept for a client key. */
export const acceptKey = (key: string) => createHash('sha1').update(key + GUID).digest('base64');

/** Encodes one unmasked server frame. */
export function encodeFrame(opcode: number, payload: Buffer): Buffer {
  const len = payload.length;
  let head: Buffer;
  if (len < 126) {
    head = Buffer.from([0x80 | opcode, len]);
  } else if (len < 65536) {
    head = Buffer.alloc(4);
    head[0] = 0x80 | opcode;
    head[1] = 126;
    head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x80 | opcode;
    head[1] = 127;
    head.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([head, payload]);
}

export interface Frame {
  fin: boolean;
  opcode: number;
  payload: Buffer;
}

/**
 * Reads as many complete frames as `buf` holds. Returns them and the bytes
 * left over; throws on a protocol error (unmasked client frame, too large).
 */
export function decodeFrames(buf: Buffer): { frames: Frame[]; rest: Buffer } {
  const frames: Frame[] = [];
  let off = 0;
  while (buf.length - off >= 2) {
    const b0 = buf[off];
    const b1 = buf[off + 1];
    const masked = (b1 & 0x80) !== 0;
    if (!masked) throw new Error('unmasked');
    let len = b1 & 0x7f;
    let p = off + 2;
    if (len === 126) {
      if (buf.length - p < 2) break;
      len = buf.readUInt16BE(p);
      p += 2;
    } else if (len === 127) {
      if (buf.length - p < 8) break;
      const big = buf.readBigUInt64BE(p);
      if (big > BigInt(MAX_MESSAGE)) throw new Error('too large');
      len = Number(big);
      p += 8;
    }
    if (len > MAX_MESSAGE) throw new Error('too large');
    if (buf.length - p < 4 + len) break;
    const mask = buf.subarray(p, p + 4);
    p += 4;
    const payload = Buffer.alloc(len);
    for (let i = 0; i < len; i++) payload[i] = buf[p + i] ^ mask[i & 3];
    frames.push({ fin: (b0 & 0x80) !== 0, opcode: b0 & 0x0f, payload });
    off = p + len;
  }
  return { frames, rest: buf.subarray(off) };
}

let nextId = 1;

/** Completes the handshake and returns the connection, or null after refusing. */
export function acceptUpgrade(req: IncomingMessage, socket: Duplex): WsConn | null {
  const key = req.headers['sec-websocket-key'];
  if (typeof key !== 'string' || req.headers['sec-websocket-version'] !== '13' || !/websocket/i.test(String(req.headers.upgrade))) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return null;
  }
  socket.write(['HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${acceptKey(key)}`, '', ''].join('\r\n'));

  const messageFns: Array<(d: unknown) => void> = [];
  const closeFns: Array<() => void> = [];
  let open = true;
  let pending: Buffer = Buffer.alloc(0);
  let fragments: Buffer[] = [];
  let fragmentSize = 0;
  let alive = true;

  const raw = (opcode: number, payload: Buffer) => {
    if (open && !socket.destroyed) socket.write(encodeFrame(opcode, payload));
  };
  const finish = () => {
    if (!open) return;
    open = false;
    clearInterval(ping);
    for (const fn of closeFns) fn();
  };
  const conn: WsConn = {
    id: nextId++,
    send: (data) => raw(0x1, Buffer.from(JSON.stringify(data), 'utf8')),
    close: (code = 1000, reason = '') => {
      if (!open) return;
      const body = Buffer.alloc(2 + Buffer.byteLength(reason));
      body.writeUInt16BE(code, 0);
      body.write(reason, 2);
      raw(0x8, body);
      finish();
      socket.end();
    },
    onMessage: (fn) => messageFns.push(fn),
    onClose: (fn) => closeFns.push(fn),
    get open() {
      return open;
    },
  };

  // keep-alive: a connection that misses a pong is dropped (the client reconnects)
  const ping = setInterval(() => {
    if (!alive) {
      socket.destroy();
      return;
    }
    alive = false;
    raw(0x9, Buffer.alloc(0));
  }, PING_MS);
  ping.unref?.();

  socket.on('data', (chunk: Buffer) => {
    pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
    let frames: Frame[];
    try {
      ({ frames, rest: pending } = decodeFrames(pending));
    } catch {
      conn.close(1009, 'protocol');
      return;
    }
    for (const f of frames) {
      if (f.opcode === 0x8) {
        conn.close(1000);
        return;
      }
      if (f.opcode === 0x9) {
        raw(0xa, f.payload);
        continue;
      }
      if (f.opcode === 0xa) {
        alive = true;
        continue;
      }
      if (f.opcode !== 0x1 && f.opcode !== 0x0) continue; // binary frames are not used
      fragments.push(f.payload);
      fragmentSize += f.payload.length;
      if (fragmentSize > MAX_MESSAGE) {
        conn.close(1009, 'too large');
        return;
      }
      if (!f.fin) continue;
      const text = Buffer.concat(fragments).toString('utf8');
      fragments = [];
      fragmentSize = 0;
      alive = true;
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        continue;
      }
      for (const fn of messageFns) fn(data);
    }
  });
  socket.on('close', finish);
  socket.on('error', finish);
  return conn;
}
