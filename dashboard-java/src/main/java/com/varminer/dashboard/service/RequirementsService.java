package com.varminer.dashboard.service;

import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.bean.StatefulBeanToCsv;
import com.opencsv.bean.StatefulBeanToCsvBuilder;
import com.opencsv.exceptions.CsvDataTypeMismatchException;
import com.opencsv.exceptions.CsvRequiredFieldEmptyException;
import com.varminer.dashboard.entity.RequirementEntity;
import com.varminer.dashboard.mapper.RequirementMapper;
import com.varminer.dashboard.model.KpiSummary;
import com.varminer.dashboard.model.Requirement;
import com.varminer.dashboard.repository.RequirementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RequirementsService {

    private static final List<String> STATUS_ORDER = List.of(
            "Not Started", "In Dev", "Dev Completed", "In QA", "QA Completed",
            "In UAT", "Production Ready", "Released"
    );
    private static final Map<String, String> STATUS_ALIASES = Map.ofEntries(
            Map.entry("Not started", "Not Started"),
            Map.entry("In DEV", "In Dev"),
            Map.entry("In Dev", "In Dev"),
            Map.entry("Dev completed", "Dev Completed"),
            Map.entry("In UAT", "In UAT"),
            Map.entry("Closed", "Released"),
            Map.entry("In progress", "In Dev"),
            Map.entry("In Progress", "In Dev"),
            Map.entry("To Do", "Not Started"),
            Map.entry("Done", "Released")
    );

    private final RequirementRepository requirementRepository;
    private final RequirementMapper mapper;

    public RequirementsService(RequirementRepository requirementRepository, RequirementMapper mapper) {
        this.requirementRepository = requirementRepository;
        this.mapper = mapper;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "Not Started";
        return STATUS_ALIASES.getOrDefault(status.strip(), status.strip());
    }

    @Transactional(readOnly = true)
    public List<Requirement> getAll() {
        return requirementRepository.findAllByOrderByIdAsc().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Requirement> getByQ1Release() {
        List<RequirementEntity> all = requirementRepository.findAllByOrderByIdAsc();
        return all.stream()
                .filter(r -> r.getReleaseText() != null && r.getReleaseText().toLowerCase().contains("q1"))
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public String toCsv(List<Requirement> list) {
        try (StringWriter sw = new StringWriter()) {
            StatefulBeanToCsv<Requirement> writer = new StatefulBeanToCsvBuilder<Requirement>(sw)
                    .withApplyQuotesToAll(false)
                    .build();
            writer.write(list);
            return sw.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export CSV", e);
        }
    }

    @Transactional(readOnly = true)
    public KpiSummary getKpiSummary() {
        List<Object[]> counts = requirementRepository.countByStatus();
        Map<String, Long> countByStatus = new HashMap<>();
        for (Object[] row : counts) {
            countByStatus.put((String) row[0], (Long) row[1]);
        }
        int total = countByStatus.values().stream().mapToInt(Long::intValue).sum();
        Map<String, Integer> byStatus = new LinkedHashMap<>();
        for (String s : STATUS_ORDER) {
            byStatus.put(s, countByStatus.getOrDefault(s, 0L).intValue());
        }
        return new KpiSummary(total, byStatus);
    }

    @Transactional
    public Requirement add(Requirement req) {
        String status = (req.getStatus() == null || req.getStatus().isBlank()) ? "Not Started" : normalizeStatus(req.getStatus());
        req.setStatus(status);
        String externalId = (req.getId() != null && !req.getId().isBlank()) ? req.getId().trim() : generateNextId();
        req.setId(externalId);
        RequirementEntity e = mapper.toEntity(req);
        e.setExternalId(externalId);
        e.setStatus(status);
        e = requirementRepository.save(e);
        return mapper.toDto(e);
    }

    private String generateNextId() {
        List<RequirementEntity> all = requirementRepository.findAllByOrderByIdAsc();
        int max = 0;
        for (RequirementEntity r : all) {
            String id = r.getExternalId();
            if (id != null && id.startsWith("VR-")) {
                try {
                    int n = Integer.parseInt(id.substring(3).trim());
                    if (n > max) max = n;
                } catch (NumberFormatException ignored) {}
            }
        }
        return "VR-" + String.format("%03d", max + 1);
    }

    @Transactional
    public Optional<Requirement> update(String id, Requirement update) {
        return requirementRepository.findByExternalId(id)
                .map(existing -> {
                    if (update.getStatus() != null) existing.setStatus(normalizeStatus(update.getStatus()));
                    mapper.updateEntityFromDto(update, existing);
                    existing = requirementRepository.save(existing);
                    return mapper.toDto(existing);
                });
    }

    @Transactional
    public boolean delete(String id) {
        return requirementRepository.findByExternalId(id)
                .map(e -> {
                    requirementRepository.delete(e);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Replace all requirements with rows parsed from the given CSV input.
     * Admin-only; use when VARMINER_IMPORT_ENABLED=true.
     */
    @Transactional
    public int importFromCsv(InputStream csvInput) throws IOException {
        try (InputStreamReader r = new InputStreamReader(csvInput, StandardCharsets.UTF_8)) {
            List<Requirement> list = new CsvToBeanBuilder<Requirement>(r)
                    .withType(Requirement.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();
            list.forEach(req -> req.setStatus(normalizeStatus(req.getStatus())));
            requirementRepository.deleteAll();
            for (Requirement dto : list) {
                String extId = (dto.getId() != null && !dto.getId().isBlank()) ? dto.getId().trim() : generateNextId();
                dto.setId(extId);
                RequirementEntity e = mapper.toEntity(dto);
                e.setExternalId(extId);
                e.setStatus(dto.getStatus());
                requirementRepository.save(e);
            }
            return list.size();
        }
    }

    /** Roadmap: requirements grouped by release_month for the given quarter (e.g. Q1 2026 -> 2026-01, 2026-02, 2026-03). */
    @Transactional(readOnly = true)
    public Map<String, List<Requirement>> getRoadmapByMonth(String quarter, int year) {
        int startMonth = 1, endMonth = 3;
        if ("Q2".equalsIgnoreCase(quarter)) { startMonth = 4; endMonth = 6; }
        else if ("Q3".equalsIgnoreCase(quarter)) { startMonth = 7; endMonth = 9; }
        else if ("Q4".equalsIgnoreCase(quarter)) { startMonth = 10; endMonth = 12; }
        Map<String, List<Requirement>> byMonth = new LinkedHashMap<>();
        for (int m = startMonth; m <= endMonth; m++) {
            byMonth.put(String.format("%d-%02d", year, m), new ArrayList<>());
        }
        List<RequirementEntity> all = requirementRepository.findAllByOrderByIdAsc();
        for (RequirementEntity e : all) {
            String month = e.getReleaseMonth();
            if (month != null && month.matches("\\d{4}-\\d{2}")) {
                String[] parts = month.split("-");
                int y = Integer.parseInt(parts[0]);
                int mo = Integer.parseInt(parts[1]);
                if (y == year && mo >= startMonth && mo <= endMonth) {
                    byMonth.get(month).add(mapper.toDto(e));
                }
            } else if (e.getReleaseText() != null && e.getReleaseText().toLowerCase().contains(quarter.toLowerCase())) {
                String firstMonth = String.format("%d-%02d", year, startMonth);
                byMonth.get(firstMonth).add(mapper.toDto(e));
            }
        }
        return byMonth;
    }
}
