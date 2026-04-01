package com.example.videoconf.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FileItemDto {
    private String name;
    private String path;
    private boolean directory;
    private long size;
    private LocalDateTime lastModified;
    private boolean canRead;
    private boolean canWrite;
}
