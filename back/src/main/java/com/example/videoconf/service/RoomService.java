package com.example.videoconf.service;

import com.example.videoconf.dto.RoomCreateDto;
import com.example.videoconf.dto.RoomResponseDto;

public interface RoomService {

    RoomResponseDto findByRoomId(String roomId);

    RoomResponseDto createRoom(RoomCreateDto dto);

    RoomResponseDto joinRoom(String roomId, String username, String keycloakUserId);

    void leaveRoom(String roomId, String username);

    void closeRoom(String roomId);
}
