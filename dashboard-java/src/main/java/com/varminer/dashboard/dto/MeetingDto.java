package com.varminer.dashboard.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class MeetingDto {
    private Long id;
    private String meetingType;
    private LocalDate meetingDate;
    private String attendees;
    private String agenda;
    private String summary;
    private List<String> decisions = new ArrayList<>();
    private List<MeetingActionItemDto> actionItems = new ArrayList<>();
    private List<String> requirementIds = new ArrayList<>();
    private List<Long> releaseIds = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMeetingType() { return meetingType; }
    public void setMeetingType(String meetingType) { this.meetingType = meetingType; }
    public LocalDate getMeetingDate() { return meetingDate; }
    public void setMeetingDate(LocalDate meetingDate) { this.meetingDate = meetingDate; }
    public String getAttendees() { return attendees; }
    public void setAttendees(String attendees) { this.attendees = attendees; }
    public String getAgenda() { return agenda; }
    public void setAgenda(String agenda) { this.agenda = agenda; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public List<String> getDecisions() { return decisions; }
    public void setDecisions(List<String> decisions) { this.decisions = decisions; }
    public List<MeetingActionItemDto> getActionItems() { return actionItems; }
    public void setActionItems(List<MeetingActionItemDto> actionItems) { this.actionItems = actionItems; }
    public List<String> getRequirementIds() { return requirementIds; }
    public void setRequirementIds(List<String> requirementIds) { this.requirementIds = requirementIds; }
    public List<Long> getReleaseIds() { return releaseIds; }
    public void setReleaseIds(List<Long> releaseIds) { this.releaseIds = releaseIds; }
}
