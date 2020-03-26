package no.nav.data.team.common.security.dto;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import no.nav.data.team.common.security.Encryptor;
import no.nav.data.team.common.utils.JsonUtils;
import org.springframework.util.Assert;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.util.UriComponentsBuilder;

import static org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames.ERROR;
import static org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames.ERROR_DESCRIPTION;
import static org.springframework.security.web.util.UrlUtils.isValidRedirectUrl;

/**
 * Encrypted json to ensure origin of state and code
 */
@Data
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class OAuthState {

    private String redirectUri;
    private String errorUri;

    public OAuthState(String redirectUri) {
        this(redirectUri, null);
    }

    public OAuthState(String redirectUri, String errorUri) {
        this.redirectUri = redirectUri;
        this.errorUri = errorUri != null ? errorUri : redirectUri;
        validate();
    }

    public String errorRedirect(String error, String errorDesc) {
        return UriComponentsBuilder.fromUriString(getErrorUri())
                .queryParam(ERROR, HtmlUtils.htmlEscape(error))
                .queryParam(ERROR_DESCRIPTION, HtmlUtils.htmlEscape(errorDesc))
                .build().toUriString();
    }

    public static OAuthState fromJson(String encryptedJson, Encryptor encryptor) {
        var json = encryptor.decrypt(encryptedJson);
        OAuthState state = JsonUtils.toObject(json, OAuthState.class);
        state.validate();
        return state;
    }

    public String toJson(Encryptor encryptor) {
        String json = JsonUtils.toJson(this);
        return encryptor.encrypt(json);
    }

    private void validate() {
        Assert.isTrue(isValidRedirectUrl(redirectUri), "Invalid redirectUri");
        Assert.isTrue(isValidRedirectUrl(errorUri), "Invalid errorUri");
    }
}
