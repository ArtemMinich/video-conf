package com.example.videoconf.repository;

import com.example.videoconf.model.FilePermission;
import com.example.videoconf.model.FilePermissionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FilePermissionRepository extends JpaRepository<FilePermission, Long> {

    List<FilePermission> findByUserId(Long userId);

    List<FilePermission> findByPath(String path);

    Optional<FilePermission> findByUserIdAndPathAndPermissionType(
            Long userId, String path, FilePermissionType permissionType);
}
