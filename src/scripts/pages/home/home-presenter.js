export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showStoriesListMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initializeMap(); 
    } catch (error) {
      console.error('showStoriesListMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async initializeStoriesAndMap() { 
    this.#view.showLoading();
    try {
      await this.showStoriesListMap();

      const response = await this.#model.getAllStories({ location: 1 }); 

      if (!response.ok) {
        console.error('initializeStoriesAndMap: response:', response);
        this.#view.populateStoriesListError(response.message);
        return;
      }

      console.log('API response:', response);
      const stories = response.listStory || response.stories || [];
      this.#view.populateStoriesList(response.message, stories); 
    } catch (error) {
      console.error('initializeStoriesAndMap: error:', error);
      this.#view.populateStoriesListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
