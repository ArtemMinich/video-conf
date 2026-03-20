package com.example.videoconf.controller;

import com.example.videoconf.dto.RoomCreateDto;
import com.example.videoconf.dto.RoomResponseDto;
import com.example.videoconf.model.RoomStatus;
import com.example.videoconf.service.impl.AdminRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminRoomService adminRoomService;

    @GetMapping("/rooms")
    public List<RoomResponseDto> getRooms(@RequestParam(required = false) RoomStatus status) {
        return adminRoomService.getAllRooms(status);
    }

    @GetMapping("/rooms/{roomId}")
    public RoomResponseDto getRoom(@PathVariable String roomId) {
        return adminRoomService.getRoomDetails(roomId);
    }

    @PostMapping("/rooms")
    public ResponseEntity<RoomResponseDto> createRoom(@Valid @RequestBody RoomCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminRoomService.createRoom(dto));
    }

    @PostMapping("/rooms/{roomId}/close")
    public ResponseEntity<Void> closeRoom(@PathVariable String roomId) {
        adminRoomService.forceCloseRoom(roomId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> deleteRoom(@PathVariable String roomId) {
        adminRoomService.deleteRoom(roomId);
        return ResponseEntity.noContent().build();
    }
}
