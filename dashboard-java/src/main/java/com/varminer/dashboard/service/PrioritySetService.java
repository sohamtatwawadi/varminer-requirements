package com.varminer.dashboard.service;

import com.varminer.dashboard.dto.PrioritySetDto;
import com.varminer.dashboard.dto.PrioritySetItemDto;
import com.varminer.dashboard.entity.PrioritySetEntity;
import com.varminer.dashboard.entity.PrioritySetItemEntity;
import com.varminer.dashboard.entity.RequirementEntity;
import com.varminer.dashboard.mapper.RequirementMapper;
import com.varminer.dashboard.model.Requirement;
import com.varminer.dashboard.repository.PrioritySetItemRepository;
import com.varminer.dashboard.repository.PrioritySetRepository;
import com.varminer.dashboard.repository.RequirementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PrioritySetService {

    private final PrioritySetRepository prioritySetRepository;
    private final PrioritySetItemRepository prioritySetItemRepository;
    private final RequirementRepository requirementRepository;
    private final RequirementMapper requirementMapper;

    public PrioritySetService(PrioritySetRepository prioritySetRepository,
                              PrioritySetItemRepository prioritySetItemRepository,
                              RequirementRepository requirementRepository,
                              RequirementMapper requirementMapper) {
        this.prioritySetRepository = prioritySetRepository;
        this.prioritySetItemRepository = prioritySetItemRepository;
        this.requirementRepository = requirementRepository;
        this.requirementMapper = requirementMapper;
    }

    @Transactional(readOnly = true)
    public List<PrioritySetDto> findAll() {
        return prioritySetRepository.findByOrderByUpdatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrioritySetDto> findByTimeframe(String timeframe) {
        if (timeframe == null || timeframe.isBlank()) return findAll();
        return prioritySetRepository.findByTimeframeOrderByStartDateDesc(timeframe).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<PrioritySetDto> findById(Long id) {
        return prioritySetRepository.findById(id).map(this::toDto);
    }

    @Transactional
    public PrioritySetDto create(PrioritySetDto dto) {
        PrioritySetEntity e = new PrioritySetEntity();
        e.setName(dto.getName());
        e.setTimeframe(dto.getTimeframe() != null ? dto.getTimeframe() : "custom");
        e.setStartDate(dto.getStartDate());
        e.setEndDate(dto.getEndDate());
        final PrioritySetEntity saved = prioritySetRepository.save(e);
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (int i = 0; i < dto.getItems().size(); i++) {
                final int order = i;
                PrioritySetItemDto it = dto.getItems().get(i);
                requirementRepository.findByExternalId(it.getRequirementId() != null ? it.getRequirementId().trim() : "").ifPresent(req -> {
                    PrioritySetItemEntity item = new PrioritySetItemEntity();
                    item.setPrioritySet(saved);
                    item.setRequirement(req);
                    item.setSortOrder(it.getSortOrder() != null ? it.getSortOrder() : order);
                    saved.getItems().add(item);
                });
            }
            prioritySetRepository.save(saved);
        }
        return toDto(prioritySetRepository.findById(saved.getId()).orElse(saved));
    }

    @Transactional
    public Optional<PrioritySetDto> update(Long id, PrioritySetDto dto) {
        return prioritySetRepository.findById(id).map(e -> {
            e.setName(dto.getName());
            e.setTimeframe(dto.getTimeframe() != null ? dto.getTimeframe() : e.getTimeframe());
            e.setStartDate(dto.getStartDate());
            e.setEndDate(dto.getEndDate());
            PrioritySetEntity saved = prioritySetRepository.save(e);
            saved.getItems().clear();
            prioritySetRepository.save(saved);
            if (dto.getItems() != null) {
                for (int i = 0; i < dto.getItems().size(); i++) {
                    final int order = i;
                    PrioritySetItemDto it = dto.getItems().get(i);
                    String extId = it.getRequirementId() != null ? it.getRequirementId().trim() : null;
                    if (extId == null || extId.isEmpty()) continue;
                    requirementRepository.findByExternalId(extId).ifPresent(req -> {
                        PrioritySetItemEntity item = new PrioritySetItemEntity();
                        item.setPrioritySet(saved);
                        item.setRequirement(req);
                        item.setSortOrder(it.getSortOrder() != null ? it.getSortOrder() : order);
                        saved.getItems().add(item);
                    });
                }
                prioritySetRepository.save(saved);
            }
            return toDto(prioritySetRepository.findById(saved.getId()).orElse(saved));
        });
    }

    @Transactional
    public boolean delete(Long id) {
        if (!prioritySetRepository.existsById(id)) return false;
        prioritySetRepository.deleteById(id);
        return true;
    }

    private PrioritySetDto toDto(PrioritySetEntity e) {
        PrioritySetDto dto = new PrioritySetDto();
        dto.setId(e.getId());
        dto.setName(e.getName());
        dto.setTimeframe(e.getTimeframe());
        dto.setStartDate(e.getStartDate());
        dto.setEndDate(e.getEndDate());
        dto.setItems(e.getItems().stream().map(item -> {
            PrioritySetItemDto idto = new PrioritySetItemDto();
            idto.setId(item.getId());
            idto.setRequirementId(item.getRequirement().getExternalId());
            idto.setSortOrder(item.getSortOrder());
            idto.setRequirement(requirementMapper.toDto(item.getRequirement()));
            return idto;
        }).collect(Collectors.toList()));
        return dto;
    }
}
