import dotenv from 'dotenv';
import os from 'os';
import OBSWebSocket, {
  EventSubscription,
  OBSEventTypes,
  OBSRequestTypes,
  OBSResponseTypes,
} from 'obs-websocket-js';
import { exec } from 'child_process';

import { onSceneChange } from '../Controllers/obs';

//TODO: Update to only connect to OBS if it is needed
//TODO: Refine connection logic: Check if not connected, if not check if OBS is running, ect...
dotenv.config({ path: os.platform() === "win32" ? '.env.windows' : '.env.macos' });

const OBS_APP_PATH = process.env.OBS_APP_PATH || 'C:\\path\\to\\OBS\\obs64.exe';
const ADDRESS = process.env.OBS_ADDRESS || 'ws://192.168.108.2:4455';
const PASSWORD = process.env.OBS_PASSWORD;

let isOBSRunning = false;
let isSocketConnected = false;

const obsSocket = new OBSWebSocket();

async function connect(): Promise<void> {
  try {
    const { obsWebSocketVersion, negotiatedRpcVersion } = await obsSocket.connect(
      ADDRESS,
      PASSWORD
    );
    console.log(
      `Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`
    );
    isSocketConnected = true;
  } catch (error: any) {
    console.error('Failed to connect to OBS', error.code, error.message);
  }
}

export async function getCurrentScene(): Promise<Object> {
  const { currentProgramSceneName } = await obsSocket.call('GetCurrentProgramScene');
  return currentProgramSceneName;
}

export async function setCurrentScene(name: string): Promise<void> {
  console.log('scene: ' + name);
  return await obsSocket.call('SetCurrentProgramScene', { sceneName: name });
}

obsSocket.on('CurrentProgramSceneChanged', event => {
  onSceneChange(event.sceneName)

});

obsSocket.once('ExitStarted', () => {
  console.log('OBS started shutdown');

  // Just for example, not necessary should you want to reuse this instance by re-connect()
  // obs.off('CurrentProgramSceneChanged', onCurrentProgramSceneChanged);
});

// obsSocket.on('close', () => {
//   console.log('Socket connection to OBS closed.');
//   isSocketConnected = false;
// });

// obsSocket.on('error', (error: Error) => {
//   console.error('Socket encountered an error:', error.message);
// });

connect();
