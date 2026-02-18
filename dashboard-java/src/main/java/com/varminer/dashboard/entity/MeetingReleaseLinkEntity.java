package com.varminer.dashboard.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "meeting_release_links")
public class MeetingReleaseLinkEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private MeetingEntity meeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "release_id", nullable = false)
    private ReleaseEntity release;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MeetingEntity getMeeting() { return meeting; }
    public void setMeeting(MeetingEntity meeting) { this.meeting = meeting; }
    public ReleaseEntity getRelease() { return release; }
    public void setRelease(ReleaseEntity release) { this.release = release; }
}
