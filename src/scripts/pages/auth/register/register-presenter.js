export default class RegisterPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async getRegistered({ name, email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      if (password.length < 8) {
        this.#view.registeredFailed("Password must be at least 8 characters long.");
        return;
      }

      const response = await this.#model.getRegistered({ name, email, password });

      console.log('Register response:', response); 

      if (response.error) {
        console.error('getRegistered: response:', response);
        this.#view.registeredFailed(response.message);
        return;
      }

      this.#view.registeredSuccessfully(response.message);
    } catch (error) {
      console.error('getRegistered: error:', error);
      this.#view.registeredFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}
