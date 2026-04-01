package com.example.videoconf.service;

import com.example.videoconf.dto.FilePermissionDto;
import com.example.videoconf.dto.GrantPermissionRequestDto;
import com.example.videoconf.model.FilePermissionType;

import java.util.List;

public interface FilePermissionService {

    boolean hasPermission(Long userId, String path, FilePermissionType type);

    void checkPermission(Long userId, String path, FilePermissionType type);

    List<FilePermissionDto> getPermissionsForPath(String path);

    List<FilePermissionDto> getPermissionsForUser(Long userId);

    FilePermissionDto grantPermission(GrantPermissionRequestDto request, String grantedBy);

    void revokePermission(Long id);
}
