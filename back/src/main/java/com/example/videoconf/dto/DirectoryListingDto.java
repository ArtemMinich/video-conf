package com.example.videoconf.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DirectoryListingDto {
    private List<FileItemDto> items;
    private boolean canWrite;
}
