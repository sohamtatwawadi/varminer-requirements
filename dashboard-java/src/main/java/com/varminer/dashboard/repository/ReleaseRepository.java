package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.ReleaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface ReleaseRepository extends JpaRepository<ReleaseEntity, Long> {
    List<ReleaseEntity> findByStatusOrderByPlannedDateAsc(String status);

    @Query("SELECT r FROM ReleaseEntity r WHERE r.releaseDate IS NULL OR r.releaseDate >= :from ORDER BY r.plannedDate ASC NULLS LAST")
    List<ReleaseEntity> findUpcoming(LocalDate from);
}
