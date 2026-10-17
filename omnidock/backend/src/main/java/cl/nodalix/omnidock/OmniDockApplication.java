package cl.nodalix.omnidock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OmniDockApplication {
    public static void main(String[] args) {
        SpringApplication.run(OmniDockApplication.class, args);
    }
}
