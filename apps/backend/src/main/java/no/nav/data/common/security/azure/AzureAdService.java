package no.nav.data.common.security.azure;

import com.microsoft.graph.core.ClientException;
import com.microsoft.graph.http.GraphServiceException;
import com.microsoft.graph.options.QueryOption;
import com.microsoft.graph.requests.GraphServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nav.data.common.exceptions.TechnicalException;
import no.nav.data.common.exceptions.TimeoutException;
import no.nav.data.common.security.azure.support.GraphLogger;
import okhttp3.Request;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.List;

import static no.nav.data.common.security.azure.AzureConstants.MICROSOFT_GRAPH_SCOPE_APP;

@Slf4j
@Service
@RequiredArgsConstructor
public class AzureAdService {

    private final AzureTokenProvider azureTokenProvider;

    public byte[] lookupProfilePictureByNavIdent(String navIdent) {
        String userId = lookupUserIdForNavIdent(navIdent);
        return lookupUserProfilePicture(userId);
    }

    private String lookupUserIdForNavIdent(String navIdent) {
        var res = getAppGraphClient()
                .users().buildRequest(List.of(new QueryOption("$filter", "mailNickname eq '" + navIdent + "'")))
                .select("id")
                .get().getCurrentPage();
        if (res.size() != 1) {
            log.info("Did not find single user for navIdent {} ({})", navIdent, res.size());
            return null;
        }
        return res.get(0).id;
    }

    private byte[] lookupUserProfilePicture(String id) {
        try {
            var photo = getAppGraphClient()
                    .users(id)
                    .photo().content()
                    .buildRequest().get();
            return StreamUtils.copyToByteArray(photo);
        } catch (GraphServiceException e) {
            if (GraphLogger.isNotError(e)) {
                return null;
            }
            throw new TechnicalException("error with azure", e);
        } catch (IOException | ClientException e) {
            if (e.getCause() instanceof SocketTimeoutException) {
                throw new TimeoutException("Azure request timed out", e);
            }
            throw new TechnicalException("io error with azure", e);
        }
    }

    private GraphServiceClient<Request> getAppGraphClient() {
        return azureTokenProvider.getGraphClient(azureTokenProvider.getApplicationTokenForResource(MICROSOFT_GRAPH_SCOPE_APP));
    }
}
