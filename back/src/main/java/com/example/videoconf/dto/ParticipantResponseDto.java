package com.example.videoconf.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ParticipantResponseDto {
    private Long id;
    private String username;
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
}
