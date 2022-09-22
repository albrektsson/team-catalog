import dotenv from 'dotenv';

dotenv.config({
    path: process.env.NODE_ENV !== 'production' ? './.localenv' : './.env'
});

function requireEnv(envName) {
    const envContent = process.env[envName];
    if (!envContent) throw new Error("Missing environment variable with name: " + envName);
    return envContent;
}

function requireEnvAsJson(envName){
    try {
        return JSON.parse(requireEnv(envName))
    } catch (error) {
        const msg = "Environment variable with name: " + envName + " is not valid json";
        console.error(msg)
        throw error;
    }
}

function requireEnvWithValidation(envName, validation){
    const envContent = requireEnv(envName)
    validation(envContent)
    return envContent
}

const clientId = requireEnv("AZURE_APP_CLIENT_ID")
const defaultBaseURL = requireEnvWithValidation("DEFAULT_BASE_URL",(envContent) => {
    if(envContent.endsWith("/")) throw "default base url cannot have suffix '/'"
    const okPrefix = (envContent.startsWith("https://") || envContent.startsWith("http://localhost"))
    if(!okPrefix) throw "default base url must have prefix 'https://' or 'http://localhost'"
})

const betaBaseUrl = function DO(){
    const firstDotOrEnd = defaultBaseURL.indexOf(".") || defaultBaseURL.length();
    return defaultBaseURL.substring(0,firstDotOrEnd) + "-beta" + defaultBaseURL.substring(firstDotOrEnd)
}()

const azureAd = {
    clientId: clientId,
    jwk: requireEnvAsJson("AZURE_APP_JWK"),
    issuer: requireEnv("AZURE_OPENID_CONFIG_ISSUER"),
    tokenEndpoint: requireEnv("AZURE_OPENID_CONFIG_TOKEN_ENDPOINT"),
    wellKnown: requireEnv("AZURE_APP_WELL_KNOWN_URL"),
    redirectUrl: [defaultBaseURL, betaBaseUrl].map(it => it + "/login/aad/callback"),
    clientSecret: requireEnv("AZURE_APP_CLIENT_SECRET"),
    responseTypes: ['code'],
    responseMode: 'query',
    scopes: ['openid', 'profile', 'email', 'offline_access', clientId+'/.default'].join(" ")
}

const proxy = {
    nomApiScope: requireEnv("NOM_API_SCOPE"),
    nomApiUrl: requireEnv("NOM_API_URL"),
    teamCatScope: requireEnv("TEAM_CATALOG_SCOPE"),
    teamCatBackendUrl: requireEnv("TEAM_CATALOG_BACKEND_URL"),
}

const app = {
    isProd: !(proxy.teamCatScope.includes("api://dev") && proxy.nomApiScope.includes("api://dev")),
    defaultBaseUrl: defaultBaseURL,
    isLocal: defaultBaseURL.startsWith("http://localhost")
}

export default {azureAd, proxy, app};