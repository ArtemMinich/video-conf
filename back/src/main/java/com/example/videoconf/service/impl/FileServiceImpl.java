package com.example.videoconf.service.impl;

import com.example.videoconf.dto.DirectoryListingDto;
import com.example.videoconf.dto.FileItemDto;
import com.example.videoconf.model.FilePermissionType;
import com.example.videoconf.service.FilePermissionService;
import com.example.videoconf.service.FileService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileServiceImpl implements FileService {

    @Value("${app.file-storage.root-path}")
    private String rootPathStr;

    private Path rootPath;

    private final FilePermissionService filePermissionService;

    @PostConstruct
    public void init() {
        rootPath = Paths.get(rootPathStr).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootPath);
            log.info("File storage root: {}", rootPath);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create file storage directory: " + rootPath, e);
        }
    }

    @Override
    public DirectoryListingDto listDirectory(String path, Long userId, boolean isAdmin) {
        Path dir = resolveSafePath(path);
        if (!Files.isDirectory(dir)) {
            throw new IllegalArgumentException("Not a directory: " + path);
        }
        String normalizedPath = path == null ? "" : path.replaceAll("/+", "/");
        if (normalizedPath.startsWith("/")) normalizedPath = normalizedPath.substring(1);
        if (normalizedPath.endsWith("/")) normalizedPath = normalizedPath.substring(0, normalizedPath.length() - 1);
        boolean dirCanWrite = isAdmin || filePermissionService.hasPermission(userId, normalizedPath, FilePermissionType.WRITE);
        try (Stream<Path> stream = Files.list(dir)) {
            List<FileItemDto> items = stream.map(p -> {
                String relativePath = rootPath.relativize(p).toString().replace('\\', '/');
                boolean canRead = isAdmin || filePermissionService.hasPermission(userId, relativePath, FilePermissionType.READ);
                if (!canRead) return null;
                boolean canWrite = isAdmin || filePermissionService.hasPermission(userId, relativePath, FilePermissionType.WRITE);
                try {
                    BasicFileAttributes attrs = Files.readAttributes(p, BasicFileAttributes.class);
                    return FileItemDto.builder()
                            .name(p.getFileName().toString())
                            .path(relativePath)
                            .directory(Files.isDirectory(p))
                            .size(Files.isDirectory(p) ? 0 : attrs.size())
                            .lastModified(LocalDateTime.ofInstant(attrs.lastModifiedTime().toInstant(), ZoneId.systemDefault()))
                            .canRead(true)
                            .canWrite(canWrite)
                            .build();
                } catch (IOException e) {
                    throw new IllegalStateException("Cannot read file attributes: " + p, e);
                }
            }).filter(item -> item != null).toList();
            return DirectoryListingDto.builder()
                    .items(items)
                    .canWrite(dirCanWrite)
                    .build();
        } catch (IOException e) {
            throw new IllegalStateException("Cannot list directory: " + path, e);
        }
    }

    @Override
    public Resource downloadFile(String path) {
        Path file = resolveSafePath(path);
        if (!Files.exists(file) || !Files.isRegularFile(file)) {
            throw new IllegalArgumentException("File not found: " + path);
        }
        try {
            return new UrlResource(file.toUri());
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Cannot create resource for: " + path, e);
        }
    }

    @Override
    public void uploadFile(String path, MultipartFile file) {
        Path dir = resolveSafePath(path);
        if (!Files.isDirectory(dir)) {
            throw new IllegalArgumentException("Target directory not found: " + path);
        }
        String filename = sanitizeFilename(file.getOriginalFilename());
        Path target = dir.resolve(filename);
        if (!target.normalize().startsWith(rootPath)) {
            throw new IllegalArgumentException("Invalid filename");
        }
        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("File uploaded: {}", rootPath.relativize(target));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to upload file", e);
        }
    }

    @Override
    public void uploadChunk(String uploadId, int chunkIndex, MultipartFile chunk) {
        Path chunksDir = rootPath.resolve(".chunks").resolve(uploadId);
        try {
            Files.createDirectories(chunksDir);
            Path chunkFile = chunksDir.resolve(String.valueOf(chunkIndex));
            Files.copy(chunk.getInputStream(), chunkFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to save chunk " + chunkIndex, e);
        }
    }

    @Override
    public String completeChunkedUpload(String uploadId, String path, String fileName, int totalChunks) {
        Path chunksDir = rootPath.resolve(".chunks").resolve(uploadId);
        if (!Files.isDirectory(chunksDir)) {
            throw new IllegalArgumentException("Upload not found: " + uploadId);
        }
        Path dir = resolveSafePath(path);
        if (!Files.isDirectory(dir)) {
            throw new IllegalArgumentException("Target directory not found: " + path);
        }
        String sanitized = sanitizeFilename(fileName);
        Path target = dir.resolve(sanitized);
        if (!target.normalize().startsWith(rootPath)) {
            throw new IllegalArgumentException("Invalid filename");
        }
        try (OutputStream out = Files.newOutputStream(target)) {
            for (int i = 0; i < totalChunks; i++) {
                Path chunkFile = chunksDir.resolve(String.valueOf(i));
                if (!Files.exists(chunkFile)) {
                    throw new IllegalStateException("Missing chunk " + i);
                }
                Files.copy(chunkFile, out);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to assemble file", e);
        }
        // Cleanup chunks
        try (Stream<Path> walk = Files.walk(chunksDir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(p -> {
                try { Files.delete(p); } catch (IOException ignored) {}
            });
        } catch (IOException ignored) {}
        String relativePath = path.isBlank() ? sanitized : path + "/" + sanitized;
        log.info("Chunked upload complete: {}", relativePath);
        return relativePath;
    }

    @Override
    public void createFolder(String path) {
        Path folder = resolveSafePath(path);
        if (Files.exists(folder)) {
            throw new IllegalArgumentException("Already exists: " + path);
        }
        try {
            Files.createDirectories(folder);
            log.info("Folder created: {}", path);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create folder", e);
        }
    }

    @Override
    public void delete(String path) {
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Cannot delete root directory");
        }
        Path target = resolveSafePath(path);
        if (!Files.exists(target)) {
            throw new IllegalArgumentException("Not found: " + path);
        }
        try {
            if (Files.isDirectory(target)) {
                try (Stream<Path> walk = Files.walk(target)) {
                    walk.sorted(Comparator.reverseOrder()).forEach(p -> {
                        try {
                            Files.delete(p);
                        } catch (IOException e) {
                            throw new IllegalStateException("Failed to delete: " + p, e);
                        }
                    });
                }
            } else {
                Files.delete(target);
            }
            log.info("Deleted: {}", path);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to delete: " + path, e);
        }
    }

    @Override
    public String getContentType(String path) {
        Path file = resolveSafePath(path);
        try {
            String type = Files.probeContentType(file);
            return type != null ? type : "application/octet-stream";
        } catch (IOException e) {
            return "application/octet-stream";
        }
    }

    private Path resolveSafePath(String relativePath) {
        String normalized = relativePath == null ? "" : relativePath.replaceAll("/+", "/");
        if (normalized.startsWith("/")) normalized = normalized.substring(1);
        if (normalized.endsWith("/")) normalized = normalized.substring(0, normalized.length() - 1);

        if (normalized.contains("..")) {
            throw new IllegalArgumentException("Invalid path");
        }

        Path resolved = rootPath.resolve(normalized).normalize();
        if (!resolved.startsWith(rootPath)) {
            throw new IllegalArgumentException("Invalid path");
        }
        return resolved;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Filename is empty");
        }
        String sanitized = Paths.get(filename).getFileName().toString();
        if (sanitized.isBlank() || sanitized.startsWith(".")) {
            throw new IllegalArgumentException("Invalid filename");
        }
        return sanitized;
    }
}
