package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/** Cliente HTTP hacia el simulador IoT (POST /api/mock-iot/comando). Timeout 2 s (RNF rendimiento). */
@Component
public class IotClient {

    private final RestClient http;
    private final String apiKey;

    public IotClient(@Value("${omnidock.iot.base-url}") String baseUrl,
                     @Value("${omnidock.iot.api-key}") String apiKey,
                     @Value("${omnidock.iot.timeout-ms}") int timeoutMs) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(timeoutMs);
        f.setReadTimeout(timeoutMs);
        this.http = RestClient.builder().baseUrl(baseUrl).requestFactory(f).build();
        this.apiKey = apiKey;
    }

    public void enviarComando(String direccionMac, String comando) {
        Map<String, Object> res;
        try {
            res = http.post().uri("/api/mock-iot/comando")
                    .header("X-IOT-KEY", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("direccionMac", direccionMac, "comando", comando))
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo comunicar con el dispositivo IoT");
        }
        if (res == null || !"EJECUTADO".equals(res.get("status"))) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "El dispositivo IoT no confirmó el comando");
        }
    }
}
