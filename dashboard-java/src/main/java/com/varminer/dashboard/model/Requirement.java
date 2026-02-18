package com.varminer.dashboard.model;

import com.opencsv.bean.CsvBindByName;

public class Requirement {

    @CsvBindByName(column = "ID")
    private String id;

    @CsvBindByName(column = "Category")
    private String category;

    @CsvBindByName(column = "Type")
    private String type;

    @CsvBindByName(column = "Requirement")
    private String requirement;

    @CsvBindByName(column = "Description")
    private String description;

    @CsvBindByName(column = "Acceptance criteria")
    private String acceptanceCriteria;

    @CsvBindByName(column = "Clear?")
    private String clear;

    @CsvBindByName(column = "Estimate")
    private String estimate;

    @CsvBindByName(column = "Dependency")
    private String dependency;

    @CsvBindByName(column = "Priority")
    private String priority;

    @CsvBindByName(column = "Stack rank")
    private String stackRank;

    @CsvBindByName(column = "Status")
    private String status;

    @CsvBindByName(column = "Start sprint")
    private String startSprint;

    @CsvBindByName(column = "Target sprint")
    private String targetSprint;

    @CsvBindByName(column = "Release")
    private String release;

    @CsvBindByName(column = "Requestee dept")
    private String requesteeDept;

    @CsvBindByName(column = "Requested by")
    private String requestedBy;

    @CsvBindByName(column = "Assignee")
    private String assignee;

    @CsvBindByName(column = "Comments")
    private String comments;

    /** Release month YYYY-MM for roadmap (optional; not in CSV). */
    private String releaseMonth;

    public Requirement() {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getRequirement() { return requirement; }
    public void setRequirement(String requirement) { this.requirement = requirement; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAcceptanceCriteria() { return acceptanceCriteria; }
    public void setAcceptanceCriteria(String acceptanceCriteria) { this.acceptanceCriteria = acceptanceCriteria; }
    public String getClear() { return clear; }
    public void setClear(String clear) { this.clear = clear; }
    public String getEstimate() { return estimate; }
    public void setEstimate(String estimate) { this.estimate = estimate; }
    public String getDependency() { return dependency; }
    public void setDependency(String dependency) { this.dependency = dependency; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStackRank() { return stackRank; }
    public void setStackRank(String stackRank) { this.stackRank = stackRank; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getStartSprint() { return startSprint; }
    public void setStartSprint(String startSprint) { this.startSprint = startSprint; }
    public String getTargetSprint() { return targetSprint; }
    public void setTargetSprint(String targetSprint) { this.targetSprint = targetSprint; }
    public String getRelease() { return release; }
    public void setRelease(String release) { this.release = release; }
    public String getRequesteeDept() { return requesteeDept; }
    public void setRequesteeDept(String requesteeDept) { this.requesteeDept = requesteeDept; }
    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public String getReleaseMonth() { return releaseMonth; }
    public void setReleaseMonth(String releaseMonth) { this.releaseMonth = releaseMonth; }
}
