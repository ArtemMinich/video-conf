package com.example.videoconf.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RoomResponseDto {
    private Long id;
    private String roomId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;
    private List<ParticipantResponseDto> participants;
}
