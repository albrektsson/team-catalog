import { css } from "@emotion/css";
import { EnvelopeClosedFillIcon, PencilFillIcon, PersonRectangleIcon, TableIcon } from "@navikt/aksel-icons";
import { Button, Heading, Link } from "@navikt/ds-react";
import sortBy from "lodash/sortBy";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useParams } from "react-router-dom";

import { getSlackUserByEmail } from "../../api/ContactAddressApi";
import { getProcessesForTeam } from "../../api/integrationApi";
import { NotificationType } from "../../api/notificationApi";
import { getProductArea } from "../../api/productAreaApi";
import { editTeam, getTeam, mapProductTeamToFormValue } from "../../api/teamApi";
import { DescriptionSection } from "../../components/common/DescriptionSection";
import { MemberExportForTeam } from "../../components/common/MemberExport";
import { Members } from "../../components/common/Members";
import { MembersTable } from "../../components/common/MembersTable";
import { ResourceInfoLayout } from "../../components/common/ResourceInfoContainer";
import { LargeDivider } from "../../components/Divider";
import { LastModifiedBy } from "../../components/LastModifiedBy";
import { Markdown } from "../../components/Markdown";
import { MemberHeaderWithActions } from "../../components/MemberHeaderWithActions";
import { PageHeader } from "../../components/PageHeader";
import { SubscribeToUpdates } from "../../components/SubscribeToUpdates";
import { EditMembersModal2 } from "../../components/team/EditMembersModal2";
import { LocationSection } from "../../components/team/LocationSection";
import { ModalTeam } from "../../components/team/ModalTeam";
import { ShortSummarySection } from "../../components/team/ShortSummarySection";
import type { ContactAddress, Member, ProductTeamResponse, ProductTeamSubmitRequest } from "../../constants";
import { AddressType, TeamOwnershipType } from "../../constants";
import { Group, userHasGroup, userIsMemberOfTeam, useUser } from "../../hooks";
import { processLink } from "../../util/config";
import { intl } from "../../util/intl/intl";
import { ModalContactTeam } from "./components/ModalContactTeam";

