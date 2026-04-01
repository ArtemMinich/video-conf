package com.example.videoconf.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FilePermissionDto {
    private Long id;
    private Long userId;
    private String username;
    private String path;
    private String permissionType;
    private String grantedBy;
    private LocalDateTime createdAt;
}
