package com.varminer.dashboard.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "meeting_requirement_links")
public class MeetingRequirementLinkEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private MeetingEntity meeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    private RequirementEntity requirement;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MeetingEntity getMeeting() { return meeting; }
    public void setMeeting(MeetingEntity meeting) { this.meeting = meeting; }
    public RequirementEntity getRequirement() { return requirement; }
    public void setRequirement(RequirementEntity requirement) { this.requirement = requirement; }
}
