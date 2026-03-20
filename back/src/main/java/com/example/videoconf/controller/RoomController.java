package com.example.videoconf.controller;

import com.example.videoconf.dto.RoomCreateDto;
import com.example.videoconf.dto.RoomResponseDto;
import com.example.videoconf.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/{roomId}")
    public RoomResponseDto getRoom(@PathVariable String roomId) {
        return roomService.findByRoomId(roomId);
    }

    @PostMapping
    public ResponseEntity<RoomResponseDto> createRoom(@Valid @RequestBody RoomCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomService.createRoom(dto));
    }

    @PostMapping("/{roomId}/join")
    public RoomResponseDto joinRoom(@PathVariable String roomId, @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        String keycloakUserId = jwt.getSubject();
        return roomService.joinRoom(roomId, username, keycloakUserId);
    }

    @PostMapping("/{roomId}/leave")
    public ResponseEntity<Void> leaveRoom(@PathVariable String roomId, @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        roomService.leaveRoom(roomId, username);
        return ResponseEntity.noContent().build();
    }
}
