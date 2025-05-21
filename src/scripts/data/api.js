import { getAccessToken } from '../utils/auth';
import { BASE_URL } from '../config';

const ENDPOINTS = {
  // Auth
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  // Stories
  ADD_NEW_STORY: `${BASE_URL}/stories`,
  ADD_NEW_STORY_GUEST: `${BASE_URL}/stories/guest`,
  GET_ALL_STORIES: `${BASE_URL}/stories`,
  GET_STORY_DETAIL: (id) => `${BASE_URL}/stories/${id}`,
  // Notifications
  SUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
};

// Fungsi untuk login
export async function getLogin({ email, password }) {
  const data = JSON.stringify({ email, password });

  const fetchResponse = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// Fungsi untuk mendaftar
export async function getRegistered({ name, email, password }) {
  const data = JSON.stringify({ name, email, password });

  const fetchResponse = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// Fungsi untuk menambahkan cerita baru
export async function addNewStory({ description, photo, lat, lon }) {
  const accessToken = getAccessToken();
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat) formData.append('lat', lat);
  if (lon) formData.append('lon', lon);

  const fetchResponse = await fetch(ENDPOINTS.ADD_NEW_STORY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// Fungsi untuk mendapatkan semua cerita
export async function getAllStories({ page, size, location }) {
  const accessToken = getAccessToken();
  const url = new URL(ENDPOINTS.GET_ALL_STORIES);
  if (page) url.searchParams.append('page', page);
  if (size) url.searchParams.append('size', size);
  if (location) url.searchParams.append('location', location);

  const fetchResponse = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// Fungsi untuk mendapatkan detail cerita
export async function getStoryDetail(id) {
  const accessToken = getAccessToken();
  const fetchResponse = await fetch(ENDPOINTS.GET_STORY_DETAIL(id), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await fetchResponse.json();
  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// Fungsi untuk subscribe notifikasi
export async function subscribePushNotification({ endpoint, keys }) {
  const accessToken = getAccessToken();
  const data = JSON.stringify({
    endpoint,
    keys,
  });

  const fetchResponse = await fetch(ENDPOINTS.SUBSCRIBE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// Fungsi untuk unsubscribe notifikasi
export async function unsubscribePushNotification({ endpoint }) {
  const accessToken = getAccessToken();
  const data = JSON.stringify({ endpoint });

  const fetchResponse = await fetch(ENDPOINTS.UNSUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// Fungsi storeNewStory yang digunakan oleh presenter
export async function storeNewStory({ description, photo, lat, lon }) {
  const accessToken = getAccessToken();
  const formData = new FormData();

  formData.append('description', description);
  if (lat) formData.append('lat', lat);
  if (lon) formData.append('lon', lon);

  if (photo) {
    formData.append('photo', photo);
  }

  const fetchResponse = await fetch(ENDPOINTS.ADD_NEW_STORY, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// Menambahkan fungsi notifikasi
async function showNotification(title, description) {
  const notificationOptions = {
    body: `Anda telah membuat story baru dengan deskripsi: ${description}`,
    icon: 'images/logo.png',
  };

  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, notificationOptions);
      });
    }
  }
}

// Fungsi untuk post data baru dan menampilkan notifikasi setelah sukses
async function postNewStoryAndNotify({ title, description, imageBlob }) {
  const data = { title, description, image: imageBlob };

  // Kirim request untuk menyimpan story
  const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAccessToken()}`,
    },
  });

  const responseData = await response.json();

  if (response.ok) {
    await showNotification('Story berhasil dibuat', description);
  } else {
    console.error('Failed to create story:', responseData.message);
  }
}

export async function sendStoryToUserViaNotification(storyId, { userId }) {
  const accessToken = getAccessToken();
  const data = JSON.stringify({
    userId,
  });

  const fetchResponse = await fetch(ENDPOINTS.SEND_STORY_TO_USER(storyId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function sendReportToAllUserViaNotification(storyId) {
  const accessToken = getAccessToken();

  const fetchResponse = await fetch(ENDPOINTS.SEND_REPORT_TO_ALL_USER(storyId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}
