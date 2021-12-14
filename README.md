# CamCtrlServer
Visca Camera Controller - OBS Studio

<p>This server enables simple control of a Visca controlled camera system <a href="https://www.mylumens.com/Download/VC-A51S_DataSheet_English(LEI)-2017-0921.pdf">(Lumens VC-A51s in my case)</a> and <a href="https://github.com/obs-websocket-community-projects/obs-websocket-js/tree/v4">WebSocket control</a> of <a href="https://obsproject.com/">OBS Studio.</a></p>

#Together with this <a href="https://github.com/craigkehl/ts-cam-app">React frontend application</a> the user can:

<ul>
  <li>Control the camera</li>
  <ul>
    <li>Recall preset camera positions,</li> 
    <li>Variable speed zoom, and</li>
    <li>Variable speed pan and tilt</li>
  </ul>
  <li>OBS Studio
    <ul>
      <li>Recall scenes</li>
    </ul>
  </li>
</ul>

<p>In my current situation, a PC hosts a Zoom client app, OBS, the Node.JS and React.JS servers behind the building’s firewall. To control the system’s camera, a <a href="https://www.amazon.com/gp/product/B08CGXBSTF">RS-232 to RS-422 serial port converter</a> is used to extend the serial communications from the PC to the location of the camera.
</p>
