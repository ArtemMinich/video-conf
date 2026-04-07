package com.example.videoconf.service.impl;

import com.example.videoconf.dto.DownloadLinkDto;
import com.example.videoconf.service.DownloadLinkService;
import com.example.videoconf.service.FileService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class DownloadLinkServiceImpl implements DownloadLinkService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 16;

    private final FileService fileService;

    @Value("${app.file-storage.public-path}")
    private String publicPathStr;

    @Value("${app.file-storage.download-ttl-minutes}")
    private long ttlMinutes;

    private Path publicPath;

    @PostConstruct
    public void init() {
        publicPath = Paths.get(publicPathStr).toAbsolutePath().normalize();
        try {
            Files.createDirectories(publicPath);
            log.info("Public download directory: {}", publicPath);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create public download directory", e);
        }
    }

    @Override
    public DownloadLinkDto createDownloadLink(String path) {
        Path sourceFile = fileService.resolveExistingFile(path);
        String token = generateToken();
        Path symlink = publicPath.resolve(token);

        try {
            Files.createSymbolicLink(symlink, sourceFile);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create download link", e);
        }

        String url = "/downloads/" + token;
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(ttlMinutes);
        log.info("Issued download link for '{}' (token={}, target={}, expires={})",
                path, token, sourceFile, expiresAt);

        return DownloadLinkDto.builder()
                .url(url)
                .expiresAt(expiresAt)
                .build();
    }

    @Override
    public void cleanupExpiredLinks() {
        if (!Files.isDirectory(publicPath)) return;

        Instant cutoff = Instant.now().minus(Duration.ofMinutes(ttlMinutes));
        int removed = 0;

        try (Stream<Path> entries = Files.list(publicPath)) {
            for (Path entry : (Iterable<Path>) entries::iterator) {
                if (!Files.isSymbolicLink(entry)) continue;
                try {
                    Instant mtime = Files.getLastModifiedTime(entry, LinkOption.NOFOLLOW_LINKS).toInstant();
                    if (mtime.isBefore(cutoff)) {
                        Files.deleteIfExists(entry);
                        removed++;
                    }
                } catch (IOException e) {
                    log.warn("Failed to check or delete expired download link");
                }
            }
        } catch (IOException e) {
            log.error("Failed to list public download directory", e);
        }

        if (removed > 0) {
            log.info("Cleaned up {} expired download link(s)", removed);
        }
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