export const TeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const user = useUser();
  const [showMembersTable, setShowMembersTable] = useState(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showMemberModal, setShowMemberModal] = useState<boolean>(false);
  const [showContactTeamModal, setShowContactTeamModal] = useState<boolean>(false);

  const teamQuery = useQuery({
    queryKey: ["getTeam", teamId],
    queryFn: () => getTeam(teamId as string),
    enabled: !!teamId,
  });

  const team = teamQuery.data;

  const productAreaQuery = useQuery({
    queryKey: ["getProductArea", team?.productAreaId],
    queryFn: () => getProductArea(team?.productAreaId as string),
    enabled: !!team?.productAreaId,
  });

  const processesQuery = useQuery({
    queryKey: ["getProcessesForTeam", teamId],
    queryFn: () => getProcessesForTeam(teamId as string),
    select: (data) => sortBy(data, ["purposeName", "name"]),
    enabled: !!teamId,
  });

  const processes = processesQuery.data ?? [];

  const handleSubmit = async (values: ProductTeamSubmitRequest) => {
    let mappedContactUsers: ContactAddress[];
    const contactAddressesWithoutMail = values.contactAddresses.filter((ca) => !ca.email);

    const filteredUsersWithAddressId = values.contactAddresses
      .filter((ca) => ca.type === AddressType.SLACK_USER)
      .filter((ca) => ca.email)
      .map(async (contactUser) => await getSlackUserByEmail(contactUser.email || ""));
    try {
      const resolvedSlackUsersByEmail = await Promise.all(filteredUsersWithAddressId);
      mappedContactUsers = resolvedSlackUsersByEmail.map((user) => ({
        address: user.id,
        type: AddressType.SLACK_USER,
        slackChannel: { id: user.id, name: user.name },
      }));
    } catch {
      mappedContactUsers = [];
    }

    const editResponse = await editTeam({
      ...values,
      contactAddresses: [...contactAddressesWithoutMail, ...mappedContactUsers],
    });
    await teamQuery.refetch();
    await productAreaQuery.refetch();
    await processesQuery.refetch();
    if (editResponse.id) {
      setShowEditModal(false);
    }
  };

  const updateMemberOfTeamMutation = useMutation<ProductTeamResponse, unknown, Member>(async (newOrUpdatedMember) => {
    if (!team) {
      throw new Error("Team must be defined");
    }
    const unchangedMembers = (team?.members ?? []).filter((member) => newOrUpdatedMember.navIdent !== member.navIdent);

    // For some reason the API types for officehours are different for the request and response.
    // Because updating a member requires putting the whole team officeHours must be reformatted to its request-format.
    const formattedOfficeHours = team.officeHours
      ? {
          locationCode: team.officeHours.location.code,
          days: team.officeHours.days,
          information: team.officeHours.information,
        }
      : undefined;

    const updatedTeam = {
      ...team,
      teamOwnershipType: team.teamOwnershipType ?? TeamOwnershipType.UNKNOWN,
      officeHours: formattedOfficeHours,
      members: [...unchangedMembers, newOrUpdatedMember],
    };
    return editTeam(updatedTeam);
  });

  useEffect(() => {
    if (team) {
      document.title = `Teamkatalogen - ${team.name}`;
    }
  }, [team]);

  if (!team) {
    return <></>;
  }

  return (
    <div>
      <PageHeader status={team.status} title={team.name}>
        {userHasGroup(user, Group.WRITE) && (
          <Button
            icon={<PencilFillIcon aria-hidden />}
            onClick={() => setShowEditModal(true)}
            size="medium"
            variant="secondary"
          >
            {intl.edit}
          </Button>
        )}
        <Button
          icon={<EnvelopeClosedFillIcon aria-hidden />}
          onClick={() => setShowContactTeamModal(true)}
          size="medium"
          variant="secondary"
        >
          Kontakt team
        </Button>
        <SubscribeToUpdates notificationType={NotificationType.TEAM} target={teamId} />
      </PageHeader>

      <ResourceInfoLayout expandFirstSection>
        <DescriptionSection header="Om oss" text={<Markdown source={team.description} />} />
        <ShortSummarySection
          contactAddresses={userIsMemberOfTeam(user, team) ? team.contactAddresses : []}
          productArea={productAreaQuery.data}
          team={team}
        />
        <LocationSection
          contactAddresses={userIsMemberOfTeam(user, team) ? team.contactAddresses : []}
          productArea={productAreaQuery.data}
          team={team}
        />
      </ResourceInfoLayout>

      <LargeDivider />

      <MemberHeaderWithActions members={team.members} title="Medlemmer">
        {userHasGroup(user, Group.WRITE) && (
          <Button
            icon={<PencilFillIcon aria-hidden />}
            onClick={() => setShowMemberModal(true)}
            size="medium"
            variant="secondary"
          >
            Endre medlemmer
          </Button>
        )}

        {teamId && <MemberExportForTeam teamId={teamId} />}
        <Button
          icon={showMembersTable ? <PersonRectangleIcon /> : <TableIcon />}
          onClick={() => setShowMembersTable((previousValue) => !previousValue)}
          size="medium"
          variant="secondary"
        >
          {showMembersTable ? "Kortvisning" : "Tabellvisning"}
        </Button>
      </MemberHeaderWithActions>
      {showMembersTable ? <MembersTable members={team.members} /> : <Members members={team.members} />}

      <LargeDivider />

      <div
        className={css`
          display: flex;
          flex-wrap: wrap;
          column-gap: 5rem;
          row-gap: 2rem;
        `}
      >
        <div>
          <Heading level="2" size="medium" spacing>
            Behandlinger i Behandlingskatalogen ({processes.length})
          </Heading>
          {processes.length === 0 && <span>Ingen behandlinger registrert i Behandlingskatalogen</span>}
          {processes.map((process) => (
            <Link href={processLink(process)} key={process.id} rel="noopener noreferrer" target="_blank">
              {process.purposeName + ": " + process.name}
            </Link>
          ))}
        </div>
        <div>
          <Heading level="2" size="medium" spacing>
            Risikovurderinger (ROS) i TryggNok
          </Heading>

          <Link
            href={`https://apps.powerapps.com/play/f8517640-ea01-46e2-9c09-be6b05013566?app=645&Teamkatalogen_TeamID=${team.id}`}
            rel={"noopener"}
            target={"_blank"}
          >
            Risikovurderinger for {team.name}
          </Link>
        </div>
      </div>
      <ModalTeam
        initialValues={mapProductTeamToFormValue(team)}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmitForm={(values: ProductTeamSubmitRequest) => handleSubmit(values)}
        title="Rediger team"
      />
      <EditMembersModal2
        members={team.members}
        onClose={() => setShowMemberModal(false)}
        open={showMemberModal}
        updateMemberOfTeamMutation={updateMemberOfTeamMutation}
      />
      <ModalContactTeam
        isOpen={showContactTeamModal}
        onClose={() => setShowContactTeamModal(false)}
        team={team}
        title={"Kontakt team"}
      />
      <LastModifiedBy changeStamp={team.changeStamp} />
    </div>
  );
};
