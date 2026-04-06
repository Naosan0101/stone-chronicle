package com.example.demo;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example")
@MapperScan("com.example.stonechronicle.repository")
public class StoneChronicleApplication {

	public static void main(String[] args) {
		SpringApplication.run(StoneChronicleApplication.class, args);
	}

}
