package com.varminer.dashboard.service;

import com.varminer.dashboard.dto.MeetingActionItemDto;
import com.varminer.dashboard.dto.MeetingDto;
import com.varminer.dashboard.entity.*;
import com.varminer.dashboard.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final MeetingDecisionRepository meetingDecisionRepository;
    private final MeetingActionItemRepository meetingActionItemRepository;
    private final MeetingRequirementLinkRepository meetingRequirementLinkRepository;
    private final MeetingReleaseLinkRepository meetingReleaseLinkRepository;
    private final RequirementRepository requirementRepository;
    private final ReleaseRepository releaseRepository;

    public MeetingService(MeetingRepository meetingRepository,
                          MeetingDecisionRepository meetingDecisionRepository,
                          MeetingActionItemRepository meetingActionItemRepository,
                          MeetingRequirementLinkRepository meetingRequirementLinkRepository,
                          MeetingReleaseLinkRepository meetingReleaseLinkRepository,
                          RequirementRepository requirementRepository,
                          ReleaseRepository releaseRepository) {
        this.meetingRepository = meetingRepository;
        this.meetingDecisionRepository = meetingDecisionRepository;
        this.meetingActionItemRepository = meetingActionItemRepository;
        this.meetingRequirementLinkRepository = meetingRequirementLinkRepository;
        this.meetingReleaseLinkRepository = meetingReleaseLinkRepository;
        this.requirementRepository = requirementRepository;
        this.releaseRepository = releaseRepository;
    }

    @Transactional(readOnly = true)
    public List<MeetingDto> findAll() {
        return meetingRepository.findByOrderByMeetingDateDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MeetingDto> findByType(String type) {
        if (type == null || type.isBlank()) return findAll();
        return meetingRepository.findByMeetingTypeOrderByMeetingDateDesc(type).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<MeetingDto> findById(Long id) {
        return meetingRepository.findById(id).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<MeetingActionItemEntity> findOverdueOpenActions() {
        return meetingActionItemRepository.findOverdueOpenActions(LocalDate.now());
    }

    @Transactional
    public MeetingDto create(MeetingDto dto) {
        MeetingEntity e = new MeetingEntity();
        e.setMeetingType(dto.getMeetingType() != null ? dto.getMeetingType() : "weekly");
        e.setMeetingDate(dto.getMeetingDate());
        e.setAttendees(dto.getAttendees());
        e.setAgenda(dto.getAgenda());
        e.setSummary(dto.getSummary());
        e = meetingRepository.save(e);
        saveDecisions(e, dto.getDecisions());
        saveActionItems(e, dto.getActionItems());
        linkRequirements(e, dto.getRequirementIds());
        linkReleases(e, dto.getReleaseIds());
        return toDto(meetingRepository.findById(e.getId()).orElse(e));
    }

    @Transactional
    public Optional<MeetingDto> update(Long id, MeetingDto dto) {
        return meetingRepository.findById(id).map(e -> {
            e.setMeetingType(dto.getMeetingType() != null ? dto.getMeetingType() : e.getMeetingType());
            e.setMeetingDate(dto.getMeetingDate());
            e.setAttendees(dto.getAttendees());
            e.setAgenda(dto.getAgenda());
            e.setSummary(dto.getSummary());
            e = meetingRepository.save(e);
            e.getDecisions().clear();
            e.getActionItems().clear();
            meetingRepository.save(e);
            saveDecisions(e, dto.getDecisions());
            saveActionItems(e, dto.getActionItems());
            meetingRequirementLinkRepository.deleteByMeetingId(id);
            meetingReleaseLinkRepository.deleteByMeetingId(id);
            linkRequirements(e, dto.getRequirementIds());
            linkReleases(e, dto.getReleaseIds());
            return toDto(meetingRepository.findById(e.getId()).orElse(e));
        });
    }

    private void saveDecisions(MeetingEntity meeting, List<String> texts) {
        if (texts == null) return;
        for (int i = 0; i < texts.size(); i++) {
            MeetingDecisionEntity d = new MeetingDecisionEntity();
            d.setMeeting(meeting);
            d.setDecisionText(texts.get(i));
            d.setSortOrder(i);
            meeting.getDecisions().add(d);
        }
        meetingRepository.save(meeting);
    }

    private void saveActionItems(MeetingEntity meeting, List<MeetingActionItemDto> items) {
        if (items == null) return;
        for (int i = 0; i < items.size(); i++) {
            MeetingActionItemDto it = items.get(i);
            MeetingActionItemEntity a = new MeetingActionItemEntity();
            a.setMeeting(meeting);
            a.setActionText(it.getActionText());
            a.setOwner(it.getOwner());
            a.setDueDate(it.getDueDate());
            a.setStatus(it.getStatus() != null ? it.getStatus() : "open");
            a.setSortOrder(i);
            meeting.getActionItems().add(a);
        }
        meetingRepository.save(meeting);
    }

    private void linkRequirements(MeetingEntity meeting, List<String> externalIds) {
        if (externalIds == null) return;
        for (String extId : externalIds) {
            requirementRepository.findByExternalId(extId.trim()).ifPresent(req -> {
                MeetingRequirementLinkEntity link = new MeetingRequirementLinkEntity();
                link.setMeeting(meeting);
                link.setRequirement(req);
                meetingRequirementLinkRepository.save(link);
            });
        }
    }

    private void linkReleases(MeetingEntity meeting, List<Long> releaseIds) {
        if (releaseIds == null) return;
        for (Long rid : releaseIds) {
            releaseRepository.findById(rid).ifPresent(release -> {
                MeetingReleaseLinkEntity link = new MeetingReleaseLinkEntity();
                link.setMeeting(meeting);
                link.setRelease(release);
                meetingReleaseLinkRepository.save(link);
            });
        }
    }

    @Transactional
    public boolean delete(Long id) {
        if (!meetingRepository.existsById(id)) return false;
        meetingRepository.deleteById(id);
        return true;
    }

    private MeetingDto toDto(MeetingEntity e) {
        MeetingDto dto = new MeetingDto();
        dto.setId(e.getId());
        dto.setMeetingType(e.getMeetingType());
        dto.setMeetingDate(e.getMeetingDate());
        dto.setAttendees(e.getAttendees());
        dto.setAgenda(e.getAgenda());
        dto.setSummary(e.getSummary());
        dto.setDecisions(e.getDecisions().stream().map(MeetingDecisionEntity::getDecisionText).collect(Collectors.toList()));
        dto.setActionItems(e.getActionItems().stream().map(a -> {
            MeetingActionItemDto ad = new MeetingActionItemDto();
            ad.setId(a.getId());
            ad.setActionText(a.getActionText());
            ad.setOwner(a.getOwner());
            ad.setDueDate(a.getDueDate());
            ad.setStatus(a.getStatus());
            return ad;
        }).collect(Collectors.toList()));
        dto.setRequirementIds(meetingRequirementLinkRepository.findByMeetingId(e.getId()).stream()
                .map(l -> l.getRequirement().getExternalId())
                .collect(Collectors.toList()));
        dto.setReleaseIds(meetingReleaseLinkRepository.findByMeetingId(e.getId()).stream()
                .map(l -> l.getRelease().getId())
                .collect(Collectors.toList()));
        return dto;
    }
}
