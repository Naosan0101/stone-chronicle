package com.example.demo;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example")
@MapperScan("com.example.nineuniverse.repository")
public class NineUniverseApplication {

	public static void main(String[] args) {
		SpringApplication.run(NineUniverseApplication.class, args);
	}

}
