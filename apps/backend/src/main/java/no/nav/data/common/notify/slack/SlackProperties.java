package no.nav.data.common.notify.slack;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "client.slack")
public class SlackProperties {

    private String baseUrl;
    private String token;
}
