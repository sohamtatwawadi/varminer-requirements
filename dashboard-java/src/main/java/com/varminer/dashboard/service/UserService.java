package com.varminer.dashboard.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService implements UserDetailsService {

    private static final String ADMIN_USERNAME = "soham.tatwawadi";
    private static final String ADMIN_ROLE = "ADMIN";
    private static final String USER_ROLE = "USER";

    private final PasswordEncoder passwordEncoder;
    private final Map<String, StoredUser> users = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${varminer.requirements.csv-path:}")
    private String csvPathConfig;

    private Path usersFilePath;

    public UserService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void init() {
        Path baseDir;
        if (csvPathConfig != null && !csvPathConfig.isBlank()) {
            baseDir = Paths.get(csvPathConfig).getParent();
        } else {
            baseDir = Paths.get(System.getProperty("user.dir")).getParent();
        }
        if (baseDir == null) baseDir = Paths.get(System.getProperty("user.dir"));
        usersFilePath = baseDir.resolve("users.json");
        users.put(ADMIN_USERNAME, new StoredUser(ADMIN_USERNAME, passwordEncoder.encode("soham1010"), ADMIN_ROLE));
        loadUsersFromFile();
    }

    private void loadUsersFromFile() {
        if (!Files.exists(usersFilePath)) return;
        try {
            String json = Files.readString(usersFilePath);
            CollectionType type = objectMapper.getTypeFactory().constructCollectionType(List.class, StoredUser.class);
            List<StoredUser> list = objectMapper.readValue(json, type);
            for (StoredUser u : list) {
                if (!ADMIN_USERNAME.equals(u.username)) users.put(u.username, u);
            }
        } catch (Exception ignored) {}
    }

    private void saveUsersToFile() {
        try {
            List<StoredUser> list = users.values().stream()
                    .filter(u -> !ADMIN_USERNAME.equals(u.username))
                    .collect(Collectors.toList());
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(list);
            Files.writeString(usersFilePath, json);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save users", e);
        }
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        StoredUser u = users.get(username);
        if (u == null) throw new UsernameNotFoundException("User not found: " + username);
        return User.builder()
            .username(u.username)
            .password(u.passwordHash)
            .authorities(u.role.equals(ADMIN_ROLE) ? List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"))
                : List.of(new SimpleGrantedAuthority("ROLE_USER")))
            .build();
    }

    public boolean isAdmin(String username) {
        StoredUser u = users.get(username);
        return u != null && ADMIN_ROLE.equals(u.role);
    }

    public List<Map<String, String>> listUsers() {
        return users.values().stream()
            .map(u -> Map.of("username", u.username, "role", u.role))
            .collect(Collectors.toList());
    }

    public void addUser(String username, String rawPassword) {
        if (username == null || username.isBlank()) throw new IllegalArgumentException("Username required");
        if (rawPassword == null || rawPassword.length() < 4) throw new IllegalArgumentException("Password must be at least 4 characters");
        username = username.trim().toLowerCase();
        if (users.containsKey(username)) throw new IllegalArgumentException("User already exists");
        users.put(username, new StoredUser(username, passwordEncoder.encode(rawPassword), USER_ROLE));
        saveUsersToFile();
    }

    public static class StoredUser {
        public String username;
        public String passwordHash;
        public String role;

        public StoredUser() {}
        public StoredUser(String username, String passwordHash, String role) {
            this.username = username;
            this.passwordHash = passwordHash;
            this.role = role;
        }
    }
}
