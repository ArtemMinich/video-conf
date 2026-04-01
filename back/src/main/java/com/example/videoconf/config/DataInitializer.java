package com.example.videoconf.config;

import com.example.videoconf.dto.GrantPermissionRequestDto;
import com.example.videoconf.model.FilePermissionType;
import com.example.videoconf.model.User;
import com.example.videoconf.repository.FilePermissionRepository;
import com.example.videoconf.repository.UserRepository;
import com.example.videoconf.service.FilePermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final FilePermissionRepository filePermissionRepository;
    private final UserRepository userRepository;
    private final FilePermissionService filePermissionService;

    @Override
    public void run(String... args) {
        try {
            User user1 = ensureUser("user1", "user1@example.com", "User", "One");
            User user2 = ensureUser("user2", "user2@example.com", "User", "Two");
            User admin1 = ensureUser("admin1", "admin1@example.com", "Admin", "One");

            if (filePermissionRepository.count() > 0) {
                log.info("File permissions already seeded, skipping");
                return;
            }

            String grantedBy = admin1.getUsername();

            grant(user1, "documents/reports", FilePermissionType.READ, grantedBy);
            grant(user1, "documents/reports", FilePermissionType.WRITE, grantedBy);
            grant(user1, "shared", FilePermissionType.READ, grantedBy);
            grant(user1, "shared", FilePermissionType.WRITE, grantedBy);

            grant(user2, "documents/manuals", FilePermissionType.READ, grantedBy);
            grant(user2, "shared", FilePermissionType.READ, grantedBy);
            grant(user2, "shared", FilePermissionType.WRITE, grantedBy);

            log.info("Data seeded: users + file permissions");
        } catch (Exception e) {
            log.warn("Failed to seed data: {}", e.getMessage());
        }
    }

    private User ensureUser(String username, String email, String firstName, String lastName) {
        return userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(User.builder()
                        .username(username)
                        .email(email)
                        .firstName(firstName)
                        .lastName(lastName)
                        .build()));
    }

    private void grant(User user, String path, FilePermissionType type, String grantedBy) {
        GrantPermissionRequestDto req = new GrantPermissionRequestDto();
        req.setUserId(user.getId());
        req.setPath(path);
        req.setPermissionType(type);
        filePermissionService.grantPermission(req, grantedBy);
    }
}
