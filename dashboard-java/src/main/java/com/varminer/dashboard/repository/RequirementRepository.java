package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.RequirementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface RequirementRepository extends JpaRepository<RequirementEntity, Long> {
    Optional<RequirementEntity> findByExternalId(String externalId);
    boolean existsByExternalId(String externalId);

    List<RequirementEntity> findAllByOrderByIdAsc();

    @Query("SELECT r.status, COUNT(r) FROM RequirementEntity r GROUP BY r.status")
    List<Object[]> countByStatus();
}
