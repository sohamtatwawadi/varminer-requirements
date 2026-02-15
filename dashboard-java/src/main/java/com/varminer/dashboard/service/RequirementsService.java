package com.varminer.dashboard.service;

import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.bean.StatefulBeanToCsv;
import com.opencsv.bean.StatefulBeanToCsvBuilder;
import com.opencsv.exceptions.CsvDataTypeMismatchException;
import com.opencsv.exceptions.CsvRequiredFieldEmptyException;
import com.varminer.dashboard.model.Requirement;
import com.varminer.dashboard.model.KpiSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.stream.Collectors;

@Service
public class RequirementsService {

    private static final List<String> STATUS_ORDER = List.of(
            "Not started", "In DEV", "In UAT", "Dev completed", "Closed"
    );
    private static final Map<String, String> STATUS_ALIASES = Map.of(
            "In progress", "In DEV",
            "In Progress", "In DEV",
            "To Do", "Not started",
            "Not star...", "Not started",
            "Done", "Closed"
    );

    @Value("${varminer.requirements.csv-path:}")
    private String csvPathConfig;

    private Path csvPath;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    @PostConstruct
    public void init() {
        if (csvPathConfig != null && !csvPathConfig.isBlank()) {
            csvPath = Paths.get(csvPathConfig);
        } else {
            Path cwd = Paths.get(System.getProperty("user.dir"));
            Path inCwd = cwd.resolve("requirements.csv");
            Path inParent = cwd.getParent() != null ? cwd.getParent().resolve("requirements.csv") : inCwd;
            csvPath = Files.exists(inCwd) ? inCwd : inParent;
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "Not started";
        String s = status.strip();
        return STATUS_ALIASES.getOrDefault(s, s);
    }

    private List<Requirement> readAll() throws IOException {
        lock.readLock().lock();
        try {
            if (!Files.exists(csvPath)) {
                return new ArrayList<>();
            }
            try (Reader r = Files.newBufferedReader(csvPath)) {
                List<Requirement> list = new CsvToBeanBuilder<Requirement>(r)
                        .withType(Requirement.class)
                        .withIgnoreLeadingWhiteSpace(true)
                        .build()
                        .parse();
                list.forEach(req -> req.setStatus(normalizeStatus(req.getStatus())));
                return list;
            }
        } finally {
            lock.readLock().unlock();
        }
    }

    private void writeAll(List<Requirement> requirements) throws IOException {
        lock.writeLock().lock();
        try {
            Files.createDirectories(csvPath.getParent());
            try (Writer w = Files.newBufferedWriter(csvPath)) {
                StatefulBeanToCsv<Requirement> writer = new StatefulBeanToCsvBuilder<Requirement>(w)
                        .withApplyQuotesToAll(false)
                        .build();
                try {
                    writer.write(requirements);
                } catch (CsvDataTypeMismatchException | CsvRequiredFieldEmptyException e) {
                    throw new RuntimeException("Failed to write CSV", e);
                }
            }
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<Requirement> getAll() {
        try {
            return readAll();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read requirements", e);
        }
    }

    public KpiSummary getKpiSummary() {
        List<Requirement> all = getAll();
        int total = all.size();
        Map<String, Long> countByStatus = all.stream()
                .collect(Collectors.groupingBy(r -> r.getStatus() == null ? "Not started" : r.getStatus(), Collectors.counting()));
        int notStarted = countByStatus.getOrDefault("Not started", 0L).intValue();
        int inDev = countByStatus.getOrDefault("In DEV", 0L).intValue();
        int inUat = countByStatus.getOrDefault("In UAT", 0L).intValue();
        int devCompleted = countByStatus.getOrDefault("Dev completed", 0L).intValue();
        int closed = countByStatus.getOrDefault("Closed", 0L).intValue();
        Map<String, Integer> byStatus = new LinkedHashMap<>();
        for (String s : STATUS_ORDER) {
            byStatus.put(s, countByStatus.getOrDefault(s, 0L).intValue());
        }
        return new KpiSummary(total, notStarted, inDev, inUat, devCompleted, closed, byStatus);
    }

    public Requirement add(Requirement req) {
        if (req.getStatus() == null || req.getStatus().isBlank()) {
            req.setStatus("Not started");
        } else {
            req.setStatus(normalizeStatus(req.getStatus()));
        }
        if (req.getId() == null || req.getId().isBlank()) {
            req.setId(generateNextId());
        }
        List<Requirement> all = getAll();
        all.add(req);
        try {
            writeAll(all);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save requirement", e);
        }
        return req;
    }

    private String generateNextId() {
        List<Requirement> all = getAll();
        int max = 0;
        for (Requirement r : all) {
            String id = r.getId();
            if (id != null && id.startsWith("VR-")) {
                try {
                    int n = Integer.parseInt(id.substring(3).trim());
                    if (n > max) max = n;
                } catch (NumberFormatException ignored) {}
            }
        }
        return "VR-" + String.format("%03d", max + 1);
    }

    public Optional<Requirement> update(String id, Requirement update) {
        List<Requirement> all = getAll();
        for (int i = 0; i < all.size(); i++) {
            if (id.equals(all.get(i).getId())) {
                Requirement existing = all.get(i);
                if (update.getStatus() != null) existing.setStatus(normalizeStatus(update.getStatus()));
                if (update.getRequirement() != null) existing.setRequirement(update.getRequirement());
                if (update.getDescription() != null) existing.setDescription(update.getDescription());
                if (update.getAcceptanceCriteria() != null) existing.setAcceptanceCriteria(update.getAcceptanceCriteria());
                if (update.getClear() != null) existing.setClear(update.getClear());
                if (update.getEstimate() != null) existing.setEstimate(update.getEstimate());
                if (update.getDependency() != null) existing.setDependency(update.getDependency());
                if (update.getPriority() != null) existing.setPriority(update.getPriority());
                if (update.getStackRank() != null) existing.setStackRank(update.getStackRank());
                if (update.getStartSprint() != null) existing.setStartSprint(update.getStartSprint());
                if (update.getTargetSprint() != null) existing.setTargetSprint(update.getTargetSprint());
                if (update.getRelease() != null) existing.setRelease(update.getRelease());
                if (update.getRequesteeDept() != null) existing.setRequesteeDept(update.getRequesteeDept());
                if (update.getRequestedBy() != null) existing.setRequestedBy(update.getRequestedBy());
                if (update.getAssignee() != null) existing.setAssignee(update.getAssignee());
                if (update.getComments() != null) existing.setComments(update.getComments());
                try {
                    writeAll(all);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to update requirement", e);
                }
                return Optional.of(existing);
            }
        }
        return Optional.empty();
    }

    /**
     * Delete a requirement by ID. Returns true if found and removed.
     */
    public boolean delete(String id) {
        List<Requirement> all = getAll();
        boolean removed = all.removeIf(r -> id.equals(r.getId()));
        if (removed) {
            try {
                writeAll(all);
            } catch (IOException e) {
                throw new RuntimeException("Failed to delete requirement", e);
            }
        }
        return removed;
    }

    /**
     * Replace all requirements with rows parsed from the given CSV input.
     * Uses same column mapping as our CSV (ID, Category, Type, Requirement, etc.).
     * Normalizes status (e.g. "In Progress" -> "In DEV").
     * @return number of requirements imported
     */
    public int importFromCsv(InputStream csvInput) throws IOException {
        try (Reader r = new InputStreamReader(csvInput, StandardCharsets.UTF_8)) {
            List<Requirement> list = new CsvToBeanBuilder<Requirement>(r)
                    .withType(Requirement.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();
            list.forEach(req -> req.setStatus(normalizeStatus(req.getStatus())));
            writeAll(list);
            return list.size();
        }
    }
}
