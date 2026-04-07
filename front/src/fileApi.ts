import api from './api';
import type { DirectoryListing, DownloadLink, FilePermission, GrantPermissionRequest, UserSearchResult } from './types';

export const fileApi = {
  listDirectory: (path = '') =>
    api.get<DirectoryListing>('/files', { params: { path } }),

  getDownloadLink: (path: string) =>
    api.get<DownloadLink>('/files/download-link', { params: { path } }),

  uploadFiles: (path: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return api.post('/files/upload', formData, {
      params: { path },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadChunk: (uploadId: string, chunkIndex: number, path: string, chunk: Blob) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    return api.post('/files/upload/chunk', formData, {
      params: { uploadId, chunkIndex, path },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  completeChunkedUpload: (uploadId: string, path: string, fileName: string, totalChunks: number) =>
    api.post<{ path: string }>('/files/upload/complete', null, {
      params: { uploadId, path, fileName, totalChunks },
    }),

  createFolder: (path: string) =>
    api.post('/files/folder', null, { params: { path } }),

  deleteItem: (path: string) =>
    api.delete('/files', { params: { path } }),

  getMyPermissions: () =>
    api.get<FilePermission[]>('/files/my-permissions'),

  // Admin
  getPermissions: (path: string) =>
    api.get<FilePermission[]>('/admin/files/permissions', { params: { path } }),

  grantPermission: (data: GrantPermissionRequest) =>
    api.post<FilePermission>('/admin/files/permissions', data),

  revokePermission: (id: number) =>
    api.delete(`/admin/files/permissions/${id}`),

  searchUsers: (search = '') =>
    api.get<UserSearchResult[]>('/admin/files/permissions/users', { params: { search } }),
};
