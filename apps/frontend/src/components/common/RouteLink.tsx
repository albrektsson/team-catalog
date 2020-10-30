import {useHistory} from "react-router-dom";
import {StyledLink} from "baseui/link"
import React from "react"
import {AuditItem, NavigableItem, ObjectType} from '../admin/audit/AuditTypes'
import {useStyletron} from 'baseui'
import {Block} from 'baseui/block'
import {AuditButton} from '../admin/audit/AuditButton'
import {KIND} from 'baseui/button'

type RouteLinkProps = {
  href: string,
  hideUnderline?: boolean
  plain?: boolean
} & any

const RouteLink = (props: RouteLinkProps) => {
  const {hideUnderline, plain, ...restprops} = props
  const history = useHistory()
  const [useCss] = useStyletron();
  const linkCss = useCss({
    textDecoration: hideUnderline ? 'none' : undefined,
  });

  const onClick = (e: Event) => {
    e.preventDefault()
    history.push(props.href)
  }

  if (plain) {
    return (
      <div {...restprops} style={{width: '100%', height: '100%', cursor: 'pointer'}} onClick={onClick}/>
    )
  }

  return (
    <StyledLink className={linkCss} {...restprops} onClick={onClick}/>
  )
}

export default RouteLink

type ObjectLinkProps = {
  id: string
  type: NavigableItem
  audit?: AuditItem
  withHistory?: boolean
  children?: any
  disable?: boolean
  hideUnderline?: boolean
}

export const urlForObject = (type: NavigableItem, id: string, audit?: AuditItem) => {
  switch (type) {
    case ObjectType.Team:
      return `/team/${id}`
    case ObjectType.ProductArea:
      return `/area/${id}`
    case ObjectType.Resource:
      return `/resource/${id}`
    case ObjectType.Tag:
      return `/tag/${id.match(/.*_/)!.pop()!.slice(0, -1)}`
    case ObjectType.Settings:
      return `/admin/settings`
  }
  console.warn('couldn\'t find object type ' + type)
  return ''
}

export const ObjectLink = (props: ObjectLinkProps) => {
  const [useCss] = useStyletron();
  const linkCss = useCss({textDecoration: 'none'});

  const link =
    props.disable ? props.children :
      <RouteLink href={urlForObject(props.type, props.id, props.audit)}
                 className={props.hideUnderline ? linkCss : undefined}>
        {props.children}
      </RouteLink>

  return props.withHistory ?
    <Block display="flex" justifyContent="space-between" width="100%" alignItems="center">
      {link}
      <AuditButton id={props.id} kind={KIND.tertiary}/>
    </Block> :
    link
}
