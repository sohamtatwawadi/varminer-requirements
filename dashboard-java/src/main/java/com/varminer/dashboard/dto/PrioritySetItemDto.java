package com.varminer.dashboard.dto;

import com.varminer.dashboard.model.Requirement;

import java.time.LocalDate;

public class PrioritySetItemDto {
    private Long id;
    private String requirementId;
    private Integer sortOrder;
    private String startSprint;
    private String endSprint;
    private String assignee;
    private LocalDate releaseDate;
    private Requirement requirement; // optional summary for UI

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRequirementId() { return requirementId; }
    public void setRequirementId(String requirementId) { this.requirementId = requirementId; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getStartSprint() { return startSprint; }
    public void setStartSprint(String startSprint) { this.startSprint = startSprint; }
    public String getEndSprint() { return endSprint; }
    public void setEndSprint(String endSprint) { this.endSprint = endSprint; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public LocalDate getReleaseDate() { return releaseDate; }
    public void setReleaseDate(LocalDate releaseDate) { this.releaseDate = releaseDate; }
    public Requirement getRequirement() { return requirement; }
    public void setRequirement(Requirement requirement) { this.requirement = requirement; }
}
