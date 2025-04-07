// src/utils/axiosInstance.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api' || '', // Set your API base URL here
  withCredentials: true, // Ensures cookies are sent on every request
});

export default instance;
