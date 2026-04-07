package com.example.videoconf.scheduling;

import com.example.videoconf.service.DownloadLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DownloadLinkCleanupTask {

    private final DownloadLinkService downloadLinkService;

    @Scheduled(fixedRate = 60_000L)
    public void sweep() {
        downloadLinkService.cleanupExpiredLinks();
    }
}
