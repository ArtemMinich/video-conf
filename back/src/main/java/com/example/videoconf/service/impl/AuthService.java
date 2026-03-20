package com.example.videoconf.service.impl;

import com.example.videoconf.dto.AuthResponseDto;
import com.example.videoconf.dto.LoginRequestDto;
import com.example.videoconf.dto.RegisterRequestDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AuthService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.keycloak.base-url}")
    private String keycloakBaseUrl;

    @Value("${app.keycloak.realm}")
    private String realm;

    @Value("${app.keycloak.master-username}")
    private String masterUsername;

    @Value("${app.keycloak.master-password}")
    private String masterPassword;

    public AuthResponseDto login(LoginRequestDto request) {
        String tokenUrl = keycloakBaseUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", "video-conf-client");
        params.add("username", request.getUsername());
        params.add("password", request.getPassword());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    tokenUrl, new HttpEntity<>(params, headers), Map.class);
            Map<String, Object> body = response.getBody();
            return new AuthResponseDto(
                    (String) body.get("access_token"),
                    (String) body.get("refresh_token"),
                    (Integer) body.get("expires_in")
            );
        } catch (HttpClientErrorException e) {
            throw new IllegalArgumentException("Invalid username or password");
        }
    }

    public AuthResponseDto refresh(String refreshToken) {
        String tokenUrl = keycloakBaseUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("client_id", "video-conf-client");
        params.add("refresh_token", refreshToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    tokenUrl, new HttpEntity<>(params, headers), Map.class);
            Map<String, Object> body = response.getBody();
            return new AuthResponseDto(
                    (String) body.get("access_token"),
                    (String) body.get("refresh_token"),
                    (Integer) body.get("expires_in")
            );
        } catch (HttpClientErrorException e) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }
    }

    public void register(RegisterRequestDto request) {
        String masterToken = getMasterToken();

        String usersUrl = keycloakBaseUrl + "/admin/realms/" + realm + "/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(masterToken);

        Map<String, Object> userBody = Map.of(
                "username", request.getUsername(),
                "email", request.getEmail(),
                "emailVerified", true,
                "firstName", request.getFirstName() != null ? request.getFirstName() : "",
                "lastName", request.getLastName() != null ? request.getLastName() : "",
                "enabled", true
        );

        try {
            ResponseEntity<Void> response = restTemplate.postForEntity(
                    usersUrl, new HttpEntity<>(userBody, headers), Void.class);

            if (response.getStatusCode().value() == 201 && response.getHeaders().getLocation() != null) {
                String userId = response.getHeaders().getLocation().getPath()
                        .replaceAll(".*/([^/]+)$", "$1");
                setUserPassword(userId, request.getPassword(), masterToken);
                assignUserRole(userId, masterToken);
            }
        } catch (HttpClientErrorException.Conflict e) {
            throw new IllegalArgumentException("User already exists: " + request.getUsername());
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Failed to create user: " + e.getStatusCode());
        }
    }

    private String getMasterToken() {
        String tokenUrl = keycloakBaseUrl + "/realms/master/protocol/openid-connect/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", "admin-cli");
        params.add("username", masterUsername);
        params.add("password", masterPassword);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                tokenUrl, new HttpEntity<>(params, headers), Map.class);
        return (String) response.getBody().get("access_token");
    }

    private void setUserPassword(String userId, String password, String masterToken) {
        String passwordUrl = keycloakBaseUrl + "/admin/realms/" + realm
                + "/users/" + userId + "/reset-password";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(masterToken);

        Map<String, Object> credentialBody = Map.of(
                "type", "password",
                "value", password,
                "temporary", false
        );

        restTemplate.put(passwordUrl, new HttpEntity<>(credentialBody, headers));
    }

    private void assignUserRole(String userId, String masterToken) {
        String roleUrl = keycloakBaseUrl + "/admin/realms/" + realm + "/roles/USER";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(masterToken);

        ResponseEntity<Map> roleResponse = restTemplate.exchange(
                roleUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        headers.setContentType(MediaType.APPLICATION_JSON);
        String assignUrl = keycloakBaseUrl + "/admin/realms/" + realm
                + "/users/" + userId + "/role-mappings/realm";

        restTemplate.postForEntity(
                assignUrl, new HttpEntity<>(List.of(roleResponse.getBody()), headers), Void.class);
    }
}
