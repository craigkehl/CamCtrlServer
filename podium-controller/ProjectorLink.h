// Single owner of the projector's RS-232 line.
//
// Every request (buttons, HTTP, background polls) goes through enqueue().
// One command is in flight at a time: send → wait for a complete reply frame
// (or timeout) → short gap → next. Nothing else may touch the UART.
//
// Frame layout (same for commands and replies, verified on the bench 2026-10-24):
//   [type] [14 00] [len lo] [len hi] [payload × len] [checksum]
//   checksum = low byte of the sum of everything after the type byte.
// Reply types: 05 = status data, 03 = accepted, 00 = refused (e.g. already in that state).
#pragma once
#include <Arduino.h>
#include "config.h"

enum class Cmd : uint8_t { PowerOn, PowerOff, BlankOn, BlankOff, PowerStatus, BlankStatus };
enum class Power : uint8_t { Unknown, Off, On };
enum class Tri : uint8_t { Unknown, No, Yes };

inline const char* cmdName(Cmd c) {
  switch (c) {
    case Cmd::PowerOn:     return "power-on";
    case Cmd::PowerOff:    return "power-off";
    case Cmd::BlankOn:     return "blank-on";
    case Cmd::BlankOff:    return "blank-off";
    case Cmd::PowerStatus: return "power-status";
    case Cmd::BlankStatus: return "blank-status";
  }
  return "?";
}

class ProjectorLink {
public:
  // ---- state read by LEDs, web API, scenes ----
  Power    power = Power::Unknown;
  Tri      blank = Tri::Unknown;
  bool     linkOk = false;
  uint32_t lastReplyMs = 0;
  uint32_t transitionUntil = 0;   // cosmetic "settling" window after a power change
  uint32_t timeouts = 0, refusals = 0, badFrames = 0;   // counters for /api/status

  bool powerOnPending() const { return powerOnWantedUntil != 0; }
  bool inTransition() const { return transitionUntil && (int32_t)(transitionUntil - millis()) > 0; }

  void begin() {
    Serial1.begin(PROJ_BAUD, SERIAL_8N1, PIN_PROJ_RX, PIN_PROJ_TX);
    enqueue(Cmd::PowerStatus);
    enqueue(Cmd::BlankStatus);
  }

  // Intent-level requests. Use these rather than enqueue() for power.
  void requestPowerOn() {
    powerOnWantedUntil = millis() + POWER_ON_WANTED_MS;
    lastPowerOnAttempt = 0;   // try immediately on the next tick
  }
  void requestPowerOff() {
    powerOnWantedUntil = 0;
    enqueue(Cmd::PowerOff);
  }
  void requestBlank(bool on) { enqueue(on ? Cmd::BlankOn : Cmd::BlankOff); }
  void requestBlankToggle() { requestBlank(blank != Tri::Yes); }

  // Returns false if the queue is full. Duplicate queued commands are collapsed.
  bool enqueue(Cmd c) {
    for (uint8_t i = 0; i < qCount; i++) {
      if (queue[(qHead + i) % Q_SIZE] == c) return true;
    }
    if (qCount == Q_SIZE) return false;
    queue[(qHead + qCount) % Q_SIZE] = c;
    qCount++;
    return true;
  }

  void tick() {
    uint32_t now = millis();
    servicePowerOnIntent(now);
    schedulePolls(now);

    switch (phase) {
      case Phase::Idle:
        if (qCount && now - gapStart >= INTER_COMMAND_GAP_MS) sendNext(now);
        break;
      case Phase::Awaiting:
        readBytes(now);
        if (phase == Phase::Awaiting && now - sentAt >= REPLY_TIMEOUT_MS) onTimeout(now);
        break;
    }
  }

private:
  enum class Phase : uint8_t { Idle, Awaiting };
  static const uint8_t Q_SIZE = 8;
  static const uint8_t RX_MAX = 32;

