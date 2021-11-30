import OBSWebSocket from 'obs-websocket-js'

export const testConnection = (): void => {
  const obs = new OBSWebSocket()
  obs
    .connect({ address: 'localhost:4444', password: process.env.OBSPASSWORD })
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
