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
  keycloakUserId: string;
  joinedAt: string;
  leftAt: string | null;
}
