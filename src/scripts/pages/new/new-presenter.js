export default class NewPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showNewFormMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showNewFormMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async postNewStory({ title, description, evidenceImages, latitude, longitude }) {
    try {
      let photo = null;
      if (evidenceImages && evidenceImages.length > 0) {
        photo = evidenceImages[0];
      }
     

      if (photo && photo instanceof Blob && photo.name === undefined) {
        photo = new File([photo], 'photo.jpg', { type: photo.type || 'image/jpeg' });
      }
      const response = await this.#model.storeNewStory({
        description,
        photo,
        lat: latitude,
        lon: longitude,
      });
      if (!response.ok) {
        console.error('postNewStory: response:', response);
        this.#view.storeFailed(response.message || 'Gagal menyimpan cerita.');
        return;
      }
      this.#view.storeSuccessfully(response.message || 'Cerita berhasil disimpan.');
    } catch (error) {
      if (!navigator.onLine) {
        try {
          const offlineStory = {
            id: `offline-${Date.now()}`,
            description,
            photo,
            lat: latitude,
            lon: longitude,
            createdAt: new Date().toISOString(),
            offline: true,
          };
          const Database = (await import('../../data/database')).default;
          await Database.putStory(offlineStory);
          this.#view.storeSuccessfully(
            'Cerita disimpan secara offline dan akan diunggah saat online.',
          );
        } catch (dbError) {
          this.#view.storeFailed('Gagal menyimpan cerita secara offline.');
        }
      } else {
        console.error('postNewStory: error:', error);
        this.#view.storeFailed('Terjadi kesalahan saat menyimpan cerita.');
      }
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  async #notifyToAllUser(storyId) {
    try {
      const response = await this.#model.sendStoryToAllUserViaNotification(storyId);
      if (!response.ok) {
        console.error('#notifyToAllUser: response:', response);
        return false;
      }
      return true;
    } catch (error) {
      console.error('#notifyToAllUser: error:', error);
      return false;
    }
  }
}
