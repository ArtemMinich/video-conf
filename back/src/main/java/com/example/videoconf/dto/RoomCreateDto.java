package com.example.videoconf.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RoomCreateDto {

    @NotBlank(message = "Room ID is required")
    private String roomId;
}
