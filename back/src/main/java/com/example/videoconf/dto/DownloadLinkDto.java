package com.example.videoconf.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DownloadLinkDto {
    private String url;
    private LocalDateTime expiresAt;
}
