package com.example.videoconf.controller;

import com.example.videoconf.dto.UserResponseDto;
import com.example.videoconf.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class UserController {

    private final SecurityService securityService;

    @GetMapping("/me")
    public UserResponseDto getCurrentUser() {
        UserResponseDto dto = new UserResponseDto();
        dto.setUsername(securityService.getUsername());
        dto.setEmail(securityService.getEmail());
        dto.setFirstName(securityService.getFirstName());
        dto.setLastName(securityService.getLastName());
        dto.setRoles(securityService.getRoles());
        return dto;
    }
}
