package com.varminer.dashboard.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.varminer.dashboard.service.RequirementsService;
import com.varminer.dashboard.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Map;

/**
 * One-time import from requirements.csv and users.json.
 * Enabled only when VARMINER_IMPORT_ENABLED=true. Admin-only.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AdminImportController {

    private final RequirementsService requirementsService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Value("${varminer.import.enabled:false}")
    private boolean importEnabled;

    public AdminImportController(RequirementsService requirementsService, UserService userService, ObjectMapper objectMapper) {
        this.requirementsService = requirementsService;
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    /**
     * Import requirements from CSV. Optional: users from JSON (array of { "username", "password" }).
     * POST multipart: "requirements" = CSV file, "users" = JSON file (optional).
     */
    @PostMapping(value = "/import", consumes = "multipart/form-data")
    public ResponseEntity<?> importData(
            Principal principal,
            @RequestParam(value = "requirements", required = false) MultipartFile requirementsFile,
            @RequestParam(value = "users", required = false) MultipartFile usersFile
    ) {
        if (!importEnabled) {
            return ResponseEntity.status(403).body(Map.of("error", "Import is disabled. Set VARMINER_IMPORT_ENABLED=true to enable."));
        }
        if (principal == null || !userService.isAdmin(principal.getName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin only"));
        }
        int requirementsImported = 0;
        int usersImported = 0;
        StringBuilder errors = new StringBuilder();
        if (requirementsFile != null && !requirementsFile.isEmpty()) {
            try {
                requirementsImported = requirementsService.importFromCsv(requirementsFile.getInputStream());
            } catch (IOException e) {
                errors.append("Requirements: ").append(e.getMessage()).append("; ");
            }
        }
        if (usersFile != null && !usersFile.isEmpty()) {
            try {
                String json = new String(usersFile.getBytes(), StandardCharsets.UTF_8);
                JsonNode arr = objectMapper.readTree(json);
                if (arr.isArray()) {
                    for (JsonNode node : arr) {
                        String u = node.has("username") ? node.get("username").asText() : null;
                        String p = node.has("password") ? node.get("password").asText() : null;
                        if (u != null && !u.isBlank() && p != null) {
                            try {
                                userService.addUser(u, p);
                                usersImported++;
                            } catch (IllegalArgumentException ignored) { /* already exists */ }
                        }
                    }
                }
            } catch (Exception e) {
                errors.append("Users: ").append(e.getMessage());
            }
        }
        if (errors.length() > 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", errors.toString(),
                    "imported", Map.of("requirements", requirementsImported, "users", usersImported)
            ));
        }
        return ResponseEntity.ok(Map.of(
                "imported", Map.of("requirements", requirementsImported, "users", usersImported)
        ));
    }
}
