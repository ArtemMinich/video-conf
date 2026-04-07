package com.example.videoconf.controller;

import com.example.videoconf.dto.DirectoryListingDto;
import com.example.videoconf.dto.DownloadLinkDto;
import com.example.videoconf.dto.FilePermissionDto;
import com.example.videoconf.dto.GrantPermissionRequestDto;
import com.example.videoconf.model.FilePermissionType;
import com.example.videoconf.model.User;
import com.example.videoconf.service.DownloadLinkService;
import com.example.videoconf.service.FilePermissionService;
import com.example.videoconf.service.FileService;
import com.example.videoconf.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class FileController {

    private final FileService fileService;
    private final FilePermissionService filePermissionService;
    private final SecurityService securityService;
    private final DownloadLinkService downloadLinkService;

    @GetMapping
    public DirectoryListingDto listDirectory(@RequestParam(defaultValue = "") String path) {
        User user = securityService.getCurrentUser();
        return fileService.listDirectory(path, user.getId(), securityService.isAdmin());
    }

    @GetMapping("/download-link")
    public DownloadLinkDto getDownloadLink(@RequestParam String path) {
        if (!securityService.isAdmin()) {
            filePermissionService.checkPermission(securityService.getCurrentUser().getId(), path, FilePermissionType.READ);
        }
        return downloadLinkService.createDownloadLink(path);
    }

    @PostMapping("/upload")
    public ResponseEntity<Void> uploadFiles(
            @RequestParam(defaultValue = "") String path,
            @RequestParam("files") List<MultipartFile> files) {
        User user = securityService.getCurrentUser();
        if (!securityService.isAdmin()) {
            filePermissionService.checkPermission(user.getId(), path, FilePermissionType.WRITE);
        }
        for (MultipartFile file : files) {
            fileService.uploadFile(path, file);
            String filePath = path.isBlank() ? file.getOriginalFilename() : path + "/" + file.getOriginalFilename();
            grantOwnerPermissions(user, filePath);
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/upload/chunk")
    public ResponseEntity<Void> uploadChunk(
            @RequestParam String uploadId,
            @RequestParam int chunkIndex,
            @RequestParam String path,
            @RequestParam("chunk") MultipartFile chunk) {
        if (!securityService.isAdmin()) {
            filePermissionService.checkPermission(securityService.getCurrentUser().getId(), path, FilePermissionType.WRITE);
        }
        fileService.uploadChunk(uploadId, chunkIndex, chunk);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload/complete")
    public ResponseEntity<Map<String, String>> completeChunkedUpload(
            @RequestParam String uploadId,
            @RequestParam String path,
            @RequestParam String fileName,
            @RequestParam int totalChunks) {
        User user = securityService.getCurrentUser();
        if (!securityService.isAdmin()) {
            filePermissionService.checkPermission(user.getId(), path, FilePermissionType.WRITE);
        }
        String filePath = fileService.completeChunkedUpload(uploadId, path, fileName, totalChunks);
        grantOwnerPermissions(user, filePath);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("path", filePath));
    }

    @PostMapping("/folder")
    public ResponseEntity<Void> createFolder(@RequestParam String path) {
        User user = securityService.getCurrentUser();
        if (!securityService.isAdmin()) {
            filePermissionService.checkPermission(user.getId(), parentPath(path), FilePermissionType.WRITE);
        }
        fileService.createFolder(path);
        grantOwnerPermissions(user, path);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@RequestParam String path) {
        if (!securityService.isAdmin()) {
            filePermissionService.checkPermission(securityService.getCurrentUser().getId(), parentPath(path), FilePermissionType.WRITE);
        }
        fileService.delete(path);
        return ResponseEntity.noContent().build();
    }

    private void grantOwnerPermissions(User user, String path) {
        for (FilePermissionType type : FilePermissionType.values()) {
            GrantPermissionRequestDto req = new GrantPermissionRequestDto();
            req.setUserId(user.getId());
            req.setPath(path);
            req.setPermissionType(type);
            filePermissionService.grantPermission(req, user.getUsername());
        }
    }

    private String parentPath(String path) {
        if (path == null || path.isBlank()) return "";
        int lastSlash = path.lastIndexOf('/');
        return lastSlash > 0 ? path.substring(0, lastSlash) : "";
    }

    @GetMapping("/my-permissions")
    public List<FilePermissionDto> getMyPermissions() {
        return filePermissionService.getPermissionsForUser(securityService.getCurrentUser().getId());
    }
}
