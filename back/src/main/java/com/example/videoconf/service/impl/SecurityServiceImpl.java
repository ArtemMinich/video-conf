package com.example.videoconf.service.impl;

import com.example.videoconf.model.User;
import com.example.videoconf.repository.UserRepository;
import com.example.videoconf.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service("securityService")
@RequiredArgsConstructor
public class SecurityServiceImpl implements SecurityService {

    private final UserRepository userRepository;

    @Override
    public String getUsername() {
        return getJwt().getClaimAsString("preferred_username");
    }

    @Override
    public List<String> getRoles() {
        Map<String, Object> realmAccess = getJwt().getClaimAsMap("realm_access");
        if (realmAccess == null || !realmAccess.containsKey("roles")) {
            return List.of();
        }
        return (List<String>) realmAccess.get("roles");
    }

    @Override
    @Transactional
    public User getCurrentUser() {
        Jwt jwt = getJwt();
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");

        if (email != null) {
            return userRepository.findByEmail(email)
                    .orElseGet(() -> userRepository.save(User.builder()
                            .email(email)
                            .username(username)
                            .firstName(jwt.getClaimAsString("given_name"))
                            .lastName(jwt.getClaimAsString("family_name"))
                            .build()));
        }

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));
    }

    @Override
    public boolean isAdmin() {
        return getRoles().contains("ADMIN");
    }

    private Jwt getJwt() {
        return Optional.ofNullable(SecurityContextHolder.getContext())
                .map(SecurityContext::getAuthentication)
                .map(Authentication::getPrincipal)
                .map(Jwt.class::cast)
                .orElseThrow(() -> new IllegalStateException("No authentication found"));
    }
}
