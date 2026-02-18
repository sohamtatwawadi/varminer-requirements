package com.varminer.dashboard.service;

import com.varminer.dashboard.dto.ReleaseCommentDto;
import com.varminer.dashboard.dto.ReleaseDto;
import com.varminer.dashboard.entity.ReleaseEntity;
import com.varminer.dashboard.entity.ReleaseCommentEntity;
import com.varminer.dashboard.entity.ReleaseRequirementLinkEntity;
import com.varminer.dashboard.entity.RequirementEntity;
import com.varminer.dashboard.mapper.RequirementMapper;
import com.varminer.dashboard.repository.ReleaseRepository;
import com.varminer.dashboard.repository.RequirementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReleaseService {

    private final ReleaseRepository releaseRepository;
    private final RequirementRepository requirementRepository;
    private final RequirementMapper requirementMapper;

    public ReleaseService(ReleaseRepository releaseRepository, RequirementRepository requirementRepository, RequirementMapper requirementMapper) {
        this.releaseRepository = releaseRepository;
        this.requirementRepository = requirementRepository;
        this.requirementMapper = requirementMapper;
    }

    @Transactional(readOnly = true)
    public List<ReleaseDto> findAll() {
        return releaseRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReleaseDto> findUpcoming() {
        return releaseRepository.findUpcoming(LocalDate.now()).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ReleaseDto> findById(Long id) {
        return releaseRepository.findById(id).map(this::toDto);
    }

    @Transactional
    public ReleaseDto create(ReleaseDto dto) {
        ReleaseEntity e = new ReleaseEntity();
        e.setName(dto.getName());
        e.setVersion(dto.getVersion());
        e.setPlannedDate(dto.getPlannedDate());
        e.setReleaseDate(dto.getReleaseDate());
        e.setStatus(dto.getStatus() != null ? dto.getStatus() : "planned");
        e.setReleaseNotes(dto.getReleaseNotes());
        e.setInternalComments(dto.getInternalComments());
        e = releaseRepository.save(e);
        if (dto.getRequirementIds() != null && !dto.getRequirementIds().isEmpty()) {
            linkRequirements(e, dto.getRequirementIds());
        }
        return toDto(releaseRepository.findById(e.getId()).orElse(e));
    }

    @Transactional
    public Optional<ReleaseDto> update(Long id, ReleaseDto dto) {
        return releaseRepository.findById(id).map(e -> {
            e.setName(dto.getName());
            e.setVersion(dto.getVersion());
            e.setPlannedDate(dto.getPlannedDate());
            e.setReleaseDate(dto.getReleaseDate());
            if (dto.getStatus() != null) e.setStatus(dto.getStatus());
            e.setReleaseNotes(dto.getReleaseNotes());
            e.setInternalComments(dto.getInternalComments());
            e = releaseRepository.save(e);
            if (dto.getRequirementIds() != null) {
                e.getRequirementLinks().clear();
                releaseRepository.save(e);
                linkRequirements(e, dto.getRequirementIds());
            }
            return toDto(releaseRepository.findById(e.getId()).orElse(e));
        });
    }

    private void linkRequirements(ReleaseEntity release, List<String> externalIds) {
        for (String extId : externalIds) {
            requirementRepository.findByExternalId(extId.trim()).ifPresent(req -> {
                ReleaseRequirementLinkEntity link = new ReleaseRequirementLinkEntity();
                link.setRelease(release);
                link.setRequirement(req);
                release.getRequirementLinks().add(link);
            });
        }
        releaseRepository.save(release);
    }

    @Transactional
    public boolean delete(Long id) {
        if (!releaseRepository.existsById(id)) return false;
        releaseRepository.deleteById(id);
        return true;
    }

    @Transactional
    public ReleaseCommentDto addComment(Long releaseId, String authorUsername, String body) {
        ReleaseEntity release = releaseRepository.findById(releaseId).orElseThrow();
        ReleaseCommentEntity c = new ReleaseCommentEntity();
        c.setRelease(release);
        c.setAuthorUsername(authorUsername);
        c.setBody(body);
        release.getCommentList().add(c);
        releaseRepository.save(release);
        ReleaseCommentDto dto = new ReleaseCommentDto();
        dto.setId(c.getId());
        dto.setAuthorUsername(c.getAuthorUsername());
        dto.setBody(c.getBody());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }

    private ReleaseDto toDto(ReleaseEntity e) {
        ReleaseDto dto = new ReleaseDto();
        dto.setId(e.getId());
        dto.setName(e.getName());
        dto.setVersion(e.getVersion());
        dto.setPlannedDate(e.getPlannedDate());
        dto.setReleaseDate(e.getReleaseDate());
        dto.setStatus(e.getStatus());
        dto.setReleaseNotes(e.getReleaseNotes());
        dto.setInternalComments(e.getInternalComments());
        dto.setRequirementIds(e.getRequirementLinks().stream()
                .map(l -> l.getRequirement().getExternalId())
                .collect(Collectors.toList()));
        dto.setComments(e.getCommentList().stream().map(c -> {
            ReleaseCommentDto cd = new ReleaseCommentDto();
            cd.setId(c.getId());
            cd.setAuthorUsername(c.getAuthorUsername());
            cd.setBody(c.getBody());
            cd.setCreatedAt(c.getCreatedAt());
            return cd;
        }).collect(Collectors.toList()));
        return dto;
    }
}
