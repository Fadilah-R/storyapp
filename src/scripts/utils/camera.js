export default class Camera {
  #currentStream;
  #streaming = false;
  #width = 640;
  #height = 0;

  #videoElement;
  #selectCameraElement;
  #canvasElement;

  #takePictureButton;

  static addNewStream(stream) {
    if (!Array.isArray(window.currentStreams)) {
      window.currentStreams = [stream];
      return;
    }

    window.currentStreams = [...window.currentStreams, stream];
  }

  static stopAllStreams() {
    if (!Array.isArray(window.currentStreams)) {
      window.currentStreams = [];
      return;
    }

    window.currentStreams.forEach((stream) => {
      if (stream.active) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });
  }

  constructor({ video, cameraSelect, canvas, options = {} }) {
    this.#videoElement = video;
    this.#selectCameraElement = cameraSelect;
    this.#canvasElement = canvas;

    this.#initialListener();
  }

  #initialListener() {
    this.#videoElement.oncanplay = () => {
      if (this.#streaming) {
        return;
      }

      this.#height = (this.#videoElement.videoHeight * this.#width) / this.#videoElement.videoWidth;

      this.#canvasElement.setAttribute('width', this.#width);
      this.#canvasElement.setAttribute('height', this.#height);

      this.#streaming = true;
    };
  }

  async #populateDeviceList(stream) {
    try {
      if (!(stream instanceof MediaStream)) {
        return Promise.reject(Error('MediaStream not found!'));
      }

      const { deviceId } = stream.getVideoTracks()[0].getSettings();

      const enumeratedDevices = await navigator.mediaDevices.enumerateDevices();
      const list = enumeratedDevices.filter((device) => {
        return device.kind === 'videoinput';
      });

      const html = list.reduce((accumulator, device, currentIndex) => {
        return accumulator.concat(`
          <option
            value="${device.deviceId}"
            ${deviceId === device.deviceId ? 'selected' : ''}
          >
            ${device.label || `Camera ${currentIndex + 1}`}
          </option>
        `);
      }, '');

      this.#selectCameraElement.innerHTML = html;
    } catch (error) {
      console.error('#populateDeviceList: error:', error);
    }
  }

  async #getStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          aspectRatio: 4 / 3,
        },
      });
      return stream;
    } catch (error) {
      console.error('#getStream: error:', error);
      return null;
    }
  }

  async launch() {
    if (this.#currentStream) {
      this.stop();
    }

    this.#currentStream = await this.#getStream();

    if (!this.#currentStream) {
      console.error('Failed to get media stream.');
      return;
    }

    Camera.addNewStream(this.#currentStream);

    this.#videoElement.srcObject = this.#currentStream;
    this.#videoElement.play();

    this.#clearCanvas();
  }

  stop() {
    if (this.#videoElement) {
      this.#videoElement.srcObject = null;
      this.#streaming = false;
    }

    if (this.#currentStream instanceof MediaStream) {
      this.#currentStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.#currentStream = null;
    }

    this.#clearCanvas();
  }

  #clearCanvas() {
    const context = this.#canvasElement.getContext('2d');
    context.fillStyle = '#AAAAAA';
    context.fillRect(0, 0, this.#canvasElement.width, this.#canvasElement.height);
  }

async takePicture() {
  if (!(this.#width && this.#height && this.#streaming)) {
    return null;
  }

  const context = this.#canvasElement.getContext('2d');

  this.#canvasElement.width = this.#width;
  this.#canvasElement.height = this.#height;

  context.drawImage(this.#videoElement, 0, 0, this.#width, this.#height);

  return new Promise((resolve) => {
    this.#canvasElement.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        console.error('Failed to create blob from canvas');
        resolve(null);
      }
    }, 'image/jpeg', 0.95); // Menentukan format dan kualitas gambar
  });
}


  addCheeseButtonListener(selector, callback) {
    this.#takePictureButton = document.querySelector(selector);
    if (this.#takePictureButton) {
      this.#takePictureButton.onclick = callback;
    }
  }
}

