export interface UserInfo {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface Room {
  id: number;
  roomId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  participants: Participant[];
}

export interface Participant {
  id: number;
  username: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface DirectoryListing {
  items: FileItem[];
  canWrite: boolean;
}

export interface FileItem {
  name: string;
  path: string;
  directory: boolean;
  size: number;
  lastModified: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface FilePermission {
  id: number;
  userId: number;
  username: string;
  path: string;
  permissionType: 'READ' | 'WRITE';
  grantedBy: string;
  createdAt: string;
}

export interface GrantPermissionRequest {
  userId: number;
  path: string;
  permissionType: 'READ' | 'WRITE';
}

export interface UserSearchResult {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}
