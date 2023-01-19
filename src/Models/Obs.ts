import OBSWebSocket, {
  EventSubscription,
  OBSEventTypes,
  OBSRequestTypes,
  OBSResponseTypes,
} from 'obs-websocket-js';
require('dotenv').config();

import { onSceneChange } from '../Controllers/obs';



const obs = new OBSWebSocket();

const ADDRESS = process.env.OBS_ADDRESS || 'ws://192.168.108.2:4455';
const PASSWORD = process.env.OBS_PASSWORD;
console.log(ADDRESS)
console.log(PASSWORD)

let connected = false;

async function connect(): Promise<void> {
  try {
    const { obsWebSocketVersion, negotiatedRpcVersion } = await obs.connect(
      ADDRESS,
      PASSWORD
    );
    console.log(
      `Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`
    );
  } catch (error: any) {
    console.error('Failed to connect', error.code, error.message);
  }
  connected = true;
}

export async function getCurrentScene(): Promise<Object> {
  const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
  return currentProgramSceneName;
}

export async function setCurrentScene(name: string): Promise<void> {
  console.log('scene: ' + name);
  return await obs.call('SetCurrentProgramScene', { sceneName: name });
}

obs.on('CurrentProgramSceneChanged', event => {
  onSceneChange(event.sceneName)

});

obs.once('ExitStarted', () => {
  console.log('OBS started shutdown');

  // Just for example, not necessary should you want to reuse this instance by re-connect()
  // obs.off('CurrentProgramSceneChanged', onCurrentProgramSceneChanged);
});

connect();
