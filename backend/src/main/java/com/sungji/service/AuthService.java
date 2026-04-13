package com.sungji.service;

import com.sungji.config.JwtUtil;
import com.sungji.controller.dto.AuthResponse;
import com.sungji.controller.dto.LoginRequest;
import com.sungji.controller.dto.RegisterRequest;
import com.sungji.entity.User;
import com.sungji.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다: " + req.getUsername());
        }
        User user = userRepository.save(User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .deviceToken(req.getDeviceToken())
                .role(User.Role.USER)
                .build());
        return AuthResponse.of(user, jwtUtil.generateToken(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다");
        }
        // deviceToken 갱신
        if (req.getDeviceToken() != null) {
            user.setDeviceToken(req.getDeviceToken());
        }
        return AuthResponse.of(user, jwtUtil.generateToken(user));
    }
}
