package com.example.videoconf.service;

import com.example.videoconf.dto.DownloadLinkDto;

public interface DownloadLinkService {

    DownloadLinkDto createDownloadLink(String path);

    void cleanupExpiredLinks();
}
