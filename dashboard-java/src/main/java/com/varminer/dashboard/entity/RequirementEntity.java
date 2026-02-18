package com.varminer.dashboard.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "requirements")
public class RequirementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", nullable = false, unique = true, length = 100)
    private String externalId;

    @Column(length = 255)
    private String category;

    @Column(length = 100)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String requirement;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    private String acceptanceCriteria;

    @Column(name = "clear_req", length = 10)
    private String clearReq;

    @Column(length = 50)
    private String estimate;

    @Column(length = 500)
    private String dependency;

    @Column(length = 50)
    private String priority;

    @Column(name = "stack_rank", length = 50)
    private String stackRank;

    @Column(nullable = false, length = 100)
    private String status = "Not Started";

    @Column(name = "start_sprint", length = 100)
    private String startSprint;

    @Column(name = "target_sprint", length = 100)
    private String targetSprint;

    @Column(name = "release_text", length = 255)
    private String releaseText;

    @Column(name = "release_quarter", length = 50)
    private String releaseQuarter;

    @Column(name = "release_month", length = 10)
    private String releaseMonth;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "requestee_dept", length = 255)
    private String requesteeDept;

    @Column(name = "requested_by", length = 255)
    private String requestedBy;

    @Column(length = 255)
    private String assignee;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private String[] tags;

    @Column(name = "risk_level", length = 50)
    private String riskLevel;

    @Column(nullable = false)
    private boolean blocked = false;

    @Column(name = "blocker_reason", columnDefinition = "TEXT")
    private String blockerReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", length = 255)
    private String updatedBy;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    // Getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
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
    public String getClearReq() { return clearReq; }
    public void setClearReq(String clearReq) { this.clearReq = clearReq; }
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
    public String getReleaseText() { return releaseText; }
    public void setReleaseText(String releaseText) { this.releaseText = releaseText; }
    public String getReleaseQuarter() { return releaseQuarter; }
    public void setReleaseQuarter(String releaseQuarter) { this.releaseQuarter = releaseQuarter; }
    public String getReleaseMonth() { return releaseMonth; }
    public void setReleaseMonth(String releaseMonth) { this.releaseMonth = releaseMonth; }
    public LocalDate getReleaseDate() { return releaseDate; }
    public void setReleaseDate(LocalDate releaseDate) { this.releaseDate = releaseDate; }
    public String getRequesteeDept() { return requesteeDept; }
    public void setRequesteeDept(String requesteeDept) { this.requesteeDept = requesteeDept; }
    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public String[] getTags() { return tags; }
    public void setTags(String[] tags) { this.tags = tags; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }
    public String getBlockerReason() { return blockerReason; }
    public void setBlockerReason(String blockerReason) { this.blockerReason = blockerReason; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
