import OBSWebSocket from 'obs-websocket-js'

const obs = new OBSWebSocket()

export const testConnection = (): void => {
  obs
    .connect({ address: 'localhost:4444', password: 'pludo12310!' })
    .then(() => {
      console.log(`Success! We're connected & authenticated.`)

      return obs.send('GetSceneList')
    })
    .then((data) => {
      console.log(`${data.scenes.length} Available Scenes!`)

      data.scenes.forEach((scene) => {
        console.log(scene)
      })
    })
  obs.disconnect
}

export const setCurrentScene = (name: string): object => {
  obs
    .connect({ address: 'localhost:4444', password: 'pludo12310!' })
    .then(() => {
      console.log(`Success! We're connected & authenticated.`)

      return obs.send('SetCurrentScene', { 'scene-name': name })
    })
    .then((data) => {
      console.log(data)
      return data
    })
    .catch((err) => {
      console.log(err.message)
    })
  obs.disconnect
}
