package com.example.videoconf.controller;

import com.example.videoconf.dto.UserResponseDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("isAuthenticated()")
public class UserController {

    @GetMapping("/me")
    public UserResponseDto getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        UserResponseDto dto = new UserResponseDto();
        dto.setUsername(jwt.getClaimAsString("preferred_username"));
        dto.setEmail(jwt.getClaimAsString("email"));
        dto.setFirstName(jwt.getClaimAsString("given_name"));
        dto.setLastName(jwt.getClaimAsString("family_name"));

        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            dto.setRoles((List<String>) realmAccess.get("roles"));
        } else {
            dto.setRoles(List.of());
        }

        return dto;
    }
}
