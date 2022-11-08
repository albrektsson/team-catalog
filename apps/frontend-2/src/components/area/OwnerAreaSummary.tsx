import { css } from "@emotion/css";
import React from "react";

import { getResourceUnitsById } from "../../api";
import type { ProductArea, Resource } from "../../constants";
import { ResourceInfoContainer } from "../common/ResourceInfoContainer";
import { TextWithLabel } from "../TextWithLabel";

interface OwnerAreaSummaryProperties {
  productArea: ProductArea;
}

const ProductAreaOwnerResource = (properties: { resource: Resource }): JSX.Element => {
  const [departmentInfo, setDepartmentInfo] = React.useState<string>("(loading)");
  const { navIdent, fullName } = properties.resource;

  React.useEffect(() => {
    getResourceUnitsById(navIdent)
      .then((it) => {
        const newTxt: string = it?.units[0]?.parentUnit?.name ?? "";
        setDepartmentInfo("(" + newTxt + ")");
      })
      .catch((error) => {
        console.error(error.message);
        setDepartmentInfo("(fant ikke avdeling)");
      });
  }, [navIdent]);

  return (
    <div
      className={css`
        margin-bottom: 8px;
      `}
    >
      <div
        className={css`
          display: inline;
        `}
      >
        <a href={`/resource/${navIdent}`}>{fullName}</a>
        <div
          className={css`
            margin-left: 10px;
            display: inline;
          `}
        >
          {departmentInfo}
        </div>
      </div>
    </div>
  );
};

const OwnerAreaSummary = (properties: OwnerAreaSummaryProperties) => {
  const { productArea } = properties;

  return (
    <ResourceInfoContainer title="Eiere">
      {productArea.paOwnerGroup?.ownerResource ? (
        <TextWithLabel
          label={"Produktområde eier"}
          text={<ProductAreaOwnerResource resource={productArea.paOwnerGroup.ownerResource} />}
        />
      ) : (
        <TextWithLabel label="Produktområde eier" text={"Ingen eier"} />
      )}
      {productArea.paOwnerGroup?.ownerGroupMemberResourceList?.length ?? 0 > 0 ? (
        <TextWithLabel
          label={"Produktområde eiergruppe"}
          text={productArea.paOwnerGroup?.ownerGroupMemberResourceList.map((it) => {
            return <ProductAreaOwnerResource key={it.navIdent} resource={it} />;
          })}
        />
      ) : (
        <TextWithLabel label={"Produktområde eiergruppe"} text={"Ingen eiergrupper"} />
      )}
    </ResourceInfoContainer>
  );
};

export default OwnerAreaSummary;
