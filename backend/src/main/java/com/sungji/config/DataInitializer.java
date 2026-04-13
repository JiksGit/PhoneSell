package com.sungji.config;

import com.sungji.entity.User;
import com.sungji.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // 관리자 계정이 없으면 자동 생성
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("1234"))
                    .role(User.Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("[초기화] 관리자 계정 생성 완료 - username=admin / password=1234");
        } else {
            log.info("[초기화] 관리자 계정이 이미 존재합니다");
        }
    }
}
