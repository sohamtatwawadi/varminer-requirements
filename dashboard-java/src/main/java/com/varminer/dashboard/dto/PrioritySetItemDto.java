package com.varminer.dashboard.dto;

import com.varminer.dashboard.model.Requirement;

public class PrioritySetItemDto {
    private Long id;
    private String requirementId;
    private Integer sortOrder;
    private Requirement requirement; // optional summary for UI

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRequirementId() { return requirementId; }
    public void setRequirementId(String requirementId) { this.requirementId = requirementId; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Requirement getRequirement() { return requirement; }
    public void setRequirement(Requirement requirement) { this.requirement = requirement; }
}
