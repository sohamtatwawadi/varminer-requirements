package com.varminer.dashboard.service;

import com.varminer.dashboard.model.JiraPushRequest;
import com.varminer.dashboard.model.Requirement;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.Base64;
import java.util.stream.Collectors;

@Service
public class JiraService {

    private static final String PRIORITY_MAP_CRITICAL = "Highest";
    private static final String PRIORITY_MAP_HIGH = "High";
    private static final String PRIORITY_MAP_MEDIUM = "Medium";
    private static final String PRIORITY_MAP_LOW = "Low";

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> pushToJira(List<Requirement> requirements, JiraPushRequest req) {
        if (req.getBaseUrl() == null || req.getBaseUrl().isBlank() ||
            req.getProjectKey() == null || req.getProjectKey().isBlank() ||
            req.getEmail() == null || req.getEmail().isBlank() ||
            req.getApiToken() == null || req.getApiToken().isBlank()) {
            return Map.of("error", "Jira base URL, project key, email, and API token are required.");
        }
        String baseUrl = req.getBaseUrl().trim().replaceAll("/$", "");
        String auth = Base64.getEncoder().encodeToString((req.getEmail().trim() + ":" + req.getApiToken()).getBytes(StandardCharsets.UTF_8));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + auth);
        List<String> created = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        for (Requirement r : requirements) {
            try {
                String key = createIssue(baseUrl, headers, req.getProjectKey(), r);
                if (key != null) created.add(key);
            } catch (Exception e) {
                errors.add((r.getId() != null ? r.getId() : "?") + ": " + e.getMessage());
            }
        }
        return Map.of(
            "created", created,
            "createdCount", created.size(),
            "errors", errors
        );
    }

    private String createIssue(String baseUrl, HttpHeaders headers, String projectKey, Requirement r) {
        String summary = r.getRequirement() != null ? r.getRequirement() : "Requirement " + r.getId();
        if (summary.length() > 255) summary = summary.substring(0, 252) + "...";
        StringBuilder desc = new StringBuilder();
        if (r.getDescription() != null && !r.getDescription().isBlank()) {
            desc.append(r.getDescription()).append("\n\n");
        }
        if (r.getAcceptanceCriteria() != null && !r.getAcceptanceCriteria().isBlank()) {
            desc.append("Acceptance criteria:\n").append(r.getAcceptanceCriteria()).append("\n\n");
        }
        desc.append("VarMiner ID: ").append(r.getId() != null ? r.getId() : "-");
        if (r.getPriority() != null) desc.append(" | Priority: ").append(r.getPriority());
        if (r.getStatus() != null) desc.append(" | Status: ").append(r.getStatus());
        String priorityName = mapPriority(r.getPriority());
        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("project", Map.of("key", projectKey));
        fields.put("summary", summary);
        fields.put("description", Map.of(
            "type", "doc",
            "version", 1,
            "content", List.of(Map.of(
                "type", "paragraph",
                "content", List.of(Map.of("type", "text", "text", desc.toString()))
            ))
        ));
        fields.put("issuetype", Map.of("name", "Task"));
        fields.put("priority", Map.of("name", priorityName));
        body.put("fields", fields);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String url = baseUrl + "/rest/api/3/issue";
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().containsKey("key")) {
            return (String) response.getBody().get("key");
        }
        return null;
    }

    private static String mapPriority(String p) {
        if (p == null) return PRIORITY_MAP_LOW;
        switch (p.trim()) {
            case "Critical": return PRIORITY_MAP_CRITICAL;
            case "High": return PRIORITY_MAP_HIGH;
            case "Medium": return PRIORITY_MAP_MEDIUM;
            case "Low": return PRIORITY_MAP_LOW;
            default: return PRIORITY_MAP_LOW;
        }
    }
}
