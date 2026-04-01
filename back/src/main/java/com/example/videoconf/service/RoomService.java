package com.example.videoconf.service;

import com.example.videoconf.dto.RoomCreateDto;
import com.example.videoconf.dto.RoomResponseDto;
import com.example.videoconf.model.User;

public interface RoomService {

    RoomResponseDto findByRoomId(String roomId);

    RoomResponseDto createRoom(RoomCreateDto dto);

    RoomResponseDto joinRoom(String roomId, User user);

    void leaveRoom(String roomId, String username);

    void closeRoom(String roomId);
}
