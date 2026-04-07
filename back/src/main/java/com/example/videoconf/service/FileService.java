package com.example.videoconf.service;

import com.example.videoconf.dto.DirectoryListingDto;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {

    DirectoryListingDto listDirectory(String path, Long userId, boolean isAdmin);

    /**
     * Validates that the file at the given relative path exists and is safe to access.
     * Returns the normalized relative path for use in X-Accel-Redirect.
     * Does NOT load the file into memory — Nginx will serve it directly from disk.
     */
    String validateFileForDownload(String path);

    void uploadFile(String path, MultipartFile file);

    void uploadChunk(String uploadId, int chunkIndex, MultipartFile chunk);

    String completeChunkedUpload(String uploadId, String path, String fileName, int totalChunks);

    void createFolder(String path);

    void delete(String path);

    String getContentType(String path);
}
