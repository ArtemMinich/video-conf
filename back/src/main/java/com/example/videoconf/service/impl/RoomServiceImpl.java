package com.example.videoconf.service.impl;

import com.example.videoconf.dto.RoomCreateDto;
import com.example.videoconf.dto.RoomResponseDto;
import com.example.videoconf.mapper.RoomMapper;
import com.example.videoconf.model.Participant;
import com.example.videoconf.model.Room;
import com.example.videoconf.model.RoomStatus;
import com.example.videoconf.repository.RoomRepository;
import com.example.videoconf.service.RoomService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private static final int MAX_PARTICIPANTS = 2;

    private final RoomRepository roomRepository;
    private final RoomMapper roomMapper;

    @Override
    public RoomResponseDto findByRoomId(String roomId) {
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new EntityNotFoundException("Room not found: " + roomId));
        return roomMapper.toDto(room);
    }

    @Override
    @Transactional
    public RoomResponseDto createRoom(RoomCreateDto dto) {
        Room room = Room.builder()
                .roomId(dto.getRoomId())
                .status(RoomStatus.WAITING)
                .build();
        return roomMapper.toDto(roomRepository.save(room));
    }

    @Override
    @Transactional
    public RoomResponseDto joinRoom(String roomId, String username, String keycloakUserId) {
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new EntityNotFoundException("Room not found: " + roomId));

        if (room.getStatus() == RoomStatus.CLOSED) {
            throw new RuntimeException("Room is closed");
        }

        long activeCount = room.getParticipants().stream()
                .filter(p -> p.getLeftAt() == null)
                .count();

        if (activeCount >= MAX_PARTICIPANTS) {
            throw new RuntimeException("Room is full");
        }

        boolean alreadyIn = room.getParticipants().stream()
                .anyMatch(p -> p.getKeycloakUserId().equals(keycloakUserId) && p.getLeftAt() == null);

        if (!alreadyIn) {
            Participant participant = Participant.builder()
                    .room(room)
                    .username(username)
                    .keycloakUserId(keycloakUserId)
                    .build();
            room.getParticipants().add(participant);

            long newActiveCount = room.getParticipants().stream()
                    .filter(p -> p.getLeftAt() == null)
                    .count();
            if (newActiveCount == MAX_PARTICIPANTS) {
                room.setStatus(RoomStatus.ACTIVE);
            }

            roomRepository.save(room);
        }

        return roomMapper.toDto(room);
    }

    @Override
    @Transactional
    public void leaveRoom(String roomId, String username) {
        Room room = roomRepository.findByRoomId(roomId).orElse(null);
        if (room == null) return;

        room.getParticipants().stream()
                .filter(p -> p.getUsername().equals(username) && p.getLeftAt() == null)
                .forEach(p -> p.setLeftAt(LocalDateTime.now()));

        long activeCount = room.getParticipants().stream()
                .filter(p -> p.getLeftAt() == null)
                .count();

        if (activeCount == 0) {
            room.setStatus(RoomStatus.CLOSED);
            room.setClosedAt(LocalDateTime.now());
        } else {
            room.setStatus(RoomStatus.WAITING);
        }

        roomRepository.save(room);
    }

    @Override
    @Transactional
    public void closeRoom(String roomId) {
        Room room = roomRepository.findByRoomId(roomId).orElse(null);
        if (room == null) return;

        room.getParticipants().stream()
                .filter(p -> p.getLeftAt() == null)
                .forEach(p -> p.setLeftAt(LocalDateTime.now()));

        room.setStatus(RoomStatus.CLOSED);
        room.setClosedAt(LocalDateTime.now());
        roomRepository.save(room);
    }
}
