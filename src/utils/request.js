// src/utils/request.js
export const request = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`网络响应失败: ${response.status} - ${text}`);
  }

  if (options.responseType === 'arraybuffer') {
    return await response.arrayBuffer();
  }

  return await response.json();
};

export const post = async (url, body, options = {}) => {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
};

export const get = async (url, options = {}) => {
  return request(url, {
    method: 'GET',
    ...options,
  });
};