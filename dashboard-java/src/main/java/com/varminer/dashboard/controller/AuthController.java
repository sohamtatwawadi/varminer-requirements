package com.varminer.dashboard.controller;

import com.varminer.dashboard.model.UserInfo;
import com.varminer.dashboard.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowCredentials = "true")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserInfo me(Principal principal) {
        if (principal == null) return null;
        String role = userService.isAdmin(principal.getName()) ? "ADMIN" : "USER";
        return new UserInfo(principal.getName(), role);
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(Principal principal) {
        if (principal == null || !userService.isAdmin(principal.getName())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(userService.listUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<?> addUser(Principal principal, @RequestBody Map<String, String> body) {
        if (principal == null || !userService.isAdmin(principal.getName())) {
            return ResponseEntity.status(403).build();
        }
        String username = body.get("username");
        String password = body.get("password");
        try {
            userService.addUser(username, password);
            return ResponseEntity.ok(Map.of("message", "User added"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
