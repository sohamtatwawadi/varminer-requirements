package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.PrioritySetItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface PrioritySetItemRepository extends JpaRepository<PrioritySetItemEntity, Long> {
    List<PrioritySetItemEntity> findByPrioritySetIdOrderBySortOrderAsc(Long prioritySetId);
    void deleteByPrioritySetId(Long prioritySetId);

    @Query("SELECT r.externalId FROM PrioritySetItemEntity i JOIN i.requirement r WHERE i.requirement IS NOT NULL")
    List<String> findRequirementExternalIdsInAnyPrioritySet();
}
