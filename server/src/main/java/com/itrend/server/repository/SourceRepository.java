package com.itrend.server.repository;

import com.itrend.server.domain.Source;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SourceRepository extends JpaRepository<Source, Long> {

    List<Source> findByIsActiveTrue();
}
