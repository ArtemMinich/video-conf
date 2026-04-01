package com.example.videoconf.controller;

import com.example.videoconf.dto.RoomCreateDto;
import com.example.videoconf.dto.RoomResponseDto;
import com.example.videoconf.model.User;
import com.example.videoconf.service.RoomService;
import com.example.videoconf.service.SecurityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class RoomController {

    private final RoomService roomService;
    private final SecurityService securityService;

    @GetMapping("/{roomId}")
    public RoomResponseDto getRoom(@PathVariable String roomId) {
        return roomService.findByRoomId(roomId);
    }

    @PostMapping
    public ResponseEntity<RoomResponseDto> createRoom(@Valid @RequestBody RoomCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomService.createRoom(dto));
    }

    @PostMapping("/{roomId}/join")
    public RoomResponseDto joinRoom(@PathVariable String roomId) {
        User user = securityService.getCurrentUser();
        return roomService.joinRoom(roomId, user);
    }

    @PostMapping("/{roomId}/leave")
    public ResponseEntity<Void> leaveRoom(@PathVariable String roomId) {
        String username = securityService.getUsername();
        roomService.leaveRoom(roomId, username);
        return ResponseEntity.noContent().build();
    }
}
