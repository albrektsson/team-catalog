import {DefaultTreeMapDatum, NodeComponent, ResponsiveTreeMap, TreeMapDataProps, TreeMapSvgProps} from '@nivo/treemap'
import React, { Component, useEffect, useState } from 'react'
import { useAllProductAreas, useAllTeams } from '../../api'
import { Block } from 'baseui/block'
import { theme } from '../../util'
import { CustomSpinner } from '../common/Spinner'
import * as _ from 'lodash'
import randomColor from 'randomcolor'
import { Member, ProductTeam, TeamRole } from '../../constants'
import { LabelMedium, LabelSmall } from 'baseui/typography'
import { intl } from '../../util/intl/intl'
import { ObjectType } from '../admin/audit/AuditTypes'
import {useNavigate} from 'react-router-dom'
import { urlForObject } from '../common/RouteLink'
import {ComputedNode, NodeMouseEventHandler} from "@nivo/treemap/dist/types/types";
import {borderColor} from "../common/Style";

const formatTeamName = (name: string) => (name.toLowerCase().startsWith('team') && name.length > 4 ? _.upperFirst(name.substr(4).trim()) : name)

const colors = Object.values(TeamRole).reduce((val, id) => {
  val[id] = randomColor({ seed: id })
  return val
}, {} as { [id: string]: string })

const count = (str: string, char: string) => _.countBy(str)[char] || 0

export const Treemap = () => {
  const teams = useAllTeams()
  const areas = useAllProductAreas()
  const [data, setData] = useState<Node>()
  const [focusPath, setFocusPath] = useState<string | undefined>()
  const navigate = useNavigate()

  const isArea = (area: string) => focusPath?.indexOf(`NAV.${area}`) === 0
  const isTeam = (area: string, team: string) => focusPath?.indexOf(`NAV.${area}.${team}`) === 0

  useEffect(() => {
    const mapArea = (areaId: string, areaName: string, amembers: Member[], ateams: ProductTeam[]): Node => {
      const filteredTeams = ateams.filter((t) => !!t.members.length)
      return {
        id: areaId,
        name: areaName,
        formatName: `${areaName} (${filteredTeams.length})`,
        members: _.sumBy(filteredTeams, (t) => t.members.length),
        type: ObjectType.ProductArea,
        children:
          !focusPath || isArea(areaId)
            ? [
                ...filteredTeams.map((t) => {
                  // if expanded value takes up space not allocated to members
                  const teamFocused = isTeam(areaId, t.id)
                  const otherTeamFocused = focusPath && !teamFocused && count(focusPath, '.') >= 2
                  const value = teamFocused ? 0.0000001 : otherTeamFocused ? 1 : t.members.length
                  return {
                    id: t.id,
                    name: t.name,
                    formatName: formatTeamName(t.name),
                    members: t.members.length,
                    value,
                    type: ObjectType.Team,
                    children: teamFocused
                      ? t.members.map((m) => ({
                          id: m.navIdent,
                          name: m.resource.fullName || m.navIdent,
                          value: 1,
                          type: ObjectType.Resource,
                          roles: m.roles,
                        }))
                      : [],
                  }
                }),
                ...(isArea(areaId)
                  ? amembers.map((m) => ({
                      id: m.navIdent,
                      name: m.resource.fullName || m.navIdent,
                      value: 0.5,
                      type: ObjectType.Resource,
                      roles: m.roles,
                    }))
                  : []),
              ]
            : [],
      }
    }

    setData({
      id: 'NAV',
      name: 'NAV',
      type: 'root',
      children: [
        ...areas.map((a) =>
          mapArea(
            a.id,
            a.name,
            a.members,
            teams.filter((t) => t.productAreaId === a.id)
          )
        ),
        mapArea(
          'noid',
          'Ingen område',
          [],
          teams.filter((t) => !t.productAreaId)
        ),
      ].filter((a) => !!a.children!.length),
    })
  }, [teams, areas, focusPath])

  return (
    <Block display="flex" width="100%" flexDirection="column">
      <Block marginBottom={theme.sizing.scale600}>
        <LabelSmall>Trykk på område for å se kun området. Trykk på team for å se medlemmer. Ctrl/Cmd klikk for å gå til område/team/person</LabelSmall>
      </Block>
      <Block width="100%" height="85vh">
        {data && (
          <Map
            data={data}
            onClick={(node, event) => {
              const dataNode = node.data as Node
              setFocusPath(dataNode.type === 'root' || isArea(dataNode.id) ? undefined : node.path)
              if ((event.ctrlKey || event.metaKey) && dataNode.type !== 'root') navigate(urlForObject(dataNode.type, dataNode.id))
            }}
          />
        )}
        {!data && <CustomSpinner size={theme.sizing.scale800} />}
      </Block>
    </Block>
  )
}

function withTooltip<T>(WrappedComponent: any) {
  return class extends Component<Tooltip & T> {
    public render() {
      return <WrappedComponent {...this.props} />
    }
  }
}

//const Tree = withTooltip<TreeMapSvgProps>(ResponsiveTreeMap)
//const Tree = withTooltip<TreeMapSvgProps<DefaultTreeMapDatum,"height">>(ResponsiveTreeMap)


const Map = (props: { data: Node; onClick: NodeMouseEventHandler<DefaultTreeMapDatum> }) => (
  <ResponsiveTreeMap

    data={props.data}
    label={((node: { data: Node }) => node.data.formatName || node.data.name) as any}
    parentLabel={((node: { data: Node }) => node.data.formatName || node.data.name) as any}
    parentLabelSize={30}
    parentLabelPadding={12}
    labelSkipSize={0}
    onClick={props.onClick}
    innerPadding={5}
    outerPadding={5}
    colors={{ scheme: 'paired' }}
    labelTextColor={ (node ) => {
      const data = node.data as Node
      if (data.type === ObjectType.Resource) {
        return colors[data.roles![0]]
      }
      return node.color
    }}
    tooltip={(d) => {
      const data = d.node.data as Node
      // counteract .000001
      if (data.type === 'root') return <LabelMedium>{data.name}</LabelMedium>
      if (data.type !== ObjectType.Resource)
        return (
          <LabelMedium>
            {data.name} ({data.members})
          </LabelMedium>
        )
      return (
        <LabelMedium>
          {data.name}: {data.roles!.map((r: TeamRole) => intl[r]).join(', ')}
        </LabelMedium>
      )
    }}
  />
)

type Node = {
  id: string
  name: string
  formatName?: string
  color?: string
  children?: Node[]
  value?: any
  type: ObjectType | 'root'
  roles?: TeamRole[]
  members?: number
}

type Tooltip = {
  tooltip: (d: { node: ComputedNode<DefaultTreeMapDatum> }) => React.ReactNode
}
