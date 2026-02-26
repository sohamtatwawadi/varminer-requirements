package com.varminer.dashboard.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "priority_set_items")
public class PrioritySetItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "priority_set_id", nullable = false)
    private PrioritySetEntity prioritySet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    private RequirementEntity requirement;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "start_sprint", length = 100)
    private String startSprint;

    @Column(name = "end_sprint", length = 100)
    private String endSprint;

    @Column(name = "assignee")
    private String assignee;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PrioritySetEntity getPrioritySet() { return prioritySet; }
    public void setPrioritySet(PrioritySetEntity prioritySet) { this.prioritySet = prioritySet; }
    public RequirementEntity getRequirement() { return requirement; }
    public void setRequirement(RequirementEntity requirement) { this.requirement = requirement; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public String getStartSprint() { return startSprint; }
    public void setStartSprint(String startSprint) { this.startSprint = startSprint; }
    public String getEndSprint() { return endSprint; }
    public void setEndSprint(String endSprint) { this.endSprint = endSprint; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public LocalDate getReleaseDate() { return releaseDate; }
    public void setReleaseDate(LocalDate releaseDate) { this.releaseDate = releaseDate; }
}
