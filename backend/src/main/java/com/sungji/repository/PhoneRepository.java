package com.sungji.repository;

import com.sungji.entity.Phone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhoneRepository extends JpaRepository<Phone, Long> {

    List<Phone> findByModelNameContainingIgnoreCase(String keyword);

    Optional<Phone> findByModelNameAndBrand(String modelName, String brand);
}
