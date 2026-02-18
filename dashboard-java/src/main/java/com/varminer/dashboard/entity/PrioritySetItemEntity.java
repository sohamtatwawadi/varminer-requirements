package com.varminer.dashboard.entity;

import jakarta.persistence.*;

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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PrioritySetEntity getPrioritySet() { return prioritySet; }
    public void setPrioritySet(PrioritySetEntity prioritySet) { this.prioritySet = prioritySet; }
    public RequirementEntity getRequirement() { return requirement; }
    public void setRequirement(RequirementEntity requirement) { this.requirement = requirement; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
