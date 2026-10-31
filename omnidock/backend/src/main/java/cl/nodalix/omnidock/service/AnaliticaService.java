package cl.nodalix.omnidock.service;

import cl.nodalix.omnidock.dto.Dtos.EmbedTokenResponse;
import cl.nodalix.omnidock.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.Map;

/**
 * RF-11. Dos modos (omnidock.powerbi.modo):
 *  - publicado: devuelve la URL ya publicada para un iframe (rápido para la demo).
 *  - embedded : service principal de Azure AD -> GenerateToken de la API REST de Power BI.
 * Queda como opción. La cuenta del instituto no permite publicar ni embeber el informe,
 * así que el panel muestra sus propios gráficos (ResumenAnaliticaService) y este informe solo aparece si se configura.
 */
@Service
public class AnaliticaService {

    private final RestClient rest = RestClient.create();

    @Value("${omnidock.powerbi.modo}") private String modo;
    @Value("${omnidock.powerbi.embed-url}") private String embedUrl;
    @Value("${omnidock.powerbi.tenant-id}") private String tenantId;
    @Value("${omnidock.powerbi.client-id}") private String clientId;
    @Value("${omnidock.powerbi.client-secret}") private String clientSecret;
    @Value("${omnidock.powerbi.workspace-id}") private String workspaceId;
    @Value("${omnidock.powerbi.report-id}") private String reportId;

    public EmbedTokenResponse embedToken() {
        if (!"embedded".equalsIgnoreCase(modo)) {
            if (embedUrl == null || embedUrl.isBlank())
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Power BI no configurado (PBI_EMBED_URL)");
            return new EmbedTokenResponse(null, null, reportId.isBlank() ? null : reportId, embedUrl);
        }
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "client_credentials");
            form.add("client_id", clientId);
            form.add("client_secret", clientSecret);
            form.add("scope", "https://analysis.windows.net/powerbi/api/.default");
            JsonNode aad = rest.post()
                    .uri("https://login.microsoftonline.com/{t}/oauth2/v2.0/token", tenantId)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form).retrieve().body(JsonNode.class);

            JsonNode tok = rest.post()
                    .uri("https://api.powerbi.com/v1.0/myorg/groups/{g}/reports/{r}/GenerateToken", workspaceId, reportId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + aad.get("access_token").asText())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("accessLevel", "View")).retrieve().body(JsonNode.class);

            return new EmbedTokenResponse(tok.get("token").asText(), Instant.parse(tok.get("expiration").asText()), reportId,
                    "https://app.powerbi.com/reportEmbed?reportId=" + reportId + "&groupId=" + workspaceId);
        } catch (RestClientException | NullPointerException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo generar el token de Power BI");
        }
    }
}
