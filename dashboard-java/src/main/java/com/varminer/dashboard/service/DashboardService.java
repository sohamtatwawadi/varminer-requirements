package com.varminer.dashboard.service;

import com.varminer.dashboard.dto.MeetingActionItemDto;
import com.varminer.dashboard.entity.RequirementEntity;
import com.varminer.dashboard.mapper.RequirementMapper;
import com.varminer.dashboard.model.Requirement;
import com.varminer.dashboard.repository.RequirementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final RequirementRepository requirementRepository;
    private final RequirementMapper requirementMapper;
    private final ReleaseService releaseService;
    private final MeetingService meetingService;
    private final PrioritySetService prioritySetService;

    public DashboardService(RequirementRepository requirementRepository,
                            RequirementMapper requirementMapper,
                            ReleaseService releaseService,
                            MeetingService meetingService,
                            PrioritySetService prioritySetService) {
        this.requirementRepository = requirementRepository;
        this.requirementMapper = requirementMapper;
        this.releaseService = releaseService;
        this.meetingService = meetingService;
        this.prioritySetService = prioritySetService;
    }

    /** Requirements released this month (status = Released, or release_date in current month). */
    @Transactional(readOnly = true)
    public List<Requirement> getThisMonthShipments() {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        return requirementRepository.findAllByOrderByIdAsc().stream()
                .filter(r -> "Released".equals(r.getStatus())
                        && r.getReleaseDate() != null
                        && r.getReleaseDate().getYear() == year
                        && r.getReleaseDate().getMonthValue() == month)
                .map(requirementMapper::toDto)
                .collect(Collectors.toList());
    }

    /** Next upcoming release (first with release_date >= today or planned_date). */
    @Transactional(readOnly = true)
    public Map<String, Object> getNextReleaseCountdown() {
        List<com.varminer.dashboard.dto.ReleaseDto> upcoming = releaseService.findUpcoming();
        if (upcoming.isEmpty()) return Map.of("release", null, "daysUntil", (Integer) null);
        com.varminer.dashboard.dto.ReleaseDto next = upcoming.get(0);
        LocalDate target = next.getReleaseDate() != null ? next.getReleaseDate() : next.getPlannedDate();
        int days = target != null ? (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), target) : 0;
        return Map.of("release", next, "daysUntil", target != null ? days : null);
    }

    /** Top 5 by priority (Critical/High) then stack rank, not released. */
    @Transactional(readOnly = true)
    public List<Requirement> getTop5Priorities() {
        return requirementRepository.findAllByOrderByIdAsc().stream()
                .filter(r -> !"Released".equals(r.getStatus()))
                .sorted(Comparator
                        .comparing(RequirementEntity::getPriority, (a, b) -> Integer.compare(priorityOrder(b), priorityOrder(a)))
                        .thenComparing(r -> parseIntOrMax(r.getStackRank())))
                .limit(5)
                .map(requirementMapper::toDto)
                .collect(Collectors.toList());
    }

    private static int priorityOrder(String p) {
        if (p == null) return 4;
        switch (p) {
            case "Critical": return 0;
            case "High": return 1;
            case "Medium": return 2;
            case "Low": return 3;
            default: return 4;
        }
    }

    private static int parseIntOrMax(String s) {
        if (s == null || s.isBlank()) return 999;
        try { return Integer.parseInt(s.trim()); } catch (NumberFormatException e) { return 999; }
    }

    @Transactional(readOnly = true)
    public List<MeetingActionItemDto> getOpenActionItems() {
        return meetingService.findOverdueOpenActions().stream().map(a -> {
            MeetingActionItemDto d = new MeetingActionItemDto();
            d.setId(a.getId());
            d.setActionText(a.getActionText());
            d.setOwner(a.getOwner());
            d.setDueDate(a.getDueDate());
            d.setStatus(a.getStatus());
            return d;
        }).collect(Collectors.toList());
    }
}
