import { css } from "@emotion/css";

import calendarIcon from "../../assets/calendarWhite.svg";
import emailIcon from "../../assets/emailWhite.svg";
import identIcon from "../../assets/identWhite.svg";
import type { Resource } from "../../constants";
import { ResourceInfoContainer } from "../common/ResourceInfoContainer";
import { TextWithLabel } from "../TextWithLabel";

const containerCss = css`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

type AboutUsSectionProperties = {
  resource: Resource;
};

const ShortSummaryResource = (properties: AboutUsSectionProperties) => {
  const { resource } = properties;

  return (
    <ResourceInfoContainer title="Kort fortalt">
      <div className={containerCss}>
        <img alt="Lokasjon" src={identIcon} />
        <TextWithLabel label="NAV-ident" text={resource.navIdent} />
      </div>

      <div className={containerCss}>
        <img alt="E-post" src={emailIcon} />
        <TextWithLabel label="E-post" text={resource.email} />
      </div>

      <div className={containerCss}>
        <img alt="Startdato" src={calendarIcon} />
        <TextWithLabel label="Startdato" text={resource.startDate} />
      </div>
    </ResourceInfoContainer>
  );
};

export default ShortSummaryResource;
