package com.varminer.dashboard.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "release_requirement_links")
public class ReleaseRequirementLinkEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "release_id", nullable = false)
    private ReleaseEntity release;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    private RequirementEntity requirement;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ReleaseEntity getRelease() { return release; }
    public void setRelease(ReleaseEntity release) { this.release = release; }
    public RequirementEntity getRequirement() { return requirement; }
    public void setRequirement(RequirementEntity requirement) { this.requirement = requirement; }
}
