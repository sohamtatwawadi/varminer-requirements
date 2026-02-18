package com.varminer.dashboard.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ReleaseDto {
    private Long id;
    private String name;
    private String version;
    private LocalDate plannedDate;
    private LocalDate releaseDate;
    private String status;
    private String releaseNotes;
    private String internalComments;
    private List<String> requirementIds = new ArrayList<>();
    private List<ReleaseCommentDto> comments = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public LocalDate getPlannedDate() { return plannedDate; }
    public void setPlannedDate(LocalDate plannedDate) { this.plannedDate = plannedDate; }
    public LocalDate getReleaseDate() { return releaseDate; }
    public void setReleaseDate(LocalDate releaseDate) { this.releaseDate = releaseDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReleaseNotes() { return releaseNotes; }
    public void setReleaseNotes(String releaseNotes) { this.releaseNotes = releaseNotes; }
    public String getInternalComments() { return internalComments; }
    public void setInternalComments(String internalComments) { this.internalComments = internalComments; }
    public List<String> getRequirementIds() { return requirementIds; }
    public void setRequirementIds(List<String> requirementIds) { this.requirementIds = requirementIds; }
    public List<ReleaseCommentDto> getComments() { return comments; }
    public void setComments(List<ReleaseCommentDto> comments) { this.comments = comments; }
}
