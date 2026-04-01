package com.example.videoconf.service;

import com.example.videoconf.dto.DirectoryListingDto;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {

    DirectoryListingDto listDirectory(String path, Long userId, boolean isAdmin);

    Resource downloadFile(String path);

    void uploadFile(String path, MultipartFile file);

    void uploadChunk(String uploadId, int chunkIndex, MultipartFile chunk);

    String completeChunkedUpload(String uploadId, String path, String fileName, int totalChunks);

    void createFolder(String path);

    void delete(String path);

    String getContentType(String path);
}