  Phase    phase = Phase::Idle;
  Cmd      queue[Q_SIZE];
  uint8_t  qHead = 0, qCount = 0;
  Cmd      inFlight = Cmd::PowerStatus;
  bool     retried = false;
  uint8_t  consecutiveTimeouts = 0;
  uint32_t sentAt = 0, gapStart = 0;
  uint8_t  rx[RX_MAX];
  uint8_t  rxLen = 0;

  uint32_t lastPoll = 0, fastPollUntil = 0;
  uint32_t powerOnWantedUntil = 0, lastPowerOnAttempt = 0;

  // ---- frames (ported from src/Models/Projector.ts) ----
  static size_t buildFrame(Cmd c, uint8_t* out) {
    static const uint8_t POWER_ON[]     = {0x06,0x14,0x00,0x04,0x00,0x34,0x11,0x00,0x00,0x5D};
    static const uint8_t POWER_OFF[]    = {0x06,0x14,0x00,0x04,0x00,0x34,0x11,0x01,0x00,0x5E};
    static const uint8_t BLANK_ON[]     = {0x06,0x14,0x00,0x04,0x00,0x34,0x12,0x09,0x01,0x68};
    static const uint8_t BLANK_OFF[]    = {0x06,0x14,0x00,0x04,0x00,0x34,0x12,0x09,0x00,0x67};
    static const uint8_t POWER_STATUS[] = {0x07,0x14,0x00,0x05,0x00,0x34,0x00,0x00,0x11,0x00,0x5E};
    static const uint8_t BLANK_STATUS[] = {0x07,0x14,0x00,0x05,0x00,0x34,0x00,0x00,0x12,0x09,0x68};
    const uint8_t* src; size_t n;
    switch (c) {
      case Cmd::PowerOn:     src = POWER_ON;     n = sizeof(POWER_ON);     break;
      case Cmd::PowerOff:    src = POWER_OFF;    n = sizeof(POWER_OFF);    break;
      case Cmd::BlankOn:     src = BLANK_ON;     n = sizeof(BLANK_ON);     break;
      case Cmd::BlankOff:    src = BLANK_OFF;    n = sizeof(BLANK_OFF);    break;
      case Cmd::PowerStatus: src = POWER_STATUS; n = sizeof(POWER_STATUS); break;
      default:               src = BLANK_STATUS; n = sizeof(BLANK_STATUS); break;
    }
    memcpy(out, src, n);
    return n;
  }

  static bool isQuery(Cmd c) { return c == Cmd::PowerStatus || c == Cmd::BlankStatus; }

  void schedulePolls(uint32_t now) {
    uint32_t interval = (int32_t)(fastPollUntil - now) > 0 ? POLL_FAST_MS : POLL_IDLE_MS;
    if (now - lastPoll >= interval) {
      lastPoll = now;
      enqueue(Cmd::PowerStatus);
      if (power == Power::On) enqueue(Cmd::BlankStatus);
    }
  }

  // Keep asking for power-on until the projector accepts it or the window closes.
  void servicePowerOnIntent(uint32_t now) {
    if (!powerOnWantedUntil) return;
    if (power == Power::On || (int32_t)(powerOnWantedUntil - now) <= 0) {
      powerOnWantedUntil = 0;
      return;
    }
    if (lastPowerOnAttempt == 0 || now - lastPowerOnAttempt >= POWER_ON_RETRY_MS) {
      lastPowerOnAttempt = now;
      enqueue(Cmd::PowerOn);
    }
  }

  void sendNext(uint32_t now) {
    inFlight = queue[qHead];
    qHead = (qHead + 1) % Q_SIZE;
    qCount--;
    retried = false;
    transmit(now);
  }

  void transmit(uint32_t now) {
    uint8_t frame[16];
    size_t n = buildFrame(inFlight, frame);
    while (Serial1.available()) Serial1.read();   // drop stale bytes
    Serial1.write(frame, n);
    rxLen = 0;
    sentAt = now;
    phase = Phase::Awaiting;
  }

