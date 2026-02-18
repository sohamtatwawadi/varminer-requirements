package com.varminer.dashboard.service;

import com.varminer.dashboard.entity.UserEntity;
import com.varminer.dashboard.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final String USER_ROLE = "USER";

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    @Value("${varminer.admin.username:}")
    private String adminUsernameEnv;

    @Value("${varminer.admin.password:}")
    private String adminPasswordEnv;

    public UserService(PasswordEncoder passwordEncoder, UserRepository userRepository) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    /** Seed admin: from env (ADMIN_USERNAME, ADMIN_PASSWORD) if set; else if no users exist, create default admin. */
    @PostConstruct
    @Transactional
    public void seedAdminIfConfigured() {
        String username;
        String password;
        if (adminUsernameEnv != null && !adminUsernameEnv.isBlank() && adminPasswordEnv != null && !adminPasswordEnv.isBlank()) {
            username = adminUsernameEnv.trim().toLowerCase();
            password = adminPasswordEnv;
        } else if (userRepository.count() == 0) {
            username = "soham.tatwawadi";
            password = "soham1010";
        } else {
            return;
        }
        if (userRepository.findByUsernameIgnoreCase(username).isEmpty()) {
            UserEntity admin = new UserEntity();
            admin.setUsername(username);
            admin.setPasswordHash(passwordEncoder.encode(password));
            admin.setRole(ADMIN_ROLE);
            userRepository.save(admin);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity u = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return User.builder()
                .username(u.getUsername())
                .password(u.getPasswordHash())
                .authorities(u.getRole().equals(ADMIN_ROLE)
                        ? List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"))
                        : List.of(new SimpleGrantedAuthority("ROLE_USER")))
                .build();
    }

    @Transactional(readOnly = true)
    public boolean isAdmin(String username) {
        return userRepository.findByUsernameIgnoreCase(username)
                .map(u -> ADMIN_ROLE.equals(u.getRole()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<Map<String, String>> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> Map.of("username", u.getUsername(), "role", u.getRole()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void addUser(String username, String rawPassword) {
        if (username == null || username.isBlank()) throw new IllegalArgumentException("Username required");
        if (rawPassword == null || rawPassword.length() < 4) throw new IllegalArgumentException("Password must be at least 4 characters");
        username = username.trim().toLowerCase();
        if (userRepository.existsByUsernameIgnoreCase(username)) throw new IllegalArgumentException("User already exists");
        UserEntity u = new UserEntity();
        u.setUsername(username);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        u.setRole(USER_ROLE);
        userRepository.save(u);
    }
}
