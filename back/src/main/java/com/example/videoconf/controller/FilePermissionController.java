package com.example.videoconf.controller;

import com.example.videoconf.dto.FilePermissionDto;
import com.example.videoconf.dto.GrantPermissionRequestDto;
import com.example.videoconf.dto.UserDto;
import com.example.videoconf.model.User;
import com.example.videoconf.repository.UserRepository;
import com.example.videoconf.service.FilePermissionService;
import com.example.videoconf.service.SecurityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/files/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FilePermissionController {

    private final FilePermissionService filePermissionService;
    private final SecurityService securityService;
    private final UserRepository userRepository;

    @GetMapping
    public List<FilePermissionDto> getPermissionsForPath(@RequestParam String path) {
        return filePermissionService.getPermissionsForPath(path);
    }

    @GetMapping("/users")
    public List<UserDto> searchUsers(@RequestParam(defaultValue = "") String search) {
        if (search.isBlank()) {
            return userRepository.findAll().stream().limit(20).map(this::toUserDto).toList();
        }
        return userRepository
                .findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                        search, search, search, search)
                .stream().limit(20).map(this::toUserDto).toList();
    }

    @PostMapping
    public ResponseEntity<FilePermissionDto> grantPermission(
            @Valid @RequestBody GrantPermissionRequestDto request) {
        FilePermissionDto dto = filePermissionService.grantPermission(
                request, securityService.getCurrentUser().getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revokePermission(@PathVariable Long id) {
        filePermissionService.revokePermission(id);
        return ResponseEntity.noContent().build();
    }

    private UserDto toUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        return dto;
    }
}
