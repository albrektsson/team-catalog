package no.nav.data.team.graph;

import no.nav.data.team.graph.dto.Edge;
import no.nav.data.team.graph.dto.EdgeLabel;
import no.nav.data.team.graph.dto.EdgeProps;
import no.nav.data.team.graph.dto.Network;
import no.nav.data.team.graph.dto.Network.NetworkBuilder;
import no.nav.data.team.graph.dto.Vertex;
import no.nav.data.team.graph.dto.VertexLabel;
import no.nav.data.team.graph.dto.props.MemberProps;
import no.nav.data.team.graph.dto.props.ProductAreaProps;
import no.nav.data.team.graph.dto.props.ClusterProps;
import no.nav.data.team.graph.dto.props.TeamProps;
import no.nav.data.team.po.domain.PaMember;
import no.nav.data.team.po.domain.ProductArea;
import no.nav.data.team.cluster.domain.ClusterMember;
import no.nav.data.team.cluster.domain.Cluster;
import no.nav.data.team.team.domain.Team;
import no.nav.data.team.team.domain.TeamMember;

import java.time.LocalDateTime;

import static no.nav.data.common.utils.StreamUtils.copyOf;

public class GraphMapper {

    public Network mapCluster(Cluster cluster) {
        Vertex clusterVertex = Vertex.builder()
                .id(cluster.getId().toString())
                .label(VertexLabel.Cluster)
                .properties(ClusterProps.builder()
                        .name(cluster.getName())
                        .description(cluster.getDescription())
                        .slackChannel(cluster.getSlackChannel())
                        .tags(copyOf(cluster.getTags()))
                        .lastChanged(cluster.getChangeStamp() == null ? LocalDateTime.now() : cluster.getChangeStamp().getLastModifiedDate())
                        .build())
                .build();

        NetworkBuilder network = Network.builder().vertex(clusterVertex);

        cluster.getMembers().forEach(m -> {
            Network memberNetwork = map(clusterVertex, m);
            network.vertices(memberNetwork.getVertices());
            network.edges(memberNetwork.getEdges());
        });

        if (cluster.getProductAreaId() != null) {
            String paVertexId = VertexLabel.ProductArea.id(cluster.getProductAreaId());
            network
                    .edge(Edge.builder()
                            .inV(clusterVertex.getId())
                            .label(EdgeLabel.clusterHasTeam)
                            .outV(paVertexId)
                            .build())
                    .edge(Edge.builder()
                            .inV(paVertexId)
                            .label(EdgeLabel.clusterHasTeam.reverse())
                            .outV(clusterVertex.getId())
                            .build());
        }

        Network build = network.build();
        build.cleanDuplicatesAndValidate();
        return build;
    }
    public Network mapTeam(Team team) {
        Vertex teamVertex = Vertex.builder()
                .id(team.getId().toString())
                .label(VertexLabel.Team)
                .properties(TeamProps.builder()
                        .name(team.getName())
                        .description(team.getDescription())
                        .teamOwnershipType(team.getTeamOwnershipType())
                        .slackChannel(team.getSlackChannel())
                        .naisTeams(copyOf(team.getNaisTeams()))
                        .tags(copyOf(team.getTags()))
                        .lastChanged(team.getChangeStamp() == null ? LocalDateTime.now() : team.getChangeStamp().getLastModifiedDate())
                        .build())
                .build();

        NetworkBuilder network = Network.builder().vertex(teamVertex);

        team.getMembers().forEach(m -> {
            Network memberNetwork = map(teamVertex, m);
            network.vertices(memberNetwork.getVertices());
            network.edges(memberNetwork.getEdges());
        });

        if (team.getProductAreaId() != null) {
            String paVertexId = VertexLabel.ProductArea.id(team.getProductAreaId());
            network
                    .edge(Edge.builder()
                            .inV(teamVertex.getId())
                            .label(EdgeLabel.hasTeam)
                            .outV(paVertexId)
                            .build())
                    .edge(Edge.builder()
                            .inV(paVertexId)
                            .label(EdgeLabel.hasTeam.reverse())
                            .outV(teamVertex.getId())
                            .build());
        }

        Network build = network.build();
        build.cleanDuplicatesAndValidate();
        return build;
    }

    public Network mapProductArea(ProductArea pa) {
        Vertex paVertex = Vertex.builder()
                .id(pa.getId().toString())
                .label(VertexLabel.ProductArea)
                .properties(ProductAreaProps.builder()
                        .description(pa.getDescription())
                        .name(pa.getName())
                        .tags(pa.getTags())
                        .lastChanged(pa.getChangeStamp() == null ? LocalDateTime.now() : pa.getChangeStamp().getLastModifiedDate())
                        .build())
                .build();

        NetworkBuilder network = Network.builder().vertex(paVertex);

        pa.getMembers().forEach(m -> {
            Network memberNetwork = map(paVertex, m);
            network.vertices(memberNetwork.getVertices());
            network.edges(memberNetwork.getEdges());
        });

        return network.build();
    }

    private Network map(Vertex cluster, ClusterMember m) {
        MemberProps memberProps = MemberProps.builder()
                .description(m.getDescription())
                .roles(copyOf(m.getRoles()))
                .build();
        return map(cluster, m.getNavIdent(), memberProps, EdgeLabel.memberOfCluster);
    }

    private Network map(Vertex team, TeamMember m) {
        MemberProps memberProps = MemberProps.builder()
                .description(m.getDescription())
                .roles(copyOf(m.getRoles()))
                .build();
        return map(team, m.getNavIdent(), memberProps, EdgeLabel.memberOfTeam);
    }

    private Network map(Vertex pa, PaMember m) {
        MemberProps memberProps = MemberProps.builder()
                .description(m.getDescription())
                .roles(copyOf(m.getRoles()))
                .build();
        return map(pa, m.getNavIdent(), memberProps, EdgeLabel.memberOfProductArea);
    }

    private Network map(Vertex parent, String navIdent, EdgeProps edgeProps, EdgeLabel edgeLabel) {
        var resourceVertexId = VertexLabel.Person.id(navIdent);
        // skip writing the resource node, graph should populate it already and if it doesn't exist it shouldn't fail our write

        return Network.builder()
                .edge(Edge.builder()
                        .inV(resourceVertexId)
                        .label(edgeLabel.reverse())
                        .outV(parent.getId())
                        .properties(edgeProps)
                        .build())
                .edge(Edge.builder()
                        .inV(parent.getId())
                        .label(edgeLabel)
                        .outV(resourceVertexId)
                        .properties(edgeProps)
                        .build())
                .build();
    }
}
