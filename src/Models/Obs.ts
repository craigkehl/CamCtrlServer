import OBSWebSocket from 'obs-websocket-js';
require('dotenv').config();

import { onSceneChange } from '../Controllers/obs';

const obs = new OBSWebSocket();

const ADDRESS = process.env.OBS_ADDRESS || 'ws://192.168.108.2:4455';
const PASSWORD = process.env.OBS_PASSWORD;
console.log(ADDRESS);
console.log(PASSWORD);

export type ObsStatus = 'connecting' | 'connected' | 'unavailable';
let obsStatus: ObsStatus = 'connecting';
let isConnecting = false;

// Shared scene visibility state — authoritative for all connected devices
const DEFAULT_VISIBILITY: Record<string, boolean> = {
  'Live-Camera': true,
  'Christ-Pic': true,
  'Christ-Video': true,
};
let sceneVisibility: Record<string, boolean> = { ...DEFAULT_VISIBILITY };

// Session tracking for auto-reset (Option D)
let lastSceneChangeTime: number = 0;
let lastPollTime: number = 0;
const INACTIVITY_MS = 2 * 60 * 60 * 1000; // 2 hours
const POLL_GAP_MS   = 30 * 60 * 1000;     // 30 minutes

export function getObsStatus(): ObsStatus {
  return obsStatus;
}

// Exponential backoff: 1s, 2s, 4s, 8s, 16s — total ~31s before giving up
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000];

async function connectWithBackoff(): Promise<void> {
  if (isConnecting) return;
  isConnecting = true;
  obsStatus = 'connecting';

  for (let attempt = 0; attempt <= BACKOFF_DELAYS.length; attempt++) {
    try {
      const { obsWebSocketVersion, negotiatedRpcVersion } = await obs.connect(ADDRESS, PASSWORD);
      console.log(`OBS connected: ${obsWebSocketVersion} (RPC ${negotiatedRpcVersion})`);
      obsStatus = 'connected';
      isConnecting = false;
      return;
    } catch (error: any) {
      const delay = BACKOFF_DELAYS[attempt];
      if (delay === undefined) {
        console.error('OBS unavailable after all retries.');
        obsStatus = 'unavailable';
        isConnecting = false;
        return;
      }
      console.log(`OBS not ready (attempt ${attempt + 1}), retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export function reconnect(): void {
  connectWithBackoff();
}

export interface ObsFullState {
  connection: ObsStatus;
  currentScene: string | null;
  scenes: { name: string; isShow: boolean }[];
}

export async function getFullState(): Promise<ObsFullState> {
  const now = Date.now();

  // Auto-reset: poll gap > 30 min AND no scene changes for > 2 hours
  if (lastPollTime > 0 && (now - lastPollTime) > POLL_GAP_MS && (now - lastSceneChangeTime) > INACTIVITY_MS) {
    console.log('Session expired — resetting scene visibility to defaults');
    sceneVisibility = { ...DEFAULT_VISIBILITY };
  }
  lastPollTime = now;

  if (obsStatus !== 'connected') {
    return { connection: obsStatus, currentScene: null, scenes: [] };
  }

  try {
    const { currentProgramSceneName, scenes } = await obs.call('GetSceneList');
    const mergedScenes = (scenes as { sceneName: string }[]).map(s => ({
      name: s.sceneName,
      isShow: sceneVisibility[s.sceneName] ?? false,
    }));
    return { connection: 'connected', currentScene: currentProgramSceneName, scenes: mergedScenes };
  } catch {
    return { connection: obsStatus, currentScene: null, scenes: [] };
  }
}

export function toggleSceneVisibility(name: string, isShow: boolean): void {
  sceneVisibility[name] = isShow;
}

export function resetVisibility(): void {
  sceneVisibility = { ...DEFAULT_VISIBILITY };
}

export async function setCurrentScene(name: string): Promise<void> {
  if (obsStatus !== 'connected') throw new Error('OBS not connected');
  console.log('scene: ' + name);
  lastSceneChangeTime = Date.now();
  return await obs.call('SetCurrentProgramScene', { sceneName: name });
}

obs.on('CurrentProgramSceneChanged', event => {
  onSceneChange(event.sceneName);
});

obs.on('ExitStarted', () => {
  console.log('OBS started shutdown — will attempt reconnect');
  connectWithBackoff();
});

// Non-blocking — server starts immediately, OBS connects in background
connectWithBackoff();
