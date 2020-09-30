package no.nav.data.common.notify.slack.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import lombok.Value;
import no.nav.data.common.utils.JsonUtils;

import java.util.List;

public class SlackDtos {

    @Value
    public static class PostMessageRequest {

        String channel;
        List<Block> blocks;

        @Value
        public static class Block {

            public static Block header(String text) {
                return new Block(BlockType.header, Text.plain(text));
            }

            public static Block text(String text) {
                return new Block(BlockType.section, Text.markdown(text));
            }

            public static Block divider() {
                return new Block(BlockType.divider, null);
            }

            public enum BlockType {
                header, section, divider
            }

            BlockType type;
            @JsonInclude(Include.NON_NULL)
            Text text;

            @Value
            public static class Text {

                enum TextType {mrkdwn, plain_text}

                TextType type;
                String text;

                public static Text plain(String text) {
                    return new Text(TextType.plain_text, text);
                }

                public static Text markdown(String text) {
                    return new Text(TextType.mrkdwn, text);

                }
            }
        }
    }

    @Data
    public static class PostMessageResponse implements Response {

        private boolean ok;
        private Double ts;
        private String error;
        @JsonProperty("response_metadata")
        private JsonNode responseMetadata;

        @Override
        public String getError() {
            return error + "\n" + JsonUtils.toJson(responseMetadata);
        }

    }

    @Value
    public static class CreateConversationRequest {

        List<String> users;

        public CreateConversationRequest(String userId) {
            this.users = List.of(userId);
        }
    }

    @Data
    public static class CreateConversationResponse implements Response {

        private boolean ok;
        private String error;
        private Channel channel;

        @Data
        public static class Channel {

            String id;
        }
    }

    @Data
    public static class UserResponse implements Response {

        boolean ok;
        String error;
        User user;

        @Data
        public static class User {

            String id;

        }
    }

    public interface Response {

        boolean isOk();

        String getError();

    }

}
