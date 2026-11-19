import axios from 'axios';
import { getServerUrl } from './network';

export const API_URL = typeof window !== 'undefined'
  ? getServerUrl()
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

function makeApi() {
  const base = typeof window !== 'undefined'
    ? getServerUrl()
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
  return axios.create({ baseURL: base, timeout: 30000 });
}

const getApi = () => makeApi();
export default getApi();

// ---- Media ----
export const uploadFile      = (fd: FormData) => getApi().post('/api/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadMultiple  = (fd: FormData) => getApi().post('/api/media/upload-multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
export const fetchMediaList  = () => getApi().get('/api/media');
export const fetchVideos     = () => getApi().get('/api/media/videos');
export const fetchImages     = () => getApi().get('/api/media/images');
export const deleteMedia     = (id: string) => getApi().delete(`/api/media/${id}`);

// ---- Signage ----
export const fetchSignageConfig   = (clientId: string) => getApi().get(`/api/signage/${clientId}`);
export const updateSignageContent = (clientId: string, body: any) => getApi().post(`/api/signage/${clientId}/content`, body);

// ---- Queue ----
export const fetchQueue  = (clientId: string) => getApi().get(`/api/signage/${clientId}/queue`);
export const callQueue   = (clientId: string, body: { slotNumber: number; action: 'next' | 'repeat' | 'manual'; number?: string }) =>
  getApi().post(`/api/signage/${clientId}/queue/call`, body);
export const resetQueue  = (clientId: string) => getApi().post(`/api/signage/${clientId}/queue/reset`, {});
export const updateLoket = (clientId: string, body: { slotNumber: number; loketName: string }) =>
  getApi().post(`/api/signage/${clientId}/queue/loket`, body);

// ---- Clients ----
export const fetchClients = () => getApi().get('/api/clients');
export const createClient = (body: { id: string; description?: string }) => getApi().post('/api/clients', body);
