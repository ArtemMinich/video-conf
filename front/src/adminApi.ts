import api from './api';
import type { Room } from './types';

export const adminApi = {
  getRooms: (status?: string) =>
    api.get<Room[]>('/admin/rooms', { params: status ? { status } : {} }),

  getRoom: (roomId: string) =>
    api.get<Room>(`/admin/rooms/${roomId}`),

  createRoom: (roomId: string) =>
    api.post<Room>('/admin/rooms', { roomId }),

  closeRoom: (roomId: string) =>
    api.post(`/admin/rooms/${roomId}/close`),

  deleteRoom: (roomId: string) =>
    api.delete(`/admin/rooms/${roomId}`),
};
