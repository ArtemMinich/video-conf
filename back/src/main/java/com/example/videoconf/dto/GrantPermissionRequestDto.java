package com.example.videoconf.dto;

import com.example.videoconf.model.FilePermissionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GrantPermissionRequestDto {
    @NotNull
    private Long userId;
    @NotBlank
    private String path;
    @NotNull
    private FilePermissionType permissionType;
}
