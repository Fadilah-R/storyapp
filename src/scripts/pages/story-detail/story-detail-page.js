import {
  generateLoaderAbsoluteTemplate,
  generateRemoveStoryButtonTemplate,
  generateSaveStoryButtonTemplate,
  generateStoryDetailErrorTemplate,
  generateStoryDetailTemplate,
} from '../../templates';
import StoryDetailPresenter from './story-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import Map from '../../utils/map';
import * as StoryAPI from '../../data/api';
import Database from '../../data/database';

export default class StoryDetailPage {
  #presenter = null;
  // #form = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="story-detail__container">
          <div id="story-detail" class="story-detail"></div>
          <div id="save-actions-container"></div> 
          <div id="story-detail-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new StoryDetailPresenter(parseActivePathname().id, {
      view: this,
      apiModel: StoryAPI,
      dbModel: Database,
    });

    // this.#setupForm();

    await this.#presenter.showStoryDetail();
  }

  async populateStoryDetailAndInitialMap(message, story) {
    document.getElementById('story-detail').innerHTML = generateStoryDetailTemplate({
      title: story.name,
      description: story.description,
      photoUrl: story.photoUrl,
      createdAt: story.createdAt,
      lat: story.lat,
      lon: story.lon,
    });

    // Map
    await this.#presenter.showStoryDetailMap();

    if (this.#map) {
      const storyCoordinate = [story.lat, story.lon];
      const markerOptions = { alt: story.name };
      const popupOptions = { content: story.name };
      this.#map.changeCamera(storyCoordinate);
      this.#map.addMarker(storyCoordinate, markerOptions, popupOptions);
    }

    this.#presenter.showSaveButton();
    this.addNotifyMeEventListener();
  }

  populateStoryDetailError(message) {
    document.getElementById('story-detail').innerHTML = generateStoryDetailErrorTemplate(message);
  }

  renderSaveButton() {
    const saveActions = document.getElementById('save-actions-container');
    if (!saveActions) {
      console.warn('[StoryDetailPage] save-actions-container not found');
      return;
    }
    saveActions.innerHTML = generateSaveStoryButtonTemplate();
    const saveBtn = document.getElementById('story-detail-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await this.#presenter.saveStory();
        await this.#presenter.showSaveButton();
      });
    } else {
      console.warn('[StoryDetailPage] story-detail-save button not found');
    }
  }

  renderRemoveButton() {
    const saveActions = document.getElementById('save-actions-container');
    if (!saveActions) {
      console.warn('[StoryDetailPage] save-actions-container not found');
      return;
    }
    saveActions.innerHTML = generateRemoveStoryButtonTemplate();
    const removeBtn = document.getElementById('story-detail-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', async () => {
        await this.#presenter.removeStory();
        await this.#presenter.showSaveButton();
      });
    } else {
      console.warn('[StoryDetailPage] story-detail-remove button not found');
    }
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 15,
    });
  }

  addNotifyMeEventListener() {
    const notifyBtn = document.getElementById('story-detail-notify-me');
    if (notifyBtn) {
      notifyBtn.addEventListener('click', () => {
        this.#presenter.notifyMe();
      });
    } else {
      console.warn('[StoryDetailPage] story-detail-notify-me button not found');
    }
  }

  showStoryDetailLoading() {
    const container = document.getElementById('story-detail-loading-container');
    if (container) {
      container.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideStoryDetailLoading() {
    const container = document.getElementById('story-detail-loading-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  showMapLoading() {
    const container = document.getElementById('map-loading-container');
    if (container) {
      container.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideMapLoading() {
    const container = document.getElementById('map-loading-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  showSubmitLoadingButton() {
    const container = document.getElementById('submit-button-container');
    if (container) {
      container.innerHTML =
        '<button class="btn" type="submit"><i class="fas fa-spinner loader-button"></i> Tanggapi</button>';
    }
  }

  hideSubmitLoadingButton() {
    const container = document.getElementById('submit-button-container');
    if (container) {
      container.innerHTML = '<button class="btn" type="submit">Tanggapi</button>';
    }
  }

  saveToBookmarkSuccessfully(message) {
    console.log(message);
  }

  saveToBookmarkFailed(message) {
    alert(message);
  }
  removeFromBookmarkSuccessfully(message) {
    console.log(message);
  }

  removeFromBookmarkFailed(message) {
    alert(message);
  }
}
