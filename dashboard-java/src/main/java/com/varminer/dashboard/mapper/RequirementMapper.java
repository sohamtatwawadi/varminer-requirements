package com.varminer.dashboard.mapper;

import com.varminer.dashboard.entity.RequirementEntity;
import com.varminer.dashboard.model.Requirement;
import org.springframework.stereotype.Component;

/**
 * Maps between RequirementEntity (DB) and Requirement (API DTO).
 * API preserves legacy field names: id = externalId, release = releaseText, clear = clearReq.
 */
@Component
public class RequirementMapper {

    public Requirement toDto(RequirementEntity e) {
        if (e == null) return null;
        Requirement r = new Requirement();
        r.setId(e.getExternalId());
        r.setCategory(e.getCategory());
        r.setType(e.getType());
        r.setRequirement(e.getRequirement());
        r.setDescription(e.getDescription());
        r.setAcceptanceCriteria(e.getAcceptanceCriteria());
        r.setClear(e.getClearReq());
        r.setEstimate(e.getEstimate());
        r.setDependency(e.getDependency());
        r.setPriority(e.getPriority());
        r.setStackRank(e.getStackRank());
        r.setStatus(e.getStatus());
        r.setStartSprint(e.getStartSprint());
        r.setTargetSprint(e.getTargetSprint());
        r.setRelease(e.getReleaseText());
        r.setRequesteeDept(e.getRequesteeDept());
        r.setRequestedBy(e.getRequestedBy());
        r.setAssignee(e.getAssignee());
        r.setComments(e.getComments());
        r.setReleaseMonth(e.getReleaseMonth());
        return r;
    }

    /** Copy DTO fields onto entity (for add/update). Does not set externalId (set on create or from path on update). */
    public void updateEntityFromDto(Requirement dto, RequirementEntity e) {
        e.setCategory(dto.getCategory());
        e.setType(dto.getType());
        e.setRequirement(dto.getRequirement());
        e.setDescription(dto.getDescription());
        e.setAcceptanceCriteria(dto.getAcceptanceCriteria());
        e.setClearReq(dto.getClear());
        e.setEstimate(dto.getEstimate());
        e.setDependency(dto.getDependency());
        e.setPriority(dto.getPriority());
        e.setStackRank(dto.getStackRank());
        e.setStatus(dto.getStatus());
        e.setStartSprint(dto.getStartSprint());
        e.setTargetSprint(dto.getTargetSprint());
        e.setReleaseText(dto.getRelease());
        e.setRequesteeDept(dto.getRequesteeDept());
        e.setRequestedBy(dto.getRequestedBy());
        e.setAssignee(dto.getAssignee());
        e.setComments(dto.getComments());
        if (dto.getReleaseMonth() != null) e.setReleaseMonth(dto.getReleaseMonth());
    }

    /** New entity from DTO. Caller sets externalId if not from DTO. */
    public RequirementEntity toEntity(Requirement dto) {
        RequirementEntity e = new RequirementEntity();
        e.setExternalId(dto.getId() != null && !dto.getId().isBlank() ? dto.getId().trim() : null);
        updateEntityFromDto(dto, e);
        return e;
    }
}
