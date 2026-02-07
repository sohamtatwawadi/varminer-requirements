package com.varminer.dashboard.model;

import java.util.List;

public class JiraPushRequest {
    private String baseUrl;
    private String projectKey;
    private String email;
    private String apiToken;
    private List<String> requirementIds;

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getProjectKey() { return projectKey; }
    public void setProjectKey(String projectKey) { this.projectKey = projectKey; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getApiToken() { return apiToken; }
    public void setApiToken(String apiToken) { this.apiToken = apiToken; }
    public List<String> getRequirementIds() { return requirementIds; }
    public void setRequirementIds(List<String> requirementIds) { this.requirementIds = requirementIds; }
}
