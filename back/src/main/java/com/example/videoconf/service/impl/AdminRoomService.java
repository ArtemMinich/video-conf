package com.example.videoconf.service.impl;

import com.example.videoconf.dto.RoomCreateDto;
import com.example.videoconf.dto.RoomResponseDto;
import com.example.videoconf.mapper.RoomMapper;
import com.example.videoconf.model.Room;
import com.example.videoconf.model.RoomStatus;
import com.example.videoconf.repository.RoomRepository;
import com.example.videoconf.service.SignalingService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminRoomService {

    private final RoomRepository roomRepository;
    private final RoomMapper roomMapper;
    private final SignalingService signalingService;

    public List<RoomResponseDto> getAllRooms(RoomStatus status) {
        List<Room> rooms;
        if (status != null) {
            rooms = roomRepository.findByStatus(status);
        } else {
            rooms = roomRepository.findAll();
        }
        return roomMapper.toDtoList(rooms);
    }

    public RoomResponseDto getRoomDetails(String roomId) {
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new EntityNotFoundException("Room not found: " + roomId));
        return roomMapper.toDto(room);
    }

    @Transactional
    public RoomResponseDto createRoom(RoomCreateDto dto) {
        Room room = Room.builder()
                .roomId(dto.getRoomId())
                .status(RoomStatus.WAITING)
                .build();
        return roomMapper.toDto(roomRepository.save(room));
    }

    @Transactional
    public void forceCloseRoom(String roomId) {
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new EntityNotFoundException("Room not found: " + roomId));

        signalingService.forceDisconnectAll(roomId);

        room.getParticipants().stream()
                .filter(p -> p.getLeftAt() == null)
                .forEach(p -> p.setLeftAt(LocalDateTime.now()));

        room.setStatus(RoomStatus.CLOSED);
        room.setClosedAt(LocalDateTime.now());
        roomRepository.save(room);
    }

    @Transactional
    public void deleteRoom(String roomId) {
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new EntityNotFoundException("Room not found: " + roomId));

        signalingService.forceDisconnectAll(roomId);
        roomRepository.delete(room);
    }
}