  void readBytes(uint32_t now) {
    while (Serial1.available() && rxLen < RX_MAX) {
      rx[rxLen++] = (uint8_t)Serial1.read();
      // Resync: a valid frame starts with a known type followed by 0x14.
      while (rxLen >= 2 && !(isReplyType(rx[0]) && rx[1] == 0x14)) dropFront(1);
      if (rxLen == 1 && !isReplyType(rx[0])) dropFront(1);

      size_t total;
      if (frameComplete(total)) {
        if (checksumOk(total)) {
          onReply(now, total);
        } else {
          badFrames++;
          Serial.println("[link] bad checksum, dropping frame");
          dropFront(total);
          continue;
        }
        return;
      }
    }
    if (rxLen >= RX_MAX) { badFrames++; rxLen = 0; }
  }

  static bool isReplyType(uint8_t t) { return t == 0x00 || t == 0x03 || t == 0x05; }

  bool frameComplete(size_t& total) const {
    if (rxLen < 5) return false;
    total = 6 + (size_t)(rx[3] | (rx[4] << 8));
    return rxLen >= total;
  }

  bool checksumOk(size_t total) const {
    uint8_t sum = 0;
    for (size_t i = 1; i + 1 < total; i++) sum += rx[i];
    return sum == rx[total - 1];
  }

  void dropFront(size_t n) {
    if (n >= rxLen) { rxLen = 0; return; }
    memmove(rx, rx + n, rxLen - n);
    rxLen -= n;
  }

  void onReply(uint32_t now, size_t total) {
    uint8_t type = rx[0];
    uint8_t value = (total >= 9) ? rx[total - 2] : 0;   // last payload byte
    consecutiveTimeouts = 0;
    linkOk = true;
    lastReplyMs = now;

    if (type == 0x05 && inFlight == Cmd::PowerStatus) {
      Power next = value ? Power::On : Power::Off;
      if (power != Power::Unknown && next != power) startTransition(now);   // e.g. IR remote
      power = next;
      if (power == Power::Off) blank = Tri::Unknown;
    } else if (type == 0x05 && inFlight == Cmd::BlankStatus) {
      blank = value ? Tri::Yes : Tri::No;
    } else if (type == 0x03) {
      applyAccepted(now);
    } else if (type == 0x00) {
      // Refused. Usually "already in that state"; a status poll settles the truth.
      refusals++;
      Serial.printf("[link] %s refused (00)\n", cmdName(inFlight));
      enqueue(Cmd::PowerStatus);
      if (inFlight == Cmd::BlankOn || inFlight == Cmd::BlankOff) enqueue(Cmd::BlankStatus);
    }
    finish(now);
  }

  void applyAccepted(uint32_t now) {
    switch (inFlight) {
      case Cmd::PowerOn:  power = Power::On;  powerOnWantedUntil = 0; startTransition(now); break;
      case Cmd::PowerOff: power = Power::Off; blank = Tri::Unknown;   startTransition(now); break;
      case Cmd::BlankOn:  blank = Tri::Yes; break;
      case Cmd::BlankOff: blank = Tri::No;  break;
      default: break;
    }
    fastPollUntil = now + POLL_FAST_WINDOW_MS;
    Serial.printf("[link] %s accepted\n", cmdName(inFlight));
  }

  void startTransition(uint32_t now) { transitionUntil = now + POWER_TRANSITION_MS; }

  void onTimeout(uint32_t now) {
    if (!retried) {
      retried = true;
      transmit(now);
      return;
    }
    timeouts++;
    if (++consecutiveTimeouts >= LINK_FAILS_BEFORE_DOWN && linkOk) {
      linkOk = false;
      Serial.println("[link] projector not responding");
    }
    Serial.printf("[link] %s timed out\n", cmdName(inFlight));
    finish(now);
  }

  void finish(uint32_t now) {
    rxLen = 0;
    phase = Phase::Idle;
    gapStart = now;
  }
};
