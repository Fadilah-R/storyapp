import NewPresenter from './new-presenter';
import { convertBase64ToBlob } from '../../utils';
import * as StoryAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenDocumentations = [];

  async render() {
    return `
      <section>
        <div class="new-story__header">
          <div class="container">
            <h1 class="section-title">Buat Cerita Baru</h1>
            <p class="new-story__header__description">
              Silakan lengkapi formulir di bawah untuk membuat cerita baru.<br>
              Pastikan cerita yang dibuat adalah valid.
            </p>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
            <div class="form-control">
              <label for="title-input" class="new-form__title__title">Judul Cerita</label>
              <div class="new-form__title__container">
                <input
                  id="title-input"
                  name="title"
                  placeholder="Masukkan judul cerita"
                  required
                >
              </div>
            </div>
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Keterangan</label>
              <div class="new-form__description__container">
                <textarea
                  id="description-input"
                  name="description"
                  placeholder="Masukkan keterangan lengkap cerita."
                  required
                ></textarea>
              </div>
            </div>
            <div class="form-control">
              <label for="documentations-input" class="new-form__documentations__title">Dokumentasi</label>
              <div id="documentations-more-info">Anda dapat menyertakan foto sebagai dokumentasi.</div>
              <div class="new-form__documentations__container">
                <input
                  id="documentations-input"
                  name="documentations"
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                >
                <button id="documentations-input-button" class="btn btn-outline" type="button">
                  Pilih Gambar
                </button>
                <button id="open-camera-button" class="btn btn-outline" type="button">
                  Buka Kamera
                </button>
                <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video" class="new-form__camera__video"></video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
                  <div class="new-form__camera__tools_buttons">
                    <button id="camera-take-button" class="btn" type="button">
                      Ambil Gambar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-control">
              <div class="new-form__location__title">Lokasi</div>
              <div class="new-form__location__container">
                <div class="new-form__location__lat-lng">
                  <input type="number" name="latitude" placeholder="Latitude" step="any" required>
                  <input type="number" name="longitude" placeholder="Longitude" step="any" required>
                </div>
                <div id="map" class="new-form__location__map"></div>
              </div>
            </div>
            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Buat Cerita</button>
              </span>
              <a class="btn btn-outline" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({
      view: this,
      model: StoryAPI,
    });
    this.#takenDocumentations = [];
    this.#setupForm();
    this.#setupMap();
    this.#setupCamera();
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        title: this.#form.elements.namedItem('title').value,
        description: this.#form.elements.namedItem('description').value,
        evidenceImages: this.#takenDocumentations.map((picture) => picture.blob),
        latitude: this.#form.elements.namedItem('latitude').value,
        longitude: this.#form.elements.namedItem('longitude').value,
      };
      await this.#presenter.postNewStory(data);
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const insertingPicturesPromises = Array.from(event.target.files).map(async (file) => {
        return await this.#addTakenPicture(file);
      });
      await Promise.all(insertingPicturesPromises);
      await this.#populateTakenPictures();
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations-input').click();
    });

    document.getElementById('open-camera-button').addEventListener('click', () => {
      this.#openCamera();
    });

    document.getElementById('camera-take-button').addEventListener('click', () => {
      this.#camera;
    });
  }

  async #addTakenPicture(image) {
    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: image,
    };
    this.#takenDocumentations = [...this.#takenDocumentations, newDocumentation];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations.reduce((accumulator, picture, currentIndex) => {
      const imageUrl = URL.createObjectURL(picture.blob);
      return accumulator.concat(`
        <li class="new-form__documentations__outputs-item">
          <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn">
            <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}">
          </button>
        </li>
      `);
    }, '');

    document.getElementById('documentations-taken-list').innerHTML = html;

    document.querySelectorAll('button[data-deletepictureid]').forEach((button) =>
      button.addEventListener('click', (event) => {
        const pictureId = event.currentTarget.dataset.deletepictureid;
        this.#removePicture(pictureId);
        this.#populateTakenPictures();
      }),
    );
  }

  #removePicture(id) {
    this.#takenDocumentations = this.#takenDocumentations.filter((picture) => picture.id !== id);
  }

  #setupMap() {
    const map = L.map('map').setView([-6.200001, 106.816666], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    let marker;

    map.on('click', (event) => {
      const { lat, lng } = event.latlng;
      this.#form.elements.namedItem('latitude').value = lat;
      this.#form.elements.namedItem('longitude').value = lng;

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }
    });
  }

  async #setupCamera() {
    const videoElement = document.getElementById('camera-video');
    const canvasElement = document.getElementById('camera-canvas');

    if (!videoElement || !canvasElement) {
      console.error('Video or canvas element not found');
      return;
    }

    this.#camera = new Camera({
      video: videoElement,
      canvas: canvasElement,
    });

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const blob = await this.#camera.takePicture();
      if (blob) {
        await this.#addTakenPicture(blob); // Menambahkan gambar yang diambil
        await this.#populateTakenPictures();
      }
    });
  }

  #openCamera() {
    if (this.#isCameraOpen) {
      this.#camera.stop();
      this.#isCameraOpen = false;
      document.getElementById('camera-container').style.display = 'none';
    } else {
      this.#camera.launch();
      document.getElementById('camera-container').style.display = 'block';
      this.#isCameraOpen = true;
    }
  }

  storeSuccessfully(message) {
    this.clearForm();
    location.hash = '/';
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
    this.#takenDocumentations = [];
    this.#populateTakenPictures();
    this.#camera.stop();
    document.getElementById('camera-container').style.display = 'none';
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Buat Cerita</button>
    `;
  }
}
