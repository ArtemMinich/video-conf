package com.example.videoconf.controller;

import com.example.videoconf.dto.UserResponseDto;
import com.example.videoconf.model.User;
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
        User user = securityService.getCurrentUser();
        UserResponseDto dto = new UserResponseDto();
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRoles(securityService.getRoles());
        return dto;
    }
}
