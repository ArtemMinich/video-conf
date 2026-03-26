package com.example.videoconf.service.impl;

import com.example.videoconf.service.SecurityService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service("securityService")
public class SecurityServiceImpl implements SecurityService {

    @Override
    public String getUsername() {
        return getJwt().getClaimAsString("preferred_username");
    }

    @Override
    public String getEmail() {
        return getJwt().getClaimAsString("email");
    }

    @Override
    public String getFirstName() {
        return getJwt().getClaimAsString("given_name");
    }

    @Override
    public String getLastName() {
        return getJwt().getClaimAsString("family_name");
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
