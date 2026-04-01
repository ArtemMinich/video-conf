package com.example.videoconf.service.impl;

import com.example.videoconf.dto.FilePermissionDto;
import com.example.videoconf.dto.GrantPermissionRequestDto;
import com.example.videoconf.exception.FileAccessDeniedException;
import com.example.videoconf.model.FilePermission;
import com.example.videoconf.model.FilePermissionType;
import com.example.videoconf.model.User;
import com.example.videoconf.repository.FilePermissionRepository;
import com.example.videoconf.repository.UserRepository;
import com.example.videoconf.service.FilePermissionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FilePermissionServiceImpl implements FilePermissionService {

    private final FilePermissionRepository repository;
    private final UserRepository userRepository;

    @Override
    public boolean hasPermission(Long userId, String path, FilePermissionType type) {
        return repository.findByUserIdAndPathAndPermissionType(
                userId, normalizePath(path), type).isPresent();
    }

    @Override
    public void checkPermission(Long userId, String path, FilePermissionType type) {
        if (!hasPermission(userId, path, type)) {
            throw new FileAccessDeniedException("No " + type + " permission for path: " + path);
        }
    }

    @Override
    public List<FilePermissionDto> getPermissionsForPath(String path) {
        return repository.findByPath(normalizePath(path)).stream().map(this::toDto).toList();
    }

    @Override
    public List<FilePermissionDto> getPermissionsForUser(Long userId) {
        return repository.findByUserId(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public FilePermissionDto grantPermission(GrantPermissionRequestDto request, String grantedBy) {
        String normalizedPath = normalizePath(request.getPath());

        var existing = repository.findByUserIdAndPathAndPermissionType(
                request.getUserId(), normalizedPath, request.getPermissionType());
        if (existing.isPresent()) {
            return toDto(existing.get());
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));

        FilePermission permission = FilePermission.builder()
                .user(user)
                .path(normalizedPath)
                .permissionType(request.getPermissionType())
                .grantedBy(grantedBy)
                .build();

        log.info("Granting {} permission on '{}' to user {}", request.getPermissionType(), normalizedPath, user.getUsername());
        return toDto(repository.save(permission));
    }

    @Override
    @Transactional
    public void revokePermission(Long id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Permission not found: " + id);
        }
        log.info("Revoking permission {}", id);
        repository.deleteById(id);
    }

    private String normalizePath(String path) {
        if (path == null) return "";
        String normalized = path.replaceAll("/+", "/");
        if (normalized.startsWith("/")) normalized = normalized.substring(1);
        if (normalized.endsWith("/")) normalized = normalized.substring(0, normalized.length() - 1);
        return normalized;
    }

    private FilePermissionDto toDto(FilePermission entity) {
        FilePermissionDto dto = new FilePermissionDto();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUser().getId());
        dto.setUsername(entity.getUser().getUsername());
        dto.setPath(entity.getPath());
        dto.setPermissionType(entity.getPermissionType().name());
        dto.setGrantedBy(entity.getGrantedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
