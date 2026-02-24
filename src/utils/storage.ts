import { api } from './api';
import { localApi } from './localStorage';

const USE_BACKEND = false;

export const storage = USE_BACKEND ? api : localApi;
